namespace Astra.Intranet.Api.Bilhetagem;

public sealed class BilhetagemOptions
{
    public const string SectionName = "Bilhetagem";

    public BilhetagemDirectoryOptions Directory { get; init; } = new();
    public BilhetagemCallsOptions Calls { get; init; } = new();
}

public sealed class BilhetagemDirectoryOptions
{
    public string Provider { get; init; } = "auto";
    public string? TableName { get; init; }
}

public sealed class BilhetagemCallsOptions
{
    public string Provider { get; init; } = "mock";
}
