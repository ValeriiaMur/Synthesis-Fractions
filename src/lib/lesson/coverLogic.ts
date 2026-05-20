/**
 * Pure helpers for L4 — chocolate tap-to-cover equivalence.
 *
 * The kid sees one half-piece on the mat and two quarter-tiles beside it.
 * Each tap places a quarter onto the half. Two placed = the half is covered;
 * the lesson advances. Extra taps are no-ops (overflow guard).
 *
 * No drag, no snap zones, no coverage geometry — the kid has been tapping
 * chocolate since Lesson 1, and the tap interaction is preserved here. The
 * concept changes; the interaction does not.
 */

export type CoverState = { readonly placedCount: number };

/** "One half is the same as TWO quarters." */
export const COVER_TARGET = 2;

export type PlaceResult = {
  readonly accepted: boolean;
  readonly newState: CoverState;
};

export function placeQuarter(state: CoverState, target = COVER_TARGET): PlaceResult {
  if (state.placedCount >= target) {
    return { accepted: false, newState: state };
  }
  return { accepted: true, newState: { placedCount: state.placedCount + 1 } };
}

export function isCovered(state: CoverState, target = COVER_TARGET): boolean {
  return state.placedCount >= target;
}

/**
 * Observational status line for the equivalence material. Mirrors the
 * Period-3 control-of-error script: name what the kid sees on the mat at
 * each step, no praise.
 *
 *   0 placed → "the half is empty — tap a quarter to start covering it."
 *   1 placed → "one quarter on the half — one more to cover it."
 *   2 placed → "two quarters cover the half exactly — that's why ½ = 2/4."
 */
export function coverStatusText(
  state: CoverState,
  target = COVER_TARGET,
): string {
  if (state.placedCount <= 0) {
    return 'the half is empty — tap a quarter to start covering it.';
  }
  if (state.placedCount < target) {
    const remaining = target - state.placedCount;
    return `one quarter on the half — ${
      remaining === 1 ? 'one more to cover it.' : `${remaining} more to cover it.`
    }`;
  }
  return 'two quarters cover the half exactly — that’s why ½ = 2/4.';
}
