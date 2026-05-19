// Short, human-readable summary of a manipulative's current state. Used
// by `<StudentEcho>` to acknowledge what the kid has built so far — e.g.
// "2/4 placed" for the chocolate ration tray. Pure function, no UI.

import type { ManipulativeState } from './types';

export function manipSummary(state: ManipulativeState | undefined): string | null {
  if (!state) return null;
  if (state.kind === 'chocolate') {
    return `${state.piecesOnReference}/4 placed`;
  }
  if (state.kind === 'pizza') {
    return `${state.sliceCount} slices`;
  }
  if (state.kind === 'paper') {
    const n = state.folds.length;
    return n === 1 ? '1 fold' : `${n} folds`;
  }
  if (state.kind === 'fractionbox') {
    const n = state.combos;
    return n === 1 ? '1 way' : `${n} ways`;
  }
  // BlockStudio or any future kind — bail rather than throw.
  return null;
}
