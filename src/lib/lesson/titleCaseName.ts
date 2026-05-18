/**
 * Normalize a learner-typed name for display:
 *   "lera" / "LERA" / "Lera" → "Lera"
 *   "mary-jane"              → "Mary-Jane"
 *   "o'brien"                → "O'Brien"
 *   "   ana   sofía  "       → "Ana Sofía"
 *
 * Lowercases the whole input, then upper-cases the first character of every
 * run separated by space, hyphen, or apostrophe. Internal whitespace is
 * collapsed; leading / trailing whitespace is trimmed.
 */
export function titleCaseName(raw: string): string {
  const collapsed = raw.trim().replace(/\s+/g, ' ');
  if (collapsed.length === 0) return '';
  return collapsed
    .toLocaleLowerCase()
    .replace(/(^|[\s\-'])(\p{L})/gu, (_, sep: string, ch: string) =>
      sep + ch.toLocaleUpperCase(),
    );
}
