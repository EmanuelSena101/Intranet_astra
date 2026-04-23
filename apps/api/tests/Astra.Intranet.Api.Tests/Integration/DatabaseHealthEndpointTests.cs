using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.Memory;
using Xunit;

namespace Astra.Intranet.Api.Tests.Integration;

/// <summary>
/// Teste de integração do endpoint <c>GET /api/health/database</c> subindo a
/// API em memória via <see cref="WebApplicationFactory{TEntryPoint}"/>.
///
/// Rodamos em modo mock (sem variáveis OpenEdge preenchidas) para validar que
/// a stack sobe sem ODBC real e o endpoint responde 200 com
/// <c>dataSource: mock</c>, conforme DoD da task.
/// </summary>
public class DatabaseHealthEndpointTests : IClassFixture<MockModeApiFactory>
{
    private readonly MockModeApiFactory _factory;

    public DatabaseHealthEndpointTests(MockModeApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GET_health_database_retorna_200_com_dataSource_mock_quando_OpenEdge_nao_configurado()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/health/database");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<HealthPayload>();
        Assert.NotNull(payload);
        Assert.Equal("ok", payload!.Status);
        Assert.Equal("mock", payload.DataSource);
        Assert.False(payload.Slow);
    }

    private sealed record HealthPayload(
        string Status,
        string DataSource,
        string? Database,
        long ElapsedMs,
        bool Slow);
}

/// <summary>
/// WebApplicationFactory customizada que força o ambiente de testes a subir
/// sem conexão OpenEdge (modo mock), independentemente do que houver em
/// variáveis de ambiente externas.
/// </summary>
public sealed class MockModeApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["OpenEdge:ConnectionString"] = string.Empty,
                ["OpenEdge:Dsn"] = string.Empty,
                ["OpenEdge:Host"] = string.Empty,
                ["OpenEdge:Port"] = "0",
                ["OpenEdge:Database"] = string.Empty,
                ["OpenEdge:Username"] = string.Empty,
                ["OpenEdge:Password"] = string.Empty,
                ["Bilhetagem:Directory:Provider"] = "mock",
                ["Bilhetagem:Calls:Provider"] = "mock",
                ["DocWeb:Provider"] = "mock"
            });
        });
    }
}
