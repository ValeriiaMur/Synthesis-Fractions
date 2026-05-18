/**
 * Color helpers for the one-pager's AmbientGlow + tinted backdrops.
 *
 * Inputs the helpers accept:
 *   - "#rrggbb" hex
 *   - "var(--red)" CSS custom property tokens used by the cosmos palette
 * Outputs are `rgba(r, g, b, a)` strings ready to drop into `background-image`.
 */

/** Canonical hex for every accent CSS var the cosmos palette ships with.
 *  Mirrors :root in globals.css so the values can be used outside CSS. */
export const ACCENT_TOKEN_HEX: Readonly<Record<string, string>> = {
  '--red': '#f06b85',
  '--blue': '#5b8cff',
  '--green': '#5fd897',
  '--yellow': '#ffd86b',
  '--orange': '#ffb079',
  '--pink': '#ff9ed1',
  '--purple': '#b69bff',
};

const VAR_RE = /^var\((--[a-z-]+)\)$/i;
const HEX_RE = /^#([0-9a-f]{6})$/i;

/** Returns the literal hex `#rrggbb` for any accepted input, or null. */
export function resolveHex(input: string): string | null {
  if (!input) return null;
  const varMatch = VAR_RE.exec(input.trim());
  if (varMatch) {
    const token = varMatch[1].toLowerCase();
    return ACCENT_TOKEN_HEX[token] ?? null;
  }
  return HEX_RE.test(input) ? input.toLowerCase() : null;
}

function clampAlpha(a: number): number {
  if (!Number.isFinite(a)) return 0;
  if (a < 0) return 0;
  if (a > 1) return 1;
  return a;
}

/**
 * `hexA('var(--red)', 0.18)` → `'rgba(240, 107, 133, 0.18)'`.
 * Returns 'transparent' when the input can't be resolved — safe to drop
 * into `background-image` without breaking anything.
 */
export function hexA(input: string, alpha: number): string {
  const hex = resolveHex(input);
  if (!hex) return 'transparent';
  const num = Number.parseInt(hex.slice(1), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${clampAlpha(alpha)})`;
}
