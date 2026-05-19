import type {
  BlockStudioRailSnapshot,
  FractionBoxBar,
} from '@/lib/lesson/types';
import { canFit, comboKey, fracSum, isOne } from '@/lib/lesson/fractions';

/** A rect-ish shape, structurally compatible with `DOMRect`. */
export type RectLike = {
  readonly left: number;
  readonly width: number;
};

/**
 * Step 1 (Play) is "ready" once the learner has placed at least three bricks
 * total across every rail on the mat.
 */
export function stepCheckPlay(
  rails: readonly BlockStudioRailSnapshot[],
): boolean {
  const total = rails.reduce((s, r) => s + r.bars.length, 0);
  return total >= 3;
}

/**
 * Step 2 (Compare) is "ready" once at least two rails sum to exactly 1
 * with *distinct* brick signatures — i.e. the same whole, made of different
 * bricks. That's equivalence by construction.
 */
export function stepCheckCompare(
  rails: readonly BlockStudioRailSnapshot[],
): boolean {
  const filled = rails.filter(
    (r) => r.bars.length > 0 && isOne(fracSum(r.bars)),
  );
  if (filled.length < 2) return false;
  const sigs = new Set(filled.map((r) => comboKey(r.bars)));
  return sigs.size >= 2;
}

function railValueAsHalfExact(bars: readonly FractionBoxBar[]): boolean {
  const s = fracSum(bars);
  // s.num * 2 === s.den works after `fracSum` reduces.
  return s.num * 2 === s.den;
}

/** Quest 1 — fill any rail completely to 1. */
export function questCheckQ1(
  rails: readonly BlockStudioRailSnapshot[],
): boolean {
  return rails.some(
    (r) => r.bars.length > 0 && isOne(fracSum(r.bars)),
  );
}

/** Quest 2 — make exactly 1/2 on a rail without using a 1/2 brick. */
export function questCheckQ2(
  rails: readonly BlockStudioRailSnapshot[],
): boolean {
  return rails.some((r) => {
    if (r.bars.length < 2) return false;
    const noHalfBrick = r.bars.every(
      (b) => !(b.num === 1 && b.den === 2),
    );
    return noHalfBrick && railValueAsHalfExact(r.bars);
  });
}

/** Quest 3 — fill a rail to 1 using at least 3 distinct brick sizes. */
export function questCheckQ3(
  rails: readonly BlockStudioRailSnapshot[],
): boolean {
  return rails.some((r) => {
    if (r.bars.length < 3) return false;
    if (!isOne(fracSum(r.bars))) return false;
    const distinct = new Set(r.bars.map((b) => `${b.num}/${b.den}`));
    return distinct.size >= 3;
  });
}

export type EquivalenceGroup = {
  /** Canonical key for the shared sum, e.g. `"1/1"`. */
  readonly sumKey: string;
  readonly railIds: readonly string[];
};

/**
 * Find rails that share a reduced sum AND have at least two distinct brick
 * signatures (so a group of three rails all built `1/2 + 1/2` doesn't count
 * — it's the same breakdown three ways, not equivalence).
 */
export function findEquivalenceGroups(
  rails: readonly BlockStudioRailSnapshot[],
): readonly EquivalenceGroup[] {
  type Entry = { readonly id: string; readonly sig: string };
  const bySum = new Map<string, Entry[]>();
  for (const r of rails) {
    if (r.bars.length === 0) continue;
    const s = fracSum(r.bars);
    const key = `${s.num}/${s.den}`;
    const sig = comboKey(r.bars);
    const list = bySum.get(key) ?? [];
    list.push({ id: r.id, sig });
    bySum.set(key, list);
  }
  const out: EquivalenceGroup[] = [];
  for (const [sumKey, list] of bySum) {
    if (list.length < 2) continue;
    const sigs = new Set(list.map((x) => x.sig));
    if (sigs.size < 2) continue;
    out.push({ sumKey, railIds: list.map((x) => x.id) });
  }
  return out;
}

/**
 * Pure wrapper around `canFit` for a rail: would `frac` push this rail past
 * "one whole" if added to the existing bars?
 */
export function canPlaceBrick(
  rail: BlockStudioRailSnapshot,
  frac: { readonly num: number; readonly den: number },
): boolean {
  return canFit(rail.bars, frac);
}

/**
 * Compute an insert index from a pointer's `clientX` and an ordered list of
 * child rects. The insertion slot is "before the first child whose midpoint
 * is to the right of `clientX`"; pointer past every child returns
 * `childRects.length`.
 */
export function computeInsertIndexFromMidpoints(
  clientX: number,
  childRects: readonly RectLike[],
): number {
  for (let i = 0; i < childRects.length; i++) {
    const mid = childRects[i].left + childRects[i].width / 2;
    if (clientX < mid) return i;
  }
  return childRects.length;
}
