import { describe, it, expect } from 'vitest';
import type {
  BlockStudioRailSnapshot,
  FractionBoxBar,
} from '@/lib/lesson/types';
import {
  canPlaceBrick,
  computeInsertIndexFromMidpoints,
  findEquivalenceGroups,
  questCheckQ1,
  questCheckQ2,
  questCheckQ3,
  stepCheckCompare,
  stepCheckPlay,
} from './blockStudioLogic';

function bar(num: number, den: number, id = `${num}/${den}-${Math.random()}`): FractionBoxBar {
  return { id, num, den, color: '' };
}

function rail(id: string, bars: readonly FractionBoxBar[]): BlockStudioRailSnapshot {
  return { id, bars };
}

describe('stepCheckPlay', () => {
  it('is false when total bricks < 3', () => {
    expect(stepCheckPlay([rail('a', []), rail('b', [bar(1, 2), bar(1, 4)])])).toBe(false);
  });

  it('is true when total bricks >= 3 across all rails', () => {
    expect(
      stepCheckPlay([rail('a', [bar(1, 2)]), rail('b', [bar(1, 4), bar(1, 4)])]),
    ).toBe(true);
  });

  it('counts bricks from a single rail', () => {
    expect(
      stepCheckPlay([rail('a', [bar(1, 4), bar(1, 4), bar(1, 4)])]),
    ).toBe(true);
  });
});

describe('stepCheckCompare', () => {
  it('is false with only one rail equalling 1', () => {
    expect(
      stepCheckCompare([
        rail('a', [bar(1, 2), bar(1, 2)]),
        rail('b', [bar(1, 4)]),
      ]),
    ).toBe(false);
  });

  it('is false when two rails sum to 1 with identical brick signatures', () => {
    expect(
      stepCheckCompare([
        rail('a', [bar(1, 2), bar(1, 2)]),
        rail('b', [bar(1, 2), bar(1, 2)]),
      ]),
    ).toBe(false);
  });

  it('is true when two rails sum to 1 with distinct brick signatures', () => {
    expect(
      stepCheckCompare([
        rail('a', [bar(1, 2), bar(1, 2)]),
        rail('b', [bar(1, 4), bar(1, 4), bar(1, 4), bar(1, 4)]),
      ]),
    ).toBe(true);
  });

  it('ignores empty rails', () => {
    expect(
      stepCheckCompare([
        rail('a', []),
        rail('b', [bar(1, 2), bar(1, 2)]),
        rail('c', [bar(1, 4), bar(1, 4), bar(1, 4), bar(1, 4)]),
      ]),
    ).toBe(true);
  });
});

describe('questCheckQ1 — fill any rail to 1', () => {
  it('is true when one rail equals 1', () => {
    expect(
      questCheckQ1([rail('a', [bar(1, 2), bar(1, 2)]), rail('b', [bar(1, 4)])]),
    ).toBe(true);
  });

  it('is false when no rail equals 1', () => {
    expect(
      questCheckQ1([rail('a', [bar(1, 2)]), rail('b', [bar(1, 4)])]),
    ).toBe(false);
  });
});

describe('questCheckQ2 — make 1/2 without a 1/2 brick', () => {
  it('is true with two 1/4 bricks summing to 1/2', () => {
    expect(questCheckQ2([rail('a', [bar(1, 4), bar(1, 4)])])).toBe(true);
  });

  it('is true with three 1/6 bricks summing to 1/2', () => {
    expect(
      questCheckQ2([rail('a', [bar(1, 6), bar(1, 6), bar(1, 6)])]),
    ).toBe(true);
  });

  it('is false if a 1/2 brick is used (even with extras summing to half)', () => {
    // single 1/2 brick alone — disallowed and only 1 brick anyway
    expect(questCheckQ2([rail('a', [bar(1, 2)])])).toBe(false);
  });

  it('is false with fewer than 2 bricks on the rail', () => {
    expect(questCheckQ2([rail('a', [bar(1, 4)])])).toBe(false);
  });

  it('is false when sum is not exactly 1/2', () => {
    expect(questCheckQ2([rail('a', [bar(1, 4), bar(1, 4), bar(1, 4)])])).toBe(false);
  });
});

