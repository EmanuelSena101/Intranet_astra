using System.Text.RegularExpressions;

namespace Astra.Intranet.Api.Bilhetagem;

internal static partial class OpenEdgeSqlIdentifier
{
    [GeneratedRegex(@"^[A-Za-z_][A-Za-z0-9_-]*$")]
    private static partial Regex IdentifierPattern();

    public static string Quote(string identifier)
    {
        if (string.IsNullOrWhiteSpace(identifier))
        {
            throw new InvalidOperationException("OpenEdge identifier cannot be empty.");
        }

        var segments = identifier
            .Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (segments.Length == 0)
        {
            throw new InvalidOperationException("OpenEdge identifier cannot be empty.");
        }

        return string.Join(".", segments.Select(QuoteSegment));
    }

    private static string QuoteSegment(string segment)
    {
        if (!IdentifierPattern().IsMatch(segment))
        {
            throw new InvalidOperationException(
                $"OpenEdge identifier segment '{segment}' contains unsupported characters.");
        }

        return $"\"{segment}\"";
    }
}
