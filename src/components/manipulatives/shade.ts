/**
 * Lightens (`amt > 0`) or darkens (`amt < 0`) a `#rrggbb` hex color.
 * Returns the input unchanged if it doesn't parse — handy when a caller
 * passes a CSS var() string.
 */
export function shade(hex: string, amt: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const m = hex.slice(1);
  const num = Number.parseInt(m, 16);
  if (!Number.isFinite(num)) return hex;
  const k = Math.round(255 * amt);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  r = Math.max(0, Math.min(255, r + k));
  g = Math.max(0, Math.min(255, g + k));
  b = Math.max(0, Math.min(255, b + k));
  const out = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  return `#${out}`;
}
