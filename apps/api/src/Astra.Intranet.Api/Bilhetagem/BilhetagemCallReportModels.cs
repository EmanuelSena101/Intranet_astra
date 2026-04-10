namespace Astra.Intranet.Api.Bilhetagem;

public enum BilhetagemCallDirection
{
    Received,
    Performed,
    Both
}

public enum BilhetagemCallScope
{
    Internal,
    External,
    Both
}

public enum BilhetagemCallTargetType
{
    Extension,
    Number
}

public enum BilhetagemCallView
{
    Summary,
    Detailed
}

public sealed record BilhetagemCallReportRequest(
    string Direction,
    string Scope,
    string TargetType,
    string View,
    string StartDate,
    string EndDate,
    string? ExtensionStart,
    string? ExtensionEnd,
    string? Number);

public sealed record BilhetagemCallReportFilter(
    BilhetagemCallDirection Direction,
    BilhetagemCallScope Scope,
    BilhetagemCallTargetType TargetType,
    BilhetagemCallView View,
    DateOnly StartDate,
    DateOnly EndDate,
    string? ExtensionStart,
    string? ExtensionEnd,
    string? Number);

public sealed record BilhetagemCallReportFilters(
    string Direction,
    string Scope,
    string TargetType,
    string View,
    string StartDate,
    string EndDate,
    string? ExtensionStart,
    string? ExtensionEnd,
    string? Number);

public sealed record BilhetagemCallReportSummary(
    int TotalCalls,
    string TotalDuration,
    decimal TotalCost);

public sealed record BilhetagemCallReportGroup(
    string Label,
    int TotalCalls,
    string TotalDuration,
    string AverageDuration);

public sealed record BilhetagemCallReportItem(
    string Date,
    string Time,
    string Direction,
    string Scope,
    string Origin,
    string Destination,
    string TypeCode,
    string Duration,
    string Description,
    string City,
    string User,
    decimal Cost);

public sealed record BilhetagemCallReportResult(
    string Source,
    BilhetagemCallReportFilters Filters,
    BilhetagemCallReportSummary Summary,
    IReadOnlyCollection<BilhetagemCallReportGroup> Groups,
    IReadOnlyCollection<BilhetagemCallReportItem> Items);
