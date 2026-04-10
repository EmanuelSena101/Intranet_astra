namespace Astra.Intranet.Api.Bilhetagem;

public sealed record BilhetagemDiagnosticsResult(
    string ConnectionStatus,
    string ConnectionMessage,
    IReadOnlyCollection<BilhetagemDiagnosticsProbe> Probes);

public sealed record BilhetagemDiagnosticsProbe(
    string Key,
    string Label,
    string Status,
    string Message,
    string? TableName,
    IReadOnlyCollection<string> Columns);
