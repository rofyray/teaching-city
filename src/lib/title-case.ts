/**
 * English title case for headings: capitalize major words, keep short articles, conjunctions and
 * prepositions lower case unless first or last, and leave words that already carry capitals
 * (names, acronyms, "311") and ICU placeholders untouched.
 */
const MINOR = new Set([
  "a", "an", "the", "and", "but", "or", "nor", "for", "so", "yet", "as", "at", "by", "in", "of", "on", "to", "up", "via", "vs", "vs.", "with", "from", "per", "into", "than",
]);

function capitalize(word: string) {
  return word.replace(/^([("'“]*)(\p{Ll})/u, (_, lead: string, ch: string) => lead + ch.toUpperCase());
}

export function titleCase(text: string): string {
  // Split on spaces but keep ICU placeholders such as {count, plural, ...} intact.
  const tokens = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|[^\s]+|\s+/g) ?? [];
  const wordIndexes = tokens.map((t, i) => (/\S/.test(t) ? i : -1)).filter((i) => i >= 0);
  const first = wordIndexes[0];
  const last = wordIndexes[wordIndexes.length - 1];
  let afterColon = false;
  return tokens
    .map((token, i) => {
      // Placeholders, and possessive endings glued to them ("{firstName}'s"), stay as written.
      if (!/\S/.test(token) || token.startsWith("{") || token.startsWith("'")) return token;
      const forceCap = i === first || i === last || afterColon;
      afterColon = /[:.?]$/.test(token);
      return token
        .split("-")
        .map((part, j) => {
          if (/\p{Lu}/u.test(part.slice(1)) || /^\d/.test(part)) return part;
          const bare = part.toLowerCase().replace(/[^a-z.]/g, "");
          if (j === 0 && !forceCap && MINOR.has(bare)) return part.toLowerCase();
          return capitalize(part);
        })
        .join("-");
    })
    .join("");
}
