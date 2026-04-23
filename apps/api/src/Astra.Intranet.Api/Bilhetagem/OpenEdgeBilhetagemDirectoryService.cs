using System.Data.Odbc;
using Astra.Intranet.Api.Shared.OpenEdge;
using Microsoft.Extensions.Options;

namespace Astra.Intranet.Api.Bilhetagem;

public sealed class OpenEdgeBilhetagemDirectoryService(
    IOpenEdgeConnectionFactory connectionFactory,
    IOptions<BilhetagemOptions> bilhetagemOptions)
{
    private readonly IOpenEdgeConnectionFactory _connectionFactory = connectionFactory;
    private readonly BilhetagemDirectoryOptions _directoryOptions = bilhetagemOptions.Value.Directory;

    public string SourceName => "openedge";

    public bool IsConfigured =>
        _connectionFactory.IsConfigured &&
        !string.IsNullOrWhiteSpace(_directoryOptions.TableName);

    public async Task<BilhetagemDirectorySearchResult?> SearchAsync(
        BilhetagemSearchMode mode,
        string query,
        CancellationToken cancellationToken)
    {
        if (!IsConfigured)
        {
            return null;
        }

        var tableName = OpenEdgeSqlIdentifier.Quote(_directoryOptions.TableName!);
        var numberField = OpenEdgeSqlIdentifier.Quote("numero");
        var descriptionField = OpenEdgeSqlIdentifier.Quote("descricao");
        var normalizedQuery = mode == BilhetagemSearchMode.Number
            ? DigitsOnly(query)
            : query.Trim().ToUpperInvariant();

        var fieldName = mode == BilhetagemSearchMode.Number ? numberField : descriptionField;
        var commandText = $"""
            select {numberField} as numero, {descriptionField} as descricao
            from {tableName}
            where {fieldName} like ?
            order by {descriptionField}, {numberField}
            """;

        var entries = new List<BilhetagemDirectoryEntry>();

        using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);

        using var command = new OdbcCommand(commandText, connection);
        command.Parameters.AddWithValue("@p1", normalizedQuery + "%");

        using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            entries.Add(
                new BilhetagemDirectoryEntry(
                    reader["numero"]?.ToString() ?? string.Empty,
                    reader["descricao"]?.ToString() ?? string.Empty));
        }

        return new BilhetagemDirectorySearchResult(
            SourceName,
            mode == BilhetagemSearchMode.Number ? "number" : "description",
            normalizedQuery,
            entries);
    }

    public async Task<BilhetagemDirectoryUpsertResult?> UpsertAsync(
        BilhetagemDirectoryUpsertRequest request,
        CancellationToken cancellationToken)
    {
        if (!IsConfigured)
        {
            return null;
        }

        var normalizedNumber = BuildNumber(request.Ddd, request.Telephone);
        var normalizedDescription = request.Description.Trim().ToUpperInvariant();
        var tableName = OpenEdgeSqlIdentifier.Quote(_directoryOptions.TableName!);
        var numberField = OpenEdgeSqlIdentifier.Quote("numero");
        var descriptionField = OpenEdgeSqlIdentifier.Quote("descricao");

        using var connection = CreateConnection();
        await connection.OpenAsync(cancellationToken);

        using var selectCommand = new OdbcCommand(
            $"""
            select {numberField} as numero, {descriptionField} as descricao
            from {tableName}
            where {numberField} = ?
            """,
            connection);

        selectCommand.Parameters.AddWithValue("@p1", normalizedNumber);

        using var reader = await selectCommand.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
        {
            reader.Close();

            using var insertCommand = new OdbcCommand(
                $"""
                insert into {tableName} ({numberField}, {descriptionField})
                values (?, ?)
                """,
                connection);

            insertCommand.Parameters.AddWithValue("@p1", normalizedNumber);
            insertCommand.Parameters.AddWithValue("@p2", normalizedDescription);
            await insertCommand.ExecuteNonQueryAsync(cancellationToken);

            return new BilhetagemDirectoryUpsertResult(
                BilhetagemDirectoryUpsertStatus.Created,
                SourceName,
                new BilhetagemDirectoryEntry(normalizedNumber, normalizedDescription),
                "Telefone novo cadastrado com descricao.");
        }

        var currentDescription = reader["descricao"]?.ToString() ?? string.Empty;
        reader.Close();

        var currentEntry = new BilhetagemDirectoryEntry(normalizedNumber, currentDescription);

        if (!string.IsNullOrWhiteSpace(currentDescription))
        {
            return new BilhetagemDirectoryUpsertResult(
                BilhetagemDirectoryUpsertStatus.Conflict,
                SourceName,
                currentEntry,
                "Telefone ja possui descricao cadastrada.");
        }

        using var updateCommand = new OdbcCommand(
            $"""
            update {tableName}
            set {descriptionField} = ?
            where {numberField} = ?
            """,
            connection);

        updateCommand.Parameters.AddWithValue("@p1", normalizedDescription);
        updateCommand.Parameters.AddWithValue("@p2", normalizedNumber);
        await updateCommand.ExecuteNonQueryAsync(cancellationToken);

        return new BilhetagemDirectoryUpsertResult(
            BilhetagemDirectoryUpsertStatus.Updated,
            SourceName,
            new BilhetagemDirectoryEntry(normalizedNumber, normalizedDescription),
            "Descricao atualizada para telefone existente.");
    }

    private OdbcConnection CreateConnection() =>
        (OdbcConnection)_connectionFactory.CreateConnection();

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
