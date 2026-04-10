namespace Astra.Intranet.Api.Bilhetagem;

public enum BilhetagemSearchMode
{
    Number,
    Description
}

public enum BilhetagemDirectoryUpsertStatus
{
    Created,
    Updated,
    Conflict
}

public sealed record BilhetagemDirectoryEntry(
    string Number,
    string Description);

public sealed record BilhetagemDirectorySearchResult(
    string Source,
    string Mode,
    string Query,
    IReadOnlyCollection<BilhetagemDirectoryEntry> Entries);

public sealed record BilhetagemDirectoryUpsertRequest(
    string? Ddd,
    string Telephone,
    string Description);

public sealed record BilhetagemDirectoryUpsertResult(
    BilhetagemDirectoryUpsertStatus Status,
    string Source,
    BilhetagemDirectoryEntry Entry,
    string Message);

