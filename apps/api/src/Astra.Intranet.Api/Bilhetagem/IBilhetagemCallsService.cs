namespace Astra.Intranet.Api.Bilhetagem;

public interface IBilhetagemCallsService
{
    string SourceName { get; }

    Task<BilhetagemCallReportResult> GenerateReportAsync(
        BilhetagemCallReportFilter filter,
        CancellationToken cancellationToken);
}
