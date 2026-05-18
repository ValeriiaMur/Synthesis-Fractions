import type { FractionBoxBar } from './types';

/** Greatest common divisor — non-negative integers. */
export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

/** Least common multiple of two positive integers. */
export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return (a * b) / gcd(a, b);
}

export type Fraction = { readonly num: number; readonly den: number };

/**
 * Sums a list of bars into a reduced `num/den` fraction.
 * Empty list → 0/1. Never returns a NaN, never compares floats.
 */
export function fracSum(bars: readonly FractionBoxBar[]): Fraction {
  if (bars.length === 0) return { num: 0, den: 1 };
  const den = bars.reduce<number>((d, b) => lcm(d, b.den), 1);
  const num = bars.reduce<number>(
    (s, b) => s + b.num * (den / b.den),
    0,
  );
  const g = gcd(num, den) || 1;
  return { num: num / g, den: den / g };
}

/** Numeric value of a fraction, safe against zero denominators. */
export function fracValue(f: Fraction): number {
  return f.den === 0 ? 0 : f.num / f.den;
}

/** True when `f` is exactly 1, within floating-point tolerance. */
export function isOne(f: Fraction): boolean {
  return Math.abs(fracValue(f) - 1) < 1e-9;
}

/** True when adding `next` to `bars` would not exceed 1. */
export function canFit(
  bars: readonly FractionBoxBar[],
  next: { readonly num: number; readonly den: number },
): boolean {
  const candidate = fracSum([
    ...bars,
    { id: '__probe', num: next.num, den: next.den, color: '' },
  ]);
  return fracValue(candidate) <= 1 + 1e-9;
}

/**
 * Canonical key for a "full-fill" combination — order-independent, so
 * `½ + ¼ + ¼` and `¼ + ½ + ¼` hash to the same string.
 */
export function comboKey(bars: readonly FractionBoxBar[]): string {
  return bars
    .map((b) => `${b.num}/${b.den}`)
    .sort()
    .join('+');
}
