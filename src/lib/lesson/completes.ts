import type { Beat, ManipulativeState } from './types';

export function isBeatComplete(beat: Beat, state: ManipulativeState | undefined): boolean {
  if (!state) return false;
  const m = beat.manipulative;
  if (m.kind !== state.kind) return false;
  if (m.kind === 'whole' && state.kind === 'whole') {
    return state.split;
  }
  if (m.kind === 'naming' && state.kind === 'naming') {
    return state.streak >= m.masteryStreak;
  }
  if (m.kind === 'equivalence' && state.kind === 'equivalence') {
    return state.placedCount >= m.targetCount;
  }
  if (m.kind === 'paper' && state.kind === 'paper') {
    return state.folds.length >= m.targetFolds.length;
  }
  return false;
}
