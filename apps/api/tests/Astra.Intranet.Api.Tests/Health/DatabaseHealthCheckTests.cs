using System.Data.Common;
using Astra.Intranet.Api.Health;
using Astra.Intranet.Api.Shared.OpenEdge;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using Moq;
using Xunit;

namespace Astra.Intranet.Api.Tests.Health;

/// <summary>
/// Testes unitários do <see cref="DatabaseHealthCheck"/>.
///
/// A fábrica <see cref="IOpenEdgeConnectionFactory"/> é mockada com <see cref="Moq"/>;
/// onde precisamos de uma <see cref="DbConnection"/> real usamos
/// <see cref="SqliteConnection"/> in-memory (que herda de <see cref="DbConnection"/>)
/// só para validar o fluxo do health check.
/// </summary>
public class DatabaseHealthCheckTests
{
    private static IOptions<DatabaseHealthCheckOptions> BuildOptions(
        string probeQuery = "SELECT 1",
        TimeSpan? slowThreshold = null)
    {
        return Options.Create(new DatabaseHealthCheckOptions
        {
            ProbeQuery = probeQuery,
            SlowThreshold = slowThreshold ?? TimeSpan.FromSeconds(5)
        });
    }

    [Fact]
    public async Task Retorna_ok_quando_conexao_e_probe_funcionam()
    {
        var sqlite = new SqliteConnection("Data Source=:memory:");

        var factoryMock = new Mock<IOpenEdgeConnectionFactory>();
        factoryMock.SetupGet(f => f.IsConfigured).Returns(true);
        factoryMock.SetupGet(f => f.DataSourceName).Returns("fake-openedge");
        factoryMock.SetupGet(f => f.DatabaseName).Returns("bilhetagem");
        factoryMock.Setup(f => f.CreateConnection()).Returns(sqlite);

        var check = new DatabaseHealthCheck(
            factoryMock.Object,
            BuildOptions(probeQuery: "SELECT 1"));

        var result = await check.CheckAsync(CancellationToken.None);

        Assert.Equal("ok", result.Status);
        Assert.Equal("openedge", result.DataSource);
        Assert.False(result.Slow);
        Assert.Null(result.Message);
        Assert.True(result.ElapsedMs >= 0);
        factoryMock.Verify(f => f.CreateConnection(), Times.Once);
    }

    [Fact]
    public async Task Retorna_mock_quando_nao_ha_configuracao_OpenEdge()
    {
        var factoryMock = new Mock<IOpenEdgeConnectionFactory>();
        factoryMock.SetupGet(f => f.IsConfigured).Returns(false);

        var check = new DatabaseHealthCheck(factoryMock.Object, BuildOptions());

        var result = await check.CheckAsync(CancellationToken.None);

        Assert.Equal("mock", result.Status);
        Assert.Equal("mock", result.DataSource);
        Assert.Equal(0, result.ElapsedMs);
        Assert.False(result.Slow);
        factoryMock.Verify(f => f.CreateConnection(), Times.Never);
    }

    [Fact]
    public async Task Retorna_error_com_code_503_quando_probe_lanca_excecao()
    {
        // SqliteConnection para um arquivo inexistente em modo ReadOnly
        // falha de forma determinística no OpenAsync.
        var badConnection = new SqliteConnection(
            "Data Source=/tmp/astra-nonexistent-db-file.sqlite;Mode=ReadOnly");

        var factoryMock = new Mock<IOpenEdgeConnectionFactory>();
        factoryMock.SetupGet(f => f.IsConfigured).Returns(true);
        factoryMock.SetupGet(f => f.DatabaseName).Returns("bilhetagem");
        factoryMock.Setup(f => f.CreateConnection()).Returns(badConnection);

        var check = new DatabaseHealthCheck(factoryMock.Object, BuildOptions());

        var result = await check.CheckAsync(CancellationToken.None);

        Assert.Equal("error", result.Status);
        Assert.Equal("openedge", result.DataSource);
        Assert.False(string.IsNullOrWhiteSpace(result.Message));
        Assert.False(string.IsNullOrWhiteSpace(result.Code));
    }

    [Fact]
    public async Task Marca_slow_true_quando_probe_excede_SlowThreshold()
    {
        var sqlite = new SqliteConnection("Data Source=:memory:");

        var factoryMock = new Mock<IOpenEdgeConnectionFactory>();
        factoryMock.SetupGet(f => f.IsConfigured).Returns(true);
        factoryMock.SetupGet(f => f.DatabaseName).Returns("bilhetagem");
        factoryMock.Setup(f => f.CreateConnection()).Returns(sqlite);

        var fakeTime = new FakeTimeProvider(DateTimeOffset.UtcNow);

        var check = new DatabaseHealthCheck(
            factoryMock.Object,
            BuildOptions(probeQuery: "SELECT 1", slowThreshold: TimeSpan.FromSeconds(5)),
            timeProvider: fakeTime)
        {
            // Simula um probe que "demora" 6 segundos - sem dormir de verdade
            // avançamos o relógio fake dentro do probe.
            ProbeExecutor = (connection, probeQuery, cancellationToken) =>
            {
                fakeTime.Advance(TimeSpan.FromSeconds(6));
                return Task.CompletedTask;
            }
        };

        var result = await check.CheckAsync(CancellationToken.None);

        Assert.Equal("ok", result.Status);
        Assert.True(result.Slow, "esperava Slow=true porque o probe ultrapassou o limiar de 5s");
        Assert.True(result.ElapsedMs >= 6000,
            $"esperava ElapsedMs >= 6000 (6s), obtido {result.ElapsedMs}");
    }
}
