using System.Data.Odbc;
using System.Data.Common;
using Astra.Intranet.Api.Shared.OpenEdge;
using Microsoft.Extensions.Options;

namespace Astra.Intranet.Api.Bilhetagem;

public sealed class OpenEdgeBilhetagemCallsService(
    IOpenEdgeConnectionFactory connectionFactory,
    IOptions<BilhetagemOptions> bilhetagemOptions)
{
    private static readonly HashSet<string> PerformedTypeCodes =
    [
        "J",
        "CJ",
        "M",
        "K",
        "X",
        "CO"
    ];

    private readonly IOpenEdgeConnectionFactory _connectionFactory = connectionFactory;
    private readonly BilhetagemCallsOptions _callsOptions = bilhetagemOptions.Value.Calls;

    public string SourceName => "openedge";

    public bool IsConfigured =>
        _connectionFactory.IsConfigured &&
        !string.IsNullOrWhiteSpace(_callsOptions.CallsTableName);

    public async Task<BilhetagemCallReportResult?> GenerateReportAsync(
        BilhetagemCallReportFilter filter,
        CancellationToken cancellationToken)
    {
        if (!IsConfigured)
        {
            return null;
        }

        using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var rows = await LoadCallRowsAsync(connection, filter, cancellationToken);
        var descriptionCache = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        var userCache = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);

        var entries = new List<OpenEdgeBilhetagemCallEntry>();

        foreach (var row in rows)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var entry = await BuildEntryAsync(
                connection,
                row,
                descriptionCache,
                userCache,
                cancellationToken);

            if (entry is not null)
            {
                entries.Add(entry);
            }
        }

        var filteredEntries = entries
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

        return new BilhetagemCallReportResult(
            SourceName,
            ToFilters(filter),
            summary,
            groups,
            items);
    }

    private async Task<List<OpenEdgeBilhetagemCallRow>> LoadCallRowsAsync(
        OdbcConnection connection,
        BilhetagemCallReportFilter filter,
        CancellationToken cancellationToken)
    {
        var tableName = OpenEdgeSqlIdentifier.Quote(_callsOptions.CallsTableName!);
        var dateField = OpenEdgeSqlIdentifier.Quote(_callsOptions.DateField);
        var timeField = OpenEdgeSqlIdentifier.Quote(_callsOptions.TimeField);
        var extensionField = OpenEdgeSqlIdentifier.Quote(_callsOptions.ExtensionField);
        var numberField = OpenEdgeSqlIdentifier.Quote(_callsOptions.NumberField);
        var durationField = OpenEdgeSqlIdentifier.Quote(_callsOptions.DurationField);
        var typeCodeField = OpenEdgeSqlIdentifier.Quote(_callsOptions.TypeCodeField);
        var cityField = OpenEdgeSqlIdentifier.Quote(_callsOptions.CityField);
        var stateField = OpenEdgeSqlIdentifier.Quote(_callsOptions.StateField);
        var costField = OpenEdgeSqlIdentifier.Quote(_callsOptions.CostField);
        var destinationField = OpenEdgeSqlIdentifier.Quote(_callsOptions.DestinationField);
        var ownerIdField = OpenEdgeSqlIdentifier.Quote(_callsOptions.OwnerIdField);

        var commandText = $"""
            select
                {dateField} as data_ligacao,
                {timeField} as hora_ligacao,
                {extensionField} as ramal,
                {numberField} as numero,
                {durationField} as duracao,
                {typeCodeField} as tipo_codigo,
                {cityField} as cidade,
                {stateField} as estado,
                {costField} as custo,
                {destinationField} as destino,
                {ownerIdField} as usuario_id
            from {tableName}
            where {dateField} >= ? and {dateField} <= ?
            order by {dateField}, {timeField}
            """;

        using var command = new OdbcCommand(commandText, connection);
        command.Parameters.AddWithValue("@p1", filter.StartDate.ToDateTime(TimeOnly.MinValue));
        command.Parameters.AddWithValue("@p2", filter.EndDate.ToDateTime(TimeOnly.MinValue));

        using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var rows = new List<OpenEdgeBilhetagemCallRow>();

        while (await reader.ReadAsync(cancellationToken))
        {
            rows.Add(
                new OpenEdgeBilhetagemCallRow(
                    ReadDateOnly(reader, "data_ligacao"),
                    ReadTimeText(reader, "hora_ligacao"),
                    ReadString(reader, "ramal"),
                    ReadString(reader, "numero"),
                    ReadString(reader, "duracao"),
                    ReadString(reader, "tipo_codigo"),
                    ReadString(reader, "cidade"),
                    ReadString(reader, "estado"),
                    ReadDecimal(reader, "custo"),
                    ReadString(reader, "destino"),
                    ReadString(reader, "usuario_id")));
        }

        return rows;
    }

    private async Task<OpenEdgeBilhetagemCallEntry?> BuildEntryAsync(
        OdbcConnection connection,
        OpenEdgeBilhetagemCallRow row,
        IDictionary<string, string?> descriptionCache,
        IDictionary<string, string?> userCache,
        CancellationToken cancellationToken)
    {
        if (string.Equals(row.Duration, "00:00:00", StringComparison.Ordinal))
        {
            return null;
        }

        var isPerformed = IsPerformed(row.TypeCode);
        var origin = isPerformed ? NormalizeDisplayValue(row.Extension) : NormalizeDisplayValue(row.Number);
        var destination = isPerformed ? NormalizeDisplayValue(row.Number) : NormalizeDisplayValue(row.Extension);
        var scope = IsInternal(row.Extension, row.Number)
            ? BilhetagemCallScope.Internal
            : BilhetagemCallScope.External;

        string description = string.Empty;
        string user = string.Empty;

        var lookupNumber = PickExternalNumber(origin, destination);

        if (!string.IsNullOrWhiteSpace(lookupNumber))
        {
            description = await LoadDescriptionAsync(
                connection,
                lookupNumber,
                descriptionCache,
                cancellationToken) ?? string.Empty;
        }

        if (!string.IsNullOrWhiteSpace(row.OwnerId) &&
            !string.Equals(row.OwnerId, "0", StringComparison.OrdinalIgnoreCase))
        {
            user = await LoadUserAsync(connection, row.OwnerId, userCache, cancellationToken) ??
                row.OwnerId;
        }

        var occurredAt = BuildOccurredAt(row.Date, row.Time);

        return new OpenEdgeBilhetagemCallEntry(
            occurredAt,
            isPerformed ? BilhetagemCallDirection.Performed : BilhetagemCallDirection.Received,
            scope,
            origin,
            destination,
            row.TypeCode,
            NormalizeDuration(row.Duration),
            description,
            row.City,
            row.State,
            user,
            row.Cost,
            PickPrimaryExtension(origin, destination, isPerformed));
    }

    private async Task<string?> LoadDescriptionAsync(
        OdbcConnection connection,
        string number,
        IDictionary<string, string?> cache,
        CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(number, out var cached))
        {
            return cached;
        }

        if (string.IsNullOrWhiteSpace(_callsOptions.DirectoryTableName))
        {
            cache[number] = null;
            return null;
        }

        var tableName = OpenEdgeSqlIdentifier.Quote(_callsOptions.DirectoryTableName);
        var numberField = OpenEdgeSqlIdentifier.Quote(_callsOptions.DirectoryNumberField);
        var descriptionField = OpenEdgeSqlIdentifier.Quote(_callsOptions.DirectoryDescriptionField);

        using var command = new OdbcCommand(
            $"""
            select {descriptionField} as descricao
            from {tableName}
            where {numberField} = ? or {numberField} = ? or {numberField} = ?
            """,
            connection);

        command.Parameters.AddWithValue("@p1", number);
        command.Parameters.AddWithValue("@p2", "011" + number);
        command.Parameters.AddWithValue("@p3", "0" + number);

        using var reader = await command.ExecuteReaderAsync(cancellationToken);

        string? description = null;

        while (await reader.ReadAsync(cancellationToken))
        {
            var current = ReadString(reader, "descricao");

            if (!string.IsNullOrWhiteSpace(current))
            {
                description = current;
                break;
            }
        }

        cache[number] = description;
        return description;
    }

    private async Task<string?> LoadUserAsync(
        OdbcConnection connection,
        string userId,
        IDictionary<string, string?> cache,
        CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(userId, out var cached))
        {
            return cached;
        }

        if (string.IsNullOrWhiteSpace(_callsOptions.UsersTableName))
        {
            cache[userId] = null;
            return null;
        }

        var tableName = OpenEdgeSqlIdentifier.Quote(_callsOptions.UsersTableName);
        var idField = OpenEdgeSqlIdentifier.Quote(_callsOptions.UserIdField);
        var nameField = OpenEdgeSqlIdentifier.Quote(_callsOptions.UserNameField);

        using var command = new OdbcCommand(
            $"""
            select {nameField} as nome
            from {tableName}
            where {idField} = ?
            """,
            connection);

        command.Parameters.AddWithValue("@p1", userId);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        var name = result?.ToString();
        cache[userId] = string.IsNullOrWhiteSpace(name) ? null : name;
        return cache[userId];
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

    private static List<BilhetagemCallReportGroup> BuildGroups(IEnumerable<OpenEdgeBilhetagemCallEntry> entries) =>
        entries
            .GroupBy(entry => entry.PrimaryExtension)
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

    private static BilhetagemCallReportItem ToItem(OpenEdgeBilhetagemCallEntry entry) =>
        new(
            entry.OccurredAt.ToString("yyyy-MM-dd"),
            entry.OccurredAt.ToString("HH:mm:ss"),
            entry.Direction == BilhetagemCallDirection.Performed ? "performed" : "received",
            entry.Scope == BilhetagemCallScope.Internal ? "internal" : "external",
            entry.Origin,
            entry.Destination,
            entry.TypeCode,
            entry.Duration,
            entry.Description,
            entry.City,
            entry.User,
            decimal.Round(entry.Cost, 2));

    private static bool MatchesDirection(
        OpenEdgeBilhetagemCallEntry entry,
        BilhetagemCallDirection direction) =>
        direction == BilhetagemCallDirection.Both || entry.Direction == direction;

    private static bool MatchesScope(
        OpenEdgeBilhetagemCallEntry entry,
        BilhetagemCallScope scope) =>
        scope == BilhetagemCallScope.Both || entry.Scope == scope;

    private static bool MatchesTarget(
        OpenEdgeBilhetagemCallEntry entry,
        BilhetagemCallReportFilter filter)
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

    private static bool IsPerformed(string typeCode) =>
        PerformedTypeCodes.Contains((typeCode ?? string.Empty).Trim().ToUpperInvariant());

    private static bool IsInternal(string extension, string number) =>
        DigitsOnly(extension).Length <= 4 &&
        DigitsOnly(number).Length <= 4;

    private static string PickPrimaryExtension(string origin, string destination, bool isPerformed)
    {
        var originDigits = DigitsOnly(origin);
        var destinationDigits = DigitsOnly(destination);

        if (isPerformed && originDigits.Length <= 4 && !string.IsNullOrWhiteSpace(originDigits))
        {
            return originDigits;
        }

        if (!isPerformed && destinationDigits.Length <= 4 && !string.IsNullOrWhiteSpace(destinationDigits))
        {
            return destinationDigits;
        }

        if (originDigits.Length <= 4 && !string.IsNullOrWhiteSpace(originDigits))
        {
            return originDigits;
        }

        if (destinationDigits.Length <= 4 && !string.IsNullOrWhiteSpace(destinationDigits))
        {
            return destinationDigits;
        }

        return string.Empty;
    }

    private static string? PickExternalNumber(string origin, string destination)
    {
        var originDigits = DigitsOnly(origin);
        var destinationDigits = DigitsOnly(destination);

        if (originDigits.Length > 4)
        {
            return originDigits;
        }

        if (destinationDigits.Length > 4)
        {
            return destinationDigits;
        }

        return null;
    }

    private static DateTime BuildOccurredAt(DateOnly date, string time)
    {
        if (TimeOnly.TryParse(time, out var parsedTime))
        {
            return date.ToDateTime(parsedTime);
        }

        if (TimeSpan.TryParse(time, out var parsedSpan))
        {
            return date.ToDateTime(TimeOnly.MinValue).Add(parsedSpan);
        }

        return date.ToDateTime(TimeOnly.MinValue);
    }

    private static DateOnly ReadDateOnly(DbDataReader reader, string fieldName)
    {
        var value = reader[fieldName];

        return value switch
        {
            DateTime dateTime => DateOnly.FromDateTime(dateTime),
            DateOnly dateOnly => dateOnly,
            _ when DateOnly.TryParse(value?.ToString(), out var parsed) => parsed,
            _ => DateOnly.MinValue
        };
    }

    private static string ReadTimeText(DbDataReader reader, string fieldName)
    {
        var value = reader[fieldName];

        return value switch
        {
            TimeSpan timeSpan => timeSpan.ToString(@"hh\:mm\:ss"),
            DateTime dateTime => dateTime.ToString("HH:mm:ss"),
            _ => NormalizeDuration(value?.ToString() ?? string.Empty)
        };
    }

    private static string ReadString(DbDataReader reader, string fieldName) =>
        reader[fieldName]?.ToString()?.Trim() ?? string.Empty;

    private static decimal ReadDecimal(DbDataReader reader, string fieldName)
    {
        var value = reader[fieldName];

        return value switch
        {
            decimal decimalValue => decimalValue,
            double doubleValue => Convert.ToDecimal(doubleValue),
            float floatValue => Convert.ToDecimal(floatValue),
            int intValue => intValue,
            long longValue => longValue,
            _ when decimal.TryParse(value?.ToString(), out var parsed) => parsed,
            _ => 0m
        };
    }

    private OdbcConnection CreateConnection() =>
        (OdbcConnection)_connectionFactory.CreateConnection();

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

    private static string NormalizeDuration(string value) =>
        TimeSpan.TryParse(value, out var parsed)
            ? parsed.ToString(@"hh\:mm\:ss")
            : "00:00:00";

    private static string NormalizeDisplayValue(string value)
    {
        var trimmed = value?.Trim() ?? string.Empty;
        return string.IsNullOrWhiteSpace(trimmed) ? string.Empty : trimmed;
    }

    private static string DigitsOnly(string value) =>
        new((value ?? string.Empty).Where(char.IsDigit).ToArray());

    private sealed record OpenEdgeBilhetagemCallRow(
        DateOnly Date,
        string Time,
        string Extension,
        string Number,
        string Duration,
        string TypeCode,
        string City,
        string State,
        decimal Cost,
        string Destination,
        string OwnerId);

    private sealed record OpenEdgeBilhetagemCallEntry(
        DateTime OccurredAt,
        BilhetagemCallDirection Direction,
        BilhetagemCallScope Scope,
        string Origin,
        string Destination,
        string TypeCode,
        string Duration,
        string Description,
        string City,
        string State,
        string User,
        decimal Cost,
        string PrimaryExtension);
}
