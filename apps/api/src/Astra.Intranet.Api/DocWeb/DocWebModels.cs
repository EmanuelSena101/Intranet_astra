namespace Astra.Intranet.Api.DocWeb;

public enum DocWebDocumentStatusFilter
{
    Active,
    Cancelled,
    All
}

public enum DocWebDocumentVisibilityFilter
{
    All,
    Published,
    Internal
}

public enum DocWebDocumentUpsertStatus
{
    Created,
    Updated
}

public sealed record DocWebDocumentEntry(
    string DocumentNumber,
    string SectorCode,
    string Title,
    string FileName,
    decimal FileSizeKilobytes,
    string DocumentDate,
    string DocumentTime,
    string StatusCode,
    string? ExpirationDate,
    int RepresentativeCount);

public sealed record DocWebDocumentSearchFilter(
    string? Query,
    DocWebDocumentStatusFilter Status,
    DocWebDocumentVisibilityFilter Visibility);

public sealed record DocWebDocumentSearchResult(
    string Source,
    string Query,
    string Status,
    string Visibility,
    IReadOnlyCollection<DocWebDocumentEntry> Entries);

public sealed record DocWebDocumentUpsertRequest(
    string? DocumentNumber,
    string? SectorCode,
    string? Title,
    string? FileName,
    decimal FileSizeKilobytes,
    string? ExpirationDate,
    bool PublishNow,
    int[]? RepresentativeCodes);

public sealed record DocWebDocumentUpsertResult(
    DocWebDocumentUpsertStatus Status,
    string Source,
    DocWebDocumentEntry Document,
    string Message);

public sealed record DocWebModuleSnapshot(
    int TotalDocuments,
    int PublishedDocuments,
    int CancelledDocuments);
