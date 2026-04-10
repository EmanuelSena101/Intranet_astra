using Microsoft.Extensions.Options;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.Configure<OpenEdgeOptions>(
    builder.Configuration.GetSection(OpenEdgeOptions.SectionName));

builder.Services.AddHostedService<HeartbeatWorker>();

await builder.Build().RunAsync();

sealed class HeartbeatWorker(
    ILogger<HeartbeatWorker> logger,
    IOptions<OpenEdgeOptions> options) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        string[] modules = [
            "Bilhetagem",
            "DocWeb",
            "FichaAcomp",
            "Atendimento"
        ];

        while (!stoppingToken.IsCancellationRequested)
        {
            logger.LogInformation(
                "Worker ativo. OpenEdge configurado: {Configured}. Proximos modulos: {Modules}",
                options.Value.IsConfigured(),
                string.Join(", ", modules));

            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }
}

sealed class OpenEdgeOptions
{
    public const string SectionName = "OpenEdge";

    public string? ConnectionString { get; set; }
    public string? Dsn { get; set; }
    public string? Host { get; set; }
    public string? Database { get; set; }

    public bool IsConfigured() =>
        !string.IsNullOrWhiteSpace(ConnectionString) ||
        !string.IsNullOrWhiteSpace(Dsn) ||
        (!string.IsNullOrWhiteSpace(Host) && !string.IsNullOrWhiteSpace(Database));
}
