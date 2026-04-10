namespace Astra.Intranet.Api.Bilhetagem;

public interface IBilhetagemDirectoryService
{
    string SourceName { get; }

    Task<BilhetagemDirectorySearchResult> SearchAsync(
        BilhetagemSearchMode mode,
        string query,
        CancellationToken cancellationToken);

    Task<BilhetagemDirectoryUpsertResult> UpsertAsync(
        BilhetagemDirectoryUpsertRequest request,
        CancellationToken cancellationToken);
}
