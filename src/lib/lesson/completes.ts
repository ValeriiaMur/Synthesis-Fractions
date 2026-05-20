import type { Beat, ManipulativeState } from './types';
import { regionCount } from './namingLogic';

export function isBeatComplete(beat: Beat, state: ManipulativeState | undefined): boolean {
  if (!state) return false;
  const m = beat.manipulative;
  if (m.kind !== state.kind) return false;
  if (m.kind === 'whole' && state.kind === 'whole') {
    return state.split;
  }
  if (m.kind === 'naming' && state.kind === 'naming') {
    // Tap-each-piece contract: the kid must have tapped every region on
    // the tray at least once. `tapped` holds unique indices, so length
    // alone is enough to compare against the region count.
    const required = regionCount(m.fractions);
    return state.tapped.length >= required;
  }
  if (m.kind === 'equivalence' && state.kind === 'equivalence') {
    return state.placedCount >= m.targetCount;
  }
  if (m.kind === 'paper' && state.kind === 'paper') {
    return state.folds.length >= m.targetFolds.length;
  }
  if (m.kind === 'recall' && state.kind === 'recall') {
    return state.revealed;
  }
  return false;
}
