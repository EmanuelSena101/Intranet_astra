namespace Astra.Intranet.Api.DocWeb;

public interface IDocWebDocumentService
{
    string SourceName { get; }

    DocWebModuleSnapshot GetSnapshot();

    Task<DocWebDocumentSearchResult> SearchAsync(
        DocWebDocumentSearchFilter filter,
        CancellationToken cancellationToken);

    Task<DocWebDocumentUpsertResult> UpsertAsync(
        DocWebDocumentUpsertRequest request,
        CancellationToken cancellationToken);
}
