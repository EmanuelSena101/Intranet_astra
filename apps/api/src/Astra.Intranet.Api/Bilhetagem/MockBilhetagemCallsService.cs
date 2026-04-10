namespace Astra.Intranet.Api.Bilhetagem;

public sealed class MockBilhetagemCallsService : IBilhetagemCallsService
{
    private readonly IReadOnlyCollection<MockBilhetagemCallEntry> _entries =
    [
        new(new DateTime(2026, 4, 9, 8, 12, 0), BilhetagemCallDirection.Performed, "7330", "1140028922", "I", "00:12:30", "CLIENTE PRIORITARIO", "SAO PAULO", "Administrador de Migracao", 1.24m),
        new(new DateTime(2026, 4, 9, 8, 45, 0), BilhetagemCallDirection.Received, "1140028922", "7330", "NI", "00:03:10", "CLIENTE PRIORITARIO", "SAO PAULO", "Administrador de Migracao", 0m),
        new(new DateTime(2026, 4, 9, 9, 30, 0), BilhetagemCallDirection.Performed, "7330", "7310", "J", "00:04:20", "SALA DE TREINAMENTO - DMS", "INTERNA", "Administrador de Migracao", 0m),
        new(new DateTime(2026, 4, 9, 10, 10, 0), BilhetagemCallDirection.Performed, "7331", "1934001000", "I", "00:07:05", "TRANSPORTADORA MODELO", "CAMPINAS", "Operador Bilhetagem", 0.88m),
        new(new DateTime(2026, 4, 9, 10, 25, 0), BilhetagemCallDirection.Received, "1934002000", "7331", "INT", "00:05:55", "REPRESENTANTE REGIONAL", "AMERICANA", "Operador Bilhetagem", 0m),
        new(new DateTime(2026, 4, 8, 14, 2, 0), BilhetagemCallDirection.Performed, "7310", "399", "T", "00:01:40", "TELEFONISTA", "INTERNA", "Administrador de Migracao", 0m),
        new(new DateTime(2026, 4, 8, 15, 14, 0), BilhetagemCallDirection.Received, "5511987654321", "7310", "INT", "00:06:45", "FORNECEDOR ESTRATEGICO", "SAO PAULO", "Administrador de Migracao", 0m),
        new(new DateTime(2026, 4, 8, 16, 40, 0), BilhetagemCallDirection.Performed, "7332", "19995554444", "CO", "00:09:12", "CLIENTE PRIORITARIO", "RIO CLARO", "Operador Bilhetagem", 2.41m),
        new(new DateTime(2026, 4, 8, 17, 3, 0), BilhetagemCallDirection.Received, "7300", "7332", "J", "00:02:08", "SALA DE TREINAMENTO - DIV", "INTERNA", "Operador Bilhetagem", 0m),
        new(new DateTime(2026, 4, 7, 11, 20, 0), BilhetagemCallDirection.Performed, "7333", "551133334444", "CB", "00:10:18", "SUPORTE NACIONAL", "SAO PAULO", "Administrador de Migracao", 3.12m)
    ];

    public string SourceName => "mock";

    public Task<BilhetagemCallReportResult> GenerateReportAsync(
        BilhetagemCallReportFilter filter,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var filteredEntries = _entries
            .Where(entry => MatchesDateRange(entry, filter))
            .Where(entry => MatchesDirection(entry, filter.Direction))
            .Where(entry => MatchesScope(entry, filter.Scope))
            .Where(entry => MatchesTarget(entry, filter))
            .OrderBy(entry => entry.OccurredAt)
            .ToList();

        var totalSeconds = filteredEntries.Sum(entry => ParseDurationInSeconds(entry.Duration));
        var totalCost = filteredEntries.Sum(entry => entry.Cost);

        var summary = new BilhetagemCallReportSummary(
            filteredEntries.Count,
            FormatDuration(totalSeconds),
            decimal.Round(totalCost, 2));

        var groups = filter.View == BilhetagemCallView.Summary
            ? BuildGroups(filteredEntries)
            : [];

        var items = filter.View == BilhetagemCallView.Detailed
            ? filteredEntries.Select(ToItem).ToList()
            : [];

        return Task.FromResult(
            new BilhetagemCallReportResult(
                SourceName,
                ToFilters(filter),
                summary,
                groups,
                items));
    }

    private static BilhetagemCallReportFilters ToFilters(BilhetagemCallReportFilter filter) =>
        new(
            filter.Direction.ToString().ToLowerInvariant(),
            filter.Scope.ToString().ToLowerInvariant(),
            filter.TargetType == BilhetagemCallTargetType.Extension ? "extension" : "number",
            filter.View == BilhetagemCallView.Summary ? "summary" : "detailed",
            filter.StartDate.ToString("yyyy-MM-dd"),
            filter.EndDate.ToString("yyyy-MM-dd"),
            filter.ExtensionStart,
            filter.ExtensionEnd,
            filter.Number);

