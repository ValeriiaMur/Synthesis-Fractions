/**
 * Pure helpers for L5 — paper-fold transfer check.
 *
 * The kid has just proved 1/2 = 2/4 on the chocolate (L4). L5 asks them to
 * recognize the same equivalence in a new representation: a square sheet of
 * paper folded twice. One horizontal fold → the paper is halved. One vertical
 * fold on top of that → four equal parts. Unfolded, the two creases prove
 * 1/2 = 2/4 by superposition.
 *
 * The fold sequence is canonical: horizontal first, then vertical. Two folds
 * cap the state — further folds are no-ops (the proof is already on the
 * paper).
 */

export type FoldAxis = 'horizontal' | 'vertical';

export const REQUIRED_FOLDS: readonly FoldAxis[] = ['horizontal', 'vertical'];

/**
 * Which axis the next fold should be on, or null if both required folds are
 * already done.
 */
export function nextFoldAxis(folds: readonly FoldAxis[]): FoldAxis | null {
  if (folds.length >= REQUIRED_FOLDS.length) return null;
  return REQUIRED_FOLDS[folds.length];
}

/**
 * Append the next fold; idempotent at the cap (returns the same folds when
 * both required folds are already applied).
 */
export function applyFold(folds: readonly FoldAxis[]): readonly FoldAxis[] {
  const next = nextFoldAxis(folds);
  if (next === null) return folds;
  return [...folds, next];
}

/** True once both required folds have been made. */
export function isProven(folds: readonly FoldAxis[]): boolean {
  return folds.length >= REQUIRED_FOLDS.length;
}
