namespace Astra.Intranet.Api.DocWeb;

public sealed class DocWebOptions
{
    public const string SectionName = "DocWeb";

    public string Provider { get; init; } = "mock";
    public string DocumentsTableName { get; init; } = string.Empty;
    public string RepresentativesTableName { get; init; } = string.Empty;
}
