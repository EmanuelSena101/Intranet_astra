using System.Data.Common;
using System.Data.Odbc;
using Microsoft.Extensions.Options;

namespace Astra.Intranet.Api.Shared.OpenEdge;

/// <summary>
/// Fábrica ODBC padrão para o Progress OpenEdge.
/// Resolve a connection string a partir de <see cref="global::OpenEdgeOptions"/>.
/// </summary>
public sealed class OpenEdgeConnectionFactory : IOpenEdgeConnectionFactory
{
    private readonly global::OpenEdgeOptions _options;

    public OpenEdgeConnectionFactory(IOptions<global::OpenEdgeOptions> options)
    {
        _options = options.Value;
    }

    public string? ConnectionString => _options.BuildConnectionString();

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ConnectionString);

    public string? DataSourceName
    {
        get
        {
            if (!string.IsNullOrWhiteSpace(_options.Dsn))
            {
                return _options.Dsn;
            }

            if (!string.IsNullOrWhiteSpace(_options.Host))
            {
                return _options.Port is > 0
                    ? $"{_options.Host}:{_options.Port}"
                    : _options.Host;
            }

            return null;
        }
    }

    public string? DatabaseName => string.IsNullOrWhiteSpace(_options.Database)
        ? null
        : _options.Database;

    public DbConnection CreateConnection()
    {
        var connectionString = ConnectionString;

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "OpenEdge connection is not configured. Preencha OPENEDGE_* em infra/docker/.env ou OpenEdge__* em appsettings.");
        }

        return new OdbcConnection(connectionString);
    }
}
