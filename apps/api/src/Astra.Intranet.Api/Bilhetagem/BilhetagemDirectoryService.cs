using Microsoft.Extensions.Options;

namespace Astra.Intranet.Api.Bilhetagem;

public sealed class BilhetagemDirectoryService(
    IOptions<BilhetagemOptions> options,
    MockBilhetagemDirectoryService mockService,
    OpenEdgeBilhetagemDirectoryService openEdgeService) : IBilhetagemDirectoryService
{
    private readonly BilhetagemOptions _options = options.Value;
    private readonly MockBilhetagemDirectoryService _mockService = mockService;
    private readonly OpenEdgeBilhetagemDirectoryService _openEdgeService = openEdgeService;

    public string SourceName => PreferOpenEdge() ? _openEdgeService.SourceName : _mockService.SourceName;

    public async Task<BilhetagemDirectorySearchResult> SearchAsync(
        BilhetagemSearchMode mode,
        string query,
        CancellationToken cancellationToken)
    {
        if (PreferOpenEdge())
        {
            try
            {
                var result = await _openEdgeService.SearchAsync(mode, query, cancellationToken);

                if (result is not null)
                {
                    return result;
                }
            }
            catch when (ShouldFallbackToMock())
            {
            }
        }

        return await _mockService.SearchAsync(mode, query, cancellationToken);
    }

    public async Task<BilhetagemDirectoryUpsertResult> UpsertAsync(
        BilhetagemDirectoryUpsertRequest request,
        CancellationToken cancellationToken)
    {
        if (PreferOpenEdge())
        {
            try
            {
                var result = await _openEdgeService.UpsertAsync(request, cancellationToken);

                if (result is not null)
                {
                    return result;
                }
            }
            catch when (ShouldFallbackToMock())
            {
            }
        }

        return await _mockService.UpsertAsync(request, cancellationToken);
    }

    private bool PreferOpenEdge()
    {
        var provider = (_options.Directory.Provider ?? "auto").Trim().ToLowerInvariant();

        return provider switch
        {
            "openedge" => _openEdgeService.IsConfigured,
            "auto" => _openEdgeService.IsConfigured,
            _ => false
        };
    }

    private bool ShouldFallbackToMock()
    {
        var provider = (_options.Directory.Provider ?? "auto").Trim().ToLowerInvariant();
        return provider == "auto";
    }
}
