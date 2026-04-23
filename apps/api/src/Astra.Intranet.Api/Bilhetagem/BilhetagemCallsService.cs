using Microsoft.Extensions.Options;

namespace Astra.Intranet.Api.Bilhetagem;

public sealed class BilhetagemCallsService(
    IOptions<BilhetagemOptions> options,
    MockBilhetagemCallsService mockService,
    OpenEdgeBilhetagemCallsService openEdgeService,
    ILogger<BilhetagemCallsService> logger) : IBilhetagemCallsService
{
    private readonly BilhetagemOptions _options = options.Value;
    private readonly MockBilhetagemCallsService _mockService = mockService;
    private readonly OpenEdgeBilhetagemCallsService _openEdgeService = openEdgeService;
    private readonly ILogger<BilhetagemCallsService> _logger = logger;

    public string SourceName => ResolveConfiguredProvider() switch
    {
        "openedge" => _openEdgeService.SourceName,
        _ => _mockService.SourceName
    };

    public async Task<BilhetagemCallReportResult> GenerateReportAsync(
        BilhetagemCallReportFilter filter,
        CancellationToken cancellationToken)
    {
        var provider = ResolveConfiguredProvider();

        if (provider == "openedge")
        {
            EnsureOpenEdgeConfigured();

            try
            {
                var result = await _openEdgeService.GenerateReportAsync(filter, cancellationToken);

                if (result is not null)
                {
                    return result;
                }
            }
            catch (Exception exception) when (ShouldFallbackToMock())
            {
                _logger.LogWarning(
                    exception,
                    "Bilhetagem ligacoes voltou para mock apos falha no OpenEdge.");
            }
        }

        return await _mockService.GenerateReportAsync(filter, cancellationToken);
    }

    private string ResolveConfiguredProvider()
    {
        var provider = (_options.Calls.Provider ?? "auto").Trim().ToLowerInvariant();

        return provider switch
        {
            "openedge" => "openedge",
            "auto" when _openEdgeService.IsConfigured => "openedge",
            _ => "mock"
        };
    }

    private bool ShouldFallbackToMock()
    {
        var provider = (_options.Calls.Provider ?? "auto").Trim().ToLowerInvariant();
        return provider == "auto";
    }

    private void EnsureOpenEdgeConfigured()
    {
        if (_openEdgeService.IsConfigured)
        {
            return;
        }

        throw new InvalidOperationException(
            "Bilhetagem calls provider is set to OpenEdge, but the connection or table name is not configured.");
    }
}