    private static List<BilhetagemCallReportGroup> BuildGroups(IEnumerable<MockBilhetagemCallEntry> entries) =>
        entries
            .GroupBy(entry => entry.PrimaryExtension())
            .Select(group =>
            {
                var totalSeconds = group.Sum(entry => ParseDurationInSeconds(entry.Duration));
                var totalCalls = group.Count();

                return new BilhetagemCallReportGroup(
                    group.Key,
                    totalCalls,
                    FormatDuration(totalSeconds),
                    FormatDuration(totalCalls == 0 ? 0 : totalSeconds / totalCalls));
            })
            .OrderBy(group => group.Label)
            .ToList();

    private static BilhetagemCallReportItem ToItem(MockBilhetagemCallEntry entry) =>
        new(
            entry.OccurredAt.ToString("yyyy-MM-dd"),
            entry.OccurredAt.ToString("HH:mm:ss"),
            entry.Direction == BilhetagemCallDirection.Performed ? "performed" : "received",
            entry.Scope() == BilhetagemCallScope.Internal ? "internal" : "external",
            entry.Origin,
            entry.Destination,
            entry.TypeCode,
            entry.Duration,
            entry.Description,
            entry.City,
            entry.User,
            decimal.Round(entry.Cost, 2));

    private static bool MatchesDateRange(MockBilhetagemCallEntry entry, BilhetagemCallReportFilter filter)
    {
        var occurredOn = DateOnly.FromDateTime(entry.OccurredAt);
        return occurredOn >= filter.StartDate && occurredOn <= filter.EndDate;
    }

    private static bool MatchesDirection(MockBilhetagemCallEntry entry, BilhetagemCallDirection direction) =>
        direction == BilhetagemCallDirection.Both || entry.Direction == direction;

    private static bool MatchesScope(MockBilhetagemCallEntry entry, BilhetagemCallScope scope) =>
        scope == BilhetagemCallScope.Both || entry.Scope() == scope;

    private static bool MatchesTarget(MockBilhetagemCallEntry entry, BilhetagemCallReportFilter filter)
    {
        if (filter.TargetType == BilhetagemCallTargetType.Number)
        {
            var normalizedNumber = DigitsOnly(filter.Number ?? string.Empty);

            return string.Equals(DigitsOnly(entry.Origin), normalizedNumber, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(DigitsOnly(entry.Destination), normalizedNumber, StringComparison.OrdinalIgnoreCase);
        }

        var rangeStart = int.Parse(filter.ExtensionStart ?? "0000");
        var rangeEnd = int.Parse(filter.ExtensionEnd ?? "9999");

        return ExtensionInRange(entry.Origin, rangeStart, rangeEnd) ||
               ExtensionInRange(entry.Destination, rangeStart, rangeEnd);
    }

    private static bool ExtensionInRange(string value, int start, int end)
    {
        var digits = DigitsOnly(value);

        return digits.Length <= 4 &&
               int.TryParse(digits, out var numericValue) &&
               numericValue >= start &&
               numericValue <= end;
    }

    private static int ParseDurationInSeconds(string duration)
    {
        if (!TimeSpan.TryParse(duration, out var parsed))
        {
            return 0;
        }

        return (int)parsed.TotalSeconds;
    }

    private static string FormatDuration(int totalSeconds) =>
        TimeSpan.FromSeconds(totalSeconds).ToString(@"hh\:mm\:ss");

    private static string DigitsOnly(string value) =>
        new(value.Where(char.IsDigit).ToArray());

    private sealed record MockBilhetagemCallEntry(
        DateTime OccurredAt,
        BilhetagemCallDirection Direction,
        string Origin,
        string Destination,
        string TypeCode,
        string Duration,
        string Description,
        string City,
        string User,
        decimal Cost)
    {
        public BilhetagemCallScope Scope() =>
            DigitsOnly(Origin).Length <= 4 && DigitsOnly(Destination).Length <= 4
                ? BilhetagemCallScope.Internal
                : BilhetagemCallScope.External;

        public string PrimaryExtension()
        {
            if (Direction == BilhetagemCallDirection.Performed && DigitsOnly(Origin).Length <= 4)
            {
                return DigitsOnly(Origin);
            }

            if (Direction == BilhetagemCallDirection.Received && DigitsOnly(Destination).Length <= 4)
            {
                return DigitsOnly(Destination);
            }

            return DigitsOnly(Origin).Length <= 4 ? DigitsOnly(Origin) : DigitsOnly(Destination);
        }

        private static string DigitsOnly(string value) =>
            new(value.Where(char.IsDigit).ToArray());
    }
}
