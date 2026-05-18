/**
 * Deterministic per-doodle nudge applied each time the active principle
 * changes. Stable across renders for the same `(driftIdx, activeIdx)` pair.
 *
 * Both axes use a hashed sine of a co-prime stride so successive slides
 * scatter doodles in different directions without overlapping with each
 * other. Magnitudes are intentionally small — the doodles already
 * parallax, this is just a per-slide flavor cue.
 */

const MAX_X = 14; // px — sideways magnitude
const MAX_Y = 10; // px — vertical magnitude

export type DriftOffset = {
  readonly dx: number;
  readonly dy: number;
};

/** Returns {dx, dy} in px for a given doodle + active-slide pair. */
export function slideDriftOffset(
  driftIdx: number,
  activeIdx: number,
): DriftOffset {
  // activeIdx of -1 (no principle active — hero / intro / CTA) → zero drift.
  if (activeIdx < 0) return { dx: 0, dy: 0 };
  // Hash inputs into two different sine phases so x and y aren't
  // correlated. The constants are arbitrary primes that produce a
  // pleasing scatter across the first ~16 slides.
  const seedX = driftIdx * 7919 + (activeIdx + 1) * 31;
  const seedY = driftIdx * 6271 + (activeIdx + 1) * 41;
  return {
    dx: Math.sin(seedX) * MAX_X,
    dy: Math.cos(seedY) * MAX_Y,
  };
}
