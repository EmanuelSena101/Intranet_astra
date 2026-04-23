using System.Globalization;

namespace Astra.Intranet.Api.DocWeb;

public sealed class MockDocWebDocumentService : IDocWebDocumentService
{
    private readonly object _sync = new();
    private readonly List<MockDocWebDocument> _documents =
    [
        new(
            "101/26",
            "COM",
            "Circular de campanhas comerciais",
            "Circular_101_26.pdf",
            248.50m,
            new DateOnly(2026, 4, 2),
            "08:30:12",
            true,
            false,
            new DateOnly(2026, 12, 31),
            [120, 155, 204]),
        new(
            "104/26",
            "SUP",
            "Tabela de bonificação de abril",
            "Bonificacao_104_26.xlsx",
            93.20m,
            new DateOnly(2026, 4, 3),
            "09:12:55",
            true,
            false,
            new DateOnly(2026, 8, 30),
            [84, 91]),
        new(
            "099/26",
            "TI",
            "Manual de faturamento revisado",
            "Faturamento_099_26.zip",
            512.80m,
            new DateOnly(2026, 3, 27),
            "16:42:08",
            false,
            false,
            null,
            []),
        new(
            "087/26",
            "RH",
            "Atualização de política interna",
            "Politica_087_26.pdf",
            188.35m,
            new DateOnly(2026, 3, 19),
            "10:05:33",
            true,
            true,
            new DateOnly(2026, 7, 1),
            [44, 52, 77])
    ];

    public string SourceName => "mock";

    public DocWebModuleSnapshot GetSnapshot()
    {
        lock (_sync)
        {
            return new DocWebModuleSnapshot(
                _documents.Count,
                _documents.Count(document => document.Published && !document.Cancelled),
                _documents.Count(document => document.Cancelled));
        }
    }

    public Task<DocWebDocumentSearchResult> SearchAsync(
        DocWebDocumentSearchFilter filter,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        string query = (filter.Query ?? string.Empty).Trim();
        MockDocWebDocument[] snapshot;

        lock (_sync)
        {
            snapshot = _documents.ToArray();
        }

        IEnumerable<MockDocWebDocument> documents = snapshot;

        if (filter.Status == DocWebDocumentStatusFilter.Active)
        {
            documents = documents.Where(document => !document.Cancelled);
        }
        else if (filter.Status == DocWebDocumentStatusFilter.Cancelled)
        {
            documents = documents.Where(document => document.Cancelled);
        }

        if (filter.Visibility == DocWebDocumentVisibilityFilter.Published)
        {
            documents = documents.Where(document => document.Published);
        }
        else if (filter.Visibility == DocWebDocumentVisibilityFilter.Internal)
        {
            documents = documents.Where(document => !document.Published);
        }

        if (!string.IsNullOrWhiteSpace(query))
        {
            documents = documents.Where(document =>
                document.DocumentNumber.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                document.SectorCode.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                document.Title.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                document.FileName.Contains(query, StringComparison.OrdinalIgnoreCase));
        }

        var entries = documents
            .OrderByDescending(document => document.DocumentDate)
            .ThenByDescending(document => document.DocumentTime)
            .ThenBy(document => document.DocumentNumber, StringComparer.OrdinalIgnoreCase)
            .Select(ToEntry)
            .ToArray();

        return Task.FromResult(
            new DocWebDocumentSearchResult(
                SourceName,
                query,
                filter.Status.ToString().ToLowerInvariant(),
                filter.Visibility.ToString().ToLowerInvariant(),
                entries));
    }

    public Task<DocWebDocumentUpsertResult> UpsertAsync(
        DocWebDocumentUpsertRequest request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var representativeCodes = (request.RepresentativeCodes ?? [])
            .Where(code => code > 0)
            .Distinct()
            .Order()
            .ToArray();

        lock (_sync)
        {
            var existingIndex = _documents.FindIndex(document =>
                string.Equals(document.DocumentNumber, request.DocumentNumber, StringComparison.OrdinalIgnoreCase));

            if (existingIndex >= 0)
            {
                var existing = _documents[existingIndex];
                var updated = existing with
                {
                    SectorCode = request.SectorCode!.Trim(),
                    Title = request.Title!.Trim(),
                    FileName = request.FileName!.Trim(),
                    FileSizeKilobytes = decimal.Round(request.FileSizeKilobytes, 2),
                    Published = request.PublishNow,
                    ExpirationDate = ParseExpirationDate(request.ExpirationDate),
                    RepresentativeCodes = representativeCodes
                };

                _documents[existingIndex] = updated;

                return Task.FromResult(
                    new DocWebDocumentUpsertResult(
                        DocWebDocumentUpsertStatus.Updated,
                        SourceName,
                        ToEntry(updated),
                        "Documento atualizado com sucesso."));
            }

            var now = DateTime.Now;
            var created = new MockDocWebDocument(
                request.DocumentNumber!.Trim(),
                request.SectorCode!.Trim(),
                request.Title!.Trim(),
                request.FileName!.Trim(),
                decimal.Round(request.FileSizeKilobytes, 2),
                DateOnly.FromDateTime(now),
                now.ToString("HH:mm:ss", CultureInfo.InvariantCulture),
                request.PublishNow,
                false,
                ParseExpirationDate(request.ExpirationDate),
                representativeCodes);

            _documents.Add(created);

            return Task.FromResult(
                new DocWebDocumentUpsertResult(
                    DocWebDocumentUpsertStatus.Created,
                    SourceName,
                    ToEntry(created),
                    "Documento cadastrado com sucesso."));
        }
    }

    private static DocWebDocumentEntry ToEntry(MockDocWebDocument document) =>
        new(
            document.DocumentNumber,
            document.SectorCode,
            document.Title,
            document.FileName,
            document.FileSizeKilobytes,
            document.DocumentDate.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture),
            document.DocumentTime,
            BuildStatusCode(document),
            document.ExpirationDate?.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture),
            document.RepresentativeCodes.Length);

    private static DateOnly? ParseExpirationDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return DateOnly.TryParseExact(
            value,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out var parsedDate)
            ? parsedDate
            : null;
    }

    private static string BuildStatusCode(MockDocWebDocument document)
    {
        var status = document.Published ? "P" : "N";
        return document.Cancelled ? $"{status}/C" : status;
    }

    private sealed record MockDocWebDocument(
        string DocumentNumber,
        string SectorCode,
        string Title,
        string FileName,
        decimal FileSizeKilobytes,
        DateOnly DocumentDate,
        string DocumentTime,
        bool Published,
        bool Cancelled,
        DateOnly? ExpirationDate,
        int[] RepresentativeCodes);
}
