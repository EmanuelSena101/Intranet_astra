using System.Data.Common;

namespace Astra.Intranet.Api.Shared.OpenEdge;

/// <summary>
/// Cria conexões ODBC para o banco corporativo Progress OpenEdge.
/// Abstrai a criação para permitir mockar em testes e centralizar a
/// leitura das opções <see cref="global::OpenEdgeOptions"/>.
/// </summary>
public interface IOpenEdgeConnectionFactory
{
    /// <summary>
    /// Indica que existe uma connection string válida configurada (direta, via DSN
    /// ou via Host+Database). Quando falso, a aplicação deve cair em modo mock.
    /// </summary>
    bool IsConfigured { get; }

    /// <summary>
    /// Connection string resolvida. <c>null</c> quando não configurada.
    /// </summary>
    string? ConnectionString { get; }

    /// <summary>
    /// Nome lógico da fonte de dados (por exemplo, a DSN ou o host).
    /// </summary>
    string? DataSourceName { get; }

    /// <summary>
    /// Nome do banco configurado, quando disponível.
    /// </summary>
    string? DatabaseName { get; }

    /// <summary>
    /// Cria (sem abrir) uma nova <see cref="DbConnection"/> apontando para o OpenEdge.
    /// Lança <see cref="InvalidOperationException"/> se não houver configuração.
    /// </summary>
    DbConnection CreateConnection();
}
