/**
 * Strips the inline highlight tokens used in beat prose, so the same string
 * can be pushed into chat without the `{y}…{/y}` markers showing.
 */
export function stripMarkup(s: string): string {
  return s.replace(/\{\/?[a-z]\}/g, '');
}
