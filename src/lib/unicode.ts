/**
 * Counts Unicode code points in a string.
 * Ensures multi-byte UTF-16 surrogate pairs and emojis are accurately counted
 * as single characters rather than multiple UTF-16 code units.
 */
export function countUnicodeCharacters(str: string): number {
  if (!str) return 0;
  return [...str].length;
}
