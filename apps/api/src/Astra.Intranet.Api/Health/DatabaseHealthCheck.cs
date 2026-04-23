using System.Data.Common;
using System.Data.Odbc;
using Astra.Intranet.Api.Shared.OpenEdge;
using Microsoft.Extensions.Options;

namespace Astra.Intranet.Api.Health;

/// <summary>
/// Resultado de um probe de saúde da conexão OpenEdge.
/// </summary>
public sealed class DatabaseHealthResult
{
    public required string Status { get; init; }
    public string? DataSource { get; init; }
    public string? Database { get; init; }
    public long ElapsedMs { get; init; }
    public bool Slow { get; init; }
    public string? Message { get; init; }
    public string? Code { get; init; }
}

/// <summary>
/// Opções do health check. Permite sobrescrever a query de probe e o limiar
/// de "slow" via configuração <c>OpenEdge:Health</c>.
/// </summary>
public sealed class DatabaseHealthCheckOptions
{
    public const string SectionName = "OpenEdge:Health";

    /// <summary>
    /// Query executada para validar a conexão. O default usa a tabela de sistema
    /// <c>SYSPROGRESS.SYSCALCTABLE</c> que sempre existe no OpenEdge.
    /// </summary>
    public string ProbeQuery { get; set; } = "SELECT 1 FROM SYSPROGRESS.SYSCALCTABLE";

    /// <summary>
    /// Acima deste limiar o probe é considerado "slow" (ainda retorna 200).
    /// </summary>
    public TimeSpan SlowThreshold { get; set; } = TimeSpan.FromSeconds(5);
}

/// <summary>
/// Executa um probe de saúde na conexão ODBC do OpenEdge.
/// Retorna <c>status=mock</c> quando não há configuração (modo fallback),
/// <c>status=ok</c> em sucesso (com eventual flag <c>slow</c>) e
/// <c>status=error</c> em qualquer falha de abertura ou execução.
/// </summary>
public sealed class DatabaseHealthCheck
{
    private readonly IOpenEdgeConnectionFactory _factory;
    private readonly TimeProvider _timeProvider;
    private readonly DatabaseHealthCheckOptions _options;

    public DatabaseHealthCheck(
        IOpenEdgeConnectionFactory factory,
        IOptions<DatabaseHealthCheckOptions> options,
        TimeProvider? timeProvider = null)
    {
        _factory = factory;
        _options = options.Value;
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    /// <summary>
    /// Hook para sobrescrever a execução do probe em testes. Por padrão
    /// executa a <see cref="DatabaseHealthCheckOptions.ProbeQuery"/> via
    /// <see cref="DbCommand.ExecuteScalarAsync(CancellationToken)"/>.
    /// </summary>
    public Func<DbConnection, string, CancellationToken, Task> ProbeExecutor { get; init; } =
        DefaultProbeAsync;

    public async Task<DatabaseHealthResult> CheckAsync(CancellationToken cancellationToken)
    {
        if (!_factory.IsConfigured)
        {
            return new DatabaseHealthResult
            {
                Status = "mock",
                DataSource = "mock"
            };
        }

        var startTimestamp = _timeProvider.GetTimestamp();

        try
        {
            await using var connection = _factory.CreateConnection();
            await connection.OpenAsync(cancellationToken);

            await ProbeExecutor(connection, _options.ProbeQuery, cancellationToken);

            var elapsed = _timeProvider.GetElapsedTime(startTimestamp);
            var database = !string.IsNullOrWhiteSpace(connection.Database)
                ? connection.Database
                : _factory.DatabaseName;

            return new DatabaseHealthResult
            {
                Status = "ok",
                DataSource = "openedge",
                Database = database,
                ElapsedMs = (long)elapsed.TotalMilliseconds,
                Slow = elapsed > _options.SlowThreshold
            };
        }
        catch (OdbcException odbcException)
        {
            return new DatabaseHealthResult
            {
                Status = "error",
                DataSource = "openedge",
                Database = _factory.DatabaseName,
                ElapsedMs = (long)_timeProvider.GetElapsedTime(startTimestamp).TotalMilliseconds,
                Message = odbcException.Message,
                Code = ExtractOdbcCode(odbcException)
            };
        }
        catch (Exception ex)
        {
            return new DatabaseHealthResult
            {
                Status = "error",
                DataSource = "openedge",
                Database = _factory.DatabaseName,
                ElapsedMs = (long)_timeProvider.GetElapsedTime(startTimestamp).TotalMilliseconds,
                Message = ex.Message,
                Code = ex.GetType().Name
            };
        }
    }

    private static async Task DefaultProbeAsync(
        DbConnection connection,
        string probeQuery,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = probeQuery;
        await command.ExecuteScalarAsync(cancellationToken);
    }

    private static string? ExtractOdbcCode(OdbcException exception)
    {
        if (exception.Errors.Count == 0)
        {
            return null;
        }

        var first = exception.Errors[0];
        return string.IsNullOrWhiteSpace(first.SQLState) ? first.NativeError.ToString() : first.SQLState;
    }
}