describe('questCheckQ3 — fill one rail using >=3 distinct brick sizes', () => {
  it('is true for 1/2 + 1/3 + 1/6 (3 distinct, sums to 1)', () => {
    expect(
      questCheckQ3([rail('a', [bar(1, 2), bar(1, 3), bar(1, 6)])]),
    ).toBe(true);
  });

  it('is false when only 2 distinct brick sizes used (even if sum is 1)', () => {
    expect(
      questCheckQ3([rail('a', [bar(1, 2), bar(1, 4), bar(1, 4)])]),
    ).toBe(false);
  });

  it('is false when 3 distinct sizes but does not sum to 1', () => {
    expect(
      questCheckQ3([rail('a', [bar(1, 2), bar(1, 4), bar(1, 8)])]),
    ).toBe(false);
  });
});

describe('findEquivalenceGroups', () => {
  it('returns no groups when only one rail has any bricks', () => {
    const groups = findEquivalenceGroups([
      rail('a', [bar(1, 2)]),
      rail('b', []),
    ]);
    expect(groups).toHaveLength(0);
  });

  it('returns no groups when sums differ', () => {
    const groups = findEquivalenceGroups([
      rail('a', [bar(1, 2)]),
      rail('b', [bar(1, 4)]),
    ]);
    expect(groups).toHaveLength(0);
  });

  it('returns no groups when sums match but signatures match (identical breakdowns)', () => {
    const groups = findEquivalenceGroups([
      rail('a', [bar(1, 2), bar(1, 2)]),
      rail('b', [bar(1, 2), bar(1, 2)]),
    ]);
    expect(groups).toHaveLength(0);
  });

  it('returns a group when two rails sum to same value with distinct brick signatures', () => {
    const groups = findEquivalenceGroups([
      rail('a', [bar(1, 2)]),
      rail('b', [bar(1, 4), bar(1, 4)]),
    ]);
    expect(groups).toHaveLength(1);
    expect([...groups[0].railIds].sort()).toEqual(['a', 'b']);
  });

  it('groups three rails when they share a sum and there are >=2 signatures', () => {
    const groups = findEquivalenceGroups([
      rail('a', [bar(1, 2)]),
      rail('b', [bar(1, 4), bar(1, 4)]),
      rail('c', [bar(1, 8), bar(1, 8), bar(1, 4)]),
    ]);
    expect(groups).toHaveLength(1);
    expect([...groups[0].railIds].sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('canPlaceBrick', () => {
  it('allows a brick that does not exceed 1', () => {
    expect(canPlaceBrick(rail('a', [bar(1, 2)]), { num: 1, den: 4 })).toBe(true);
  });

  it('rejects a brick that would exceed 1', () => {
    expect(
      canPlaceBrick(rail('a', [bar(1, 2), bar(1, 2)]), { num: 1, den: 8 }),
    ).toBe(false);
  });

  it('allows placement on an empty rail', () => {
    expect(canPlaceBrick(rail('a', []), { num: 1, den: 2 })).toBe(true);
  });
});

describe('computeInsertIndexFromMidpoints', () => {
  it('returns 0 when clientX is before the first child', () => {
    const rects = [
      { left: 100, width: 50 },
      { left: 150, width: 50 },
    ];
    expect(computeInsertIndexFromMidpoints(80, rects)).toBe(0);
  });

  it('returns N when clientX is past every child', () => {
    const rects = [
      { left: 100, width: 50 },
      { left: 150, width: 50 },
    ];
    expect(computeInsertIndexFromMidpoints(1000, rects)).toBe(2);
  });

  it('returns the index whose midpoint clientX is just left of', () => {
    const rects = [
      { left: 0, width: 100 }, // midpoint 50
      { left: 100, width: 100 }, // midpoint 150
      { left: 200, width: 100 }, // midpoint 250
    ];
    expect(computeInsertIndexFromMidpoints(40, rects)).toBe(0);
    expect(computeInsertIndexFromMidpoints(120, rects)).toBe(1);
    expect(computeInsertIndexFromMidpoints(220, rects)).toBe(2);
    expect(computeInsertIndexFromMidpoints(260, rects)).toBe(3);
  });

  it('returns 0 for an empty rects array', () => {
    expect(computeInsertIndexFromMidpoints(50, [])).toBe(0);
  });
});
