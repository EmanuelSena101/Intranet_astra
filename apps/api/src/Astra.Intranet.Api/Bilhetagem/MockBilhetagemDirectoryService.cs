namespace Astra.Intranet.Api.Bilhetagem;

public sealed class MockBilhetagemDirectoryService : IBilhetagemDirectoryService
{
    private const string SourceName = "mock";

    private readonly object _lock = new();
    private readonly List<BilhetagemDirectoryEntry> _entries =
    [
        new("1934001000", "TRANSPORTADORA MODELO"),
        new("1934002000", "REPRESENTANTE REGIONAL"),
        new("19995554444", "CLIENTE PRIORITARIO"),
        new("1140028922", string.Empty)
    ];

    public Task<BilhetagemDirectorySearchResult> SearchAsync(
        BilhetagemSearchMode mode,
        string query,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var normalizedQuery = NormalizeQuery(mode, query);

        List<BilhetagemDirectoryEntry> results;

        lock (_lock)
        {
            results = _entries
                .Where(entry => mode switch
                {
                    BilhetagemSearchMode.Number => entry.Number.StartsWith(normalizedQuery, StringComparison.OrdinalIgnoreCase),
                    BilhetagemSearchMode.Description => entry.Description.StartsWith(normalizedQuery, StringComparison.OrdinalIgnoreCase),
                    _ => false
                })
                .OrderBy(entry => entry.Description)
                .ThenBy(entry => entry.Number)
                .ToList();
        }

        return Task.FromResult(
            new BilhetagemDirectorySearchResult(
                SourceName,
                mode == BilhetagemSearchMode.Number ? "number" : "description",
                normalizedQuery,
                results));
    }

    public Task<BilhetagemDirectoryUpsertResult> UpsertAsync(
        BilhetagemDirectoryUpsertRequest request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var normalizedNumber = BuildNumber(request.Ddd, request.Telephone);
        var normalizedDescription = request.Description.Trim().ToUpperInvariant();

        lock (_lock)
        {
            var existing = _entries.FirstOrDefault(entry =>
                string.Equals(entry.Number, normalizedNumber, StringComparison.OrdinalIgnoreCase));

            if (existing is null)
            {
                var createdEntry = new BilhetagemDirectoryEntry(normalizedNumber, normalizedDescription);
                _entries.Add(createdEntry);

                return Task.FromResult(
                    new BilhetagemDirectoryUpsertResult(
                        BilhetagemDirectoryUpsertStatus.Created,
                        SourceName,
                        createdEntry,
                        "Telefone novo cadastrado com descricao."));
            }

            if (!string.IsNullOrWhiteSpace(existing.Description))
            {
                return Task.FromResult(
                    new BilhetagemDirectoryUpsertResult(
                        BilhetagemDirectoryUpsertStatus.Conflict,
                        SourceName,
                        existing,
                        "Telefone ja possui descricao cadastrada."));
            }

            var updatedEntry = existing with
            {
                Description = normalizedDescription
            };

            var index = _entries.IndexOf(existing);
            _entries[index] = updatedEntry;

            return Task.FromResult(
                new BilhetagemDirectoryUpsertResult(
                    BilhetagemDirectoryUpsertStatus.Updated,
                    SourceName,
                    updatedEntry,
                    "Descricao atualizada para telefone existente."));
        }
    }

    private static string NormalizeQuery(BilhetagemSearchMode mode, string query)
    {
        var trimmed = query.Trim();

        return mode == BilhetagemSearchMode.Number
            ? DigitsOnly(trimmed)
            : trimmed.ToUpperInvariant();
    }

    private static string BuildNumber(string? ddd, string telephone)
    {
        var sanitizedTelephone = DigitsOnly(telephone);
        var sanitizedDdd = DigitsOnly(ddd ?? string.Empty);

        if (string.IsNullOrWhiteSpace(sanitizedDdd))
        {
            return sanitizedTelephone;
        }

        return sanitizedDdd == "011"
            ? sanitizedTelephone
            : sanitizedDdd + sanitizedTelephone;
    }

    private static string DigitsOnly(string value) =>
        new(value.Where(char.IsDigit).ToArray());
}
