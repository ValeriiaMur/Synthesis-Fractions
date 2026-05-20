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

/** "One whole is the same as FOUR quarters." Lesson 05 fills a tray the
 *  size of the whole; the legacy value of 2 (half = 2 quarters) is no
 *  longer the default but the helpers still accept any target. */
export const COVER_TARGET = 4;

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
 * The wording adapts to the target. With target = 4 the lesson is about
 * building the whole; with target = 2 it's the legacy half-cover.
 */
export function coverStatusText(
  state: CoverState,
  target = COVER_TARGET,
): string {
  const remaining = target - state.placedCount;
  if (state.placedCount <= 0) {
    return target === 4
      ? 'the tray is empty — drag a quarter onto the bar to start filling the whole.'
      : 'the half is empty — drag a quarter onto the bar to start covering it.';
  }
  if (state.placedCount < target) {
    const noun = state.placedCount === 1 ? 'quarter' : 'quarters';
    const more = remaining === 1 ? 'one more' : `${remaining} more`;
    return target === 4
      ? `${state.placedCount} ${noun} placed — ${more} to fill the whole.`
      : `${state.placedCount} ${noun} on the half — ${more} to cover it.`;
  }
  return target === 4
    ? 'four quarters fill the whole exactly — that’s why 4 quarters = 1.'
    : 'two quarters cover the half exactly — that’s why ½ = 2/4.';
}
