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

    public string SourceName => ResolveConfiguredProvider() switch
    {
        "openedge" => _openEdgeService.SourceName,
        _ => _mockService.SourceName
    };

    public async Task<BilhetagemDirectorySearchResult> SearchAsync(
        BilhetagemSearchMode mode,
        string query,
        CancellationToken cancellationToken)
    {
        var provider = ResolveConfiguredProvider();

        if (provider == "openedge")
        {
            EnsureOpenEdgeConfigured();

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
        var provider = ResolveConfiguredProvider();

        if (provider == "openedge")
        {
            EnsureOpenEdgeConfigured();

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

    private string ResolveConfiguredProvider()
    {
        var provider = (_options.Directory.Provider ?? "auto").Trim().ToLowerInvariant();

        return provider switch
        {
            "openedge" => "openedge",
            "auto" when _openEdgeService.IsConfigured => "openedge",
            _ => "mock"
        };
    }

    private bool ShouldFallbackToMock()
    {
        var provider = (_options.Directory.Provider ?? "auto").Trim().ToLowerInvariant();
        return provider == "auto";
    }

    private void EnsureOpenEdgeConfigured()
    {
        if (_openEdgeService.IsConfigured)
        {
            return;
        }

        throw new InvalidOperationException(
            "Bilhetagem directory provider is set to OpenEdge, but the connection or table name is not configured.");
    }
}
