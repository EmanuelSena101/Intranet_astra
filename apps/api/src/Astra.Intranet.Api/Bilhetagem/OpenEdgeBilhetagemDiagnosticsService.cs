using System.Data;
using System.Data.Common;
using System.Data.Odbc;
using Astra.Intranet.Api.Shared.OpenEdge;
using Microsoft.Extensions.Options;

namespace Astra.Intranet.Api.Bilhetagem;

public sealed class OpenEdgeBilhetagemDiagnosticsService(
    IOpenEdgeConnectionFactory connectionFactory,
    IOptions<BilhetagemOptions> bilhetagemOptions)
{
    private readonly IOpenEdgeConnectionFactory _connectionFactory = connectionFactory;
    private readonly BilhetagemOptions _bilhetagemOptions = bilhetagemOptions.Value;

    public async Task<BilhetagemDiagnosticsResult> DiagnoseAsync(CancellationToken cancellationToken)
    {
        if (!_connectionFactory.IsConfigured)
        {
            return new BilhetagemDiagnosticsResult(
                "not-configured",
                "Conexao OpenEdge nao configurada.",
                BuildUnconfiguredProbes("Conexao OpenEdge nao configurada."));
        }

        try
        {
            using var connection = (OdbcConnection)_connectionFactory.CreateConnection();
            await connection.OpenAsync(cancellationToken);

            var probes = new List<BilhetagemDiagnosticsProbe>
            {
                await ProbeDirectoryAsync(connection, cancellationToken),
                await ProbeCallsAsync(connection, cancellationToken),
                await ProbeUsersAsync(connection, cancellationToken)
            };

            return new BilhetagemDiagnosticsResult(
                "ok",
                "Conexao OpenEdge estabelecida.",
                probes);
        }
        catch (Exception exception)
        {
            return new BilhetagemDiagnosticsResult(
                "error",
                exception.Message,
                BuildUnconfiguredProbes(exception.Message));
        }
    }

    private async Task<BilhetagemDiagnosticsProbe> ProbeDirectoryAsync(
        OdbcConnection connection,
        CancellationToken cancellationToken)
    {
        var directoryOptions = _bilhetagemOptions.Directory;

        if (string.Equals(directoryOptions.Provider, "mock", StringComparison.OrdinalIgnoreCase))
        {
            return InactiveProbe("directory", "Diretorio", "Provider configurado como mock.");
        }

        if (string.IsNullOrWhiteSpace(directoryOptions.TableName))
        {
            return NotConfiguredProbe("directory", "Diretorio", "Tabela nao informada.");
        }

        return await ProbeAsync(
            connection,
            "directory",
            "Diretorio",
            directoryOptions.TableName,
            [
                ("numero", "numero"),
                ("descricao", "descricao")
            ],
            cancellationToken);
    }

    private async Task<BilhetagemDiagnosticsProbe> ProbeCallsAsync(
        OdbcConnection connection,
        CancellationToken cancellationToken)
    {
        var callsOptions = _bilhetagemOptions.Calls;

        if (string.Equals(callsOptions.Provider, "mock", StringComparison.OrdinalIgnoreCase))
        {
            return InactiveProbe("calls", "Ligacoes", "Provider configurado como mock.");
        }

        if (string.IsNullOrWhiteSpace(callsOptions.CallsTableName))
        {
            return NotConfiguredProbe("calls", "Ligacoes", "Tabela principal nao informada.");
        }

        return await ProbeAsync(
            connection,
            "calls",
            "Ligacoes",
            callsOptions.CallsTableName,
            [
                (callsOptions.DateField, "data"),
                (callsOptions.TimeField, "hora"),
                (callsOptions.ExtensionField, "ramal"),
                (callsOptions.NumberField, "numero"),
                (callsOptions.DurationField, "duracao"),
                (callsOptions.TypeCodeField, "tipo"),
                (callsOptions.CityField, "cidade"),
                (callsOptions.StateField, "estado"),
                (callsOptions.CostField, "custo"),
                (callsOptions.DestinationField, "destino"),
                (callsOptions.OwnerIdField, "usuario")
            ],
            cancellationToken);
    }

    private async Task<BilhetagemDiagnosticsProbe> ProbeUsersAsync(
        OdbcConnection connection,
        CancellationToken cancellationToken)
    {
        var callsOptions = _bilhetagemOptions.Calls;

        if (string.Equals(callsOptions.Provider, "mock", StringComparison.OrdinalIgnoreCase))
        {
            return InactiveProbe("users", "Usuarios", "Provider configurado como mock.");
        }

        if (string.IsNullOrWhiteSpace(callsOptions.UsersTableName))
        {
            return NotConfiguredProbe("users", "Usuarios", "Tabela de usuarios nao informada.");
        }

        return await ProbeAsync(
            connection,
            "users",
            "Usuarios",
            callsOptions.UsersTableName,
            [
                (callsOptions.UserIdField, "registro"),
                (callsOptions.UserNameField, "nome")
            ],
            cancellationToken);
    }

    private static IReadOnlyCollection<BilhetagemDiagnosticsProbe> BuildUnconfiguredProbes(string message) =>
    [
        NotConfiguredProbe("directory", "Diretorio", message),
        NotConfiguredProbe("calls", "Ligacoes", message),
        NotConfiguredProbe("users", "Usuarios", message)
    ];

    private static BilhetagemDiagnosticsProbe InactiveProbe(
        string key,
        string label,
        string message) =>
        new(key, label, "inactive", message, null, []);

    private static BilhetagemDiagnosticsProbe NotConfiguredProbe(
        string key,
        string label,
        string message) =>
        new(key, label, "not-configured", message, null, []);

    private static async Task<BilhetagemDiagnosticsProbe> ProbeAsync(
        OdbcConnection connection,
        string key,
        string label,
        string tableName,
        IReadOnlyCollection<(string ColumnName, string Alias)> columns,
        CancellationToken cancellationToken)
    {
        try
        {
            var selectColumns = string.Join(
                ", ",
                columns.Select(column =>
                    $"{OpenEdgeSqlIdentifier.Quote(column.ColumnName)} as {OpenEdgeSqlIdentifier.Quote(column.Alias)}"));

            var commandText = $"""
                select {selectColumns}
                from {OpenEdgeSqlIdentifier.Quote(tableName)}
                where 1 = 0
                """;

            using var command = new OdbcCommand(commandText, connection);
            using var reader = await command.ExecuteReaderAsync(
                CommandBehavior.SchemaOnly,
                cancellationToken);

            var aliases = Enumerable.Range(0, reader.FieldCount)
                .Select(reader.GetName)
                .ToArray();

            return new BilhetagemDiagnosticsProbe(
                key,
                label,
                "ok",
                "Tabela e colunas acessiveis.",
                tableName,
                aliases);
        }
        catch (Exception exception)
        {
            return new BilhetagemDiagnosticsProbe(
                key,
                label,
                "error",
                exception.Message,
                tableName,
                []);
        }
    }
}
