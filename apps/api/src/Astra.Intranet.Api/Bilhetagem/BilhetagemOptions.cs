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
    public string Provider { get; init; } = "auto";
    public string? CallsTableName { get; init; }
    public string? DirectoryTableName { get; init; }
    public string? UsersTableName { get; init; }
    public string DateField { get; init; } = "data";
    public string TimeField { get; init; } = "hora";
    public string ExtensionField { get; init; } = "ramal";
    public string NumberField { get; init; } = "numero";
    public string DurationField { get; init; } = "duracao";
    public string TypeCodeField { get; init; } = "fl-ligacao";
    public string CityField { get; init; } = "cidade";
    public string StateField { get; init; } = "uf";
    public string CostField { get; init; } = "custo";
    public string DestinationField { get; init; } = "ramal-solicitado";
    public string OwnerIdField { get; init; } = "fc-codigo";
    public string DirectoryNumberField { get; init; } = "numero";
    public string DirectoryDescriptionField { get; init; } = "descricao";
    public string UserIdField { get; init; } = "registro";
    public string UserNameField { get; init; } = "nome";
}
