import type { Beat, ManipulativeState } from './types';

/**
 * Pure predicate: has the learner satisfied the manipulative goal for this beat?
 * Mirrors the `completes` callbacks in the reference prototype's lesson data.
 */
export function isBeatComplete(
  beat: Beat,
  state: ManipulativeState | undefined,
): boolean {
  if (!state) return false;
  const m = beat.manipulative;
  if (!m) return false;
  if (m.kind !== state.kind) return false;

  if (m.kind === 'chocolate' && state.kind === 'chocolate') {
    return state.piecesOnReference === 2;
  }
  if (m.kind === 'pizza' && state.kind === 'pizza') {
    return state.sliceCount === m.targetSlices;
  }
  if (m.kind === 'paper' && state.kind === 'paper') {
    return state.folds.length >= m.targetFolds.length;
  }
  if (m.kind === 'fractionbox' && state.kind === 'fractionbox') {
    return state.combos >= m.minCombos;
  }
  return false;
}

/**
 * Index-into-hints helper. Caps at the last hint when the learner runs out.
 */
export function lookupHint(
  hints: readonly string[] | undefined,
  attempt: number,
): string | null {
  if (!hints || hints.length === 0) return null;
  const i = Math.min(Math.max(0, attempt), hints.length - 1);
  return hints[i];
}
