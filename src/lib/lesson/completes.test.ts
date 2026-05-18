import { describe, it, expect } from 'vitest';
import { isBeatComplete, lookupHint } from './completes';
import type { Beat } from './types';

const chocolateBeat: Beat = {
  id: 'chocolate_intro',
  phase: 'period_1_introduce',
  kindLabel: 'manipulative — chocolate bar',
  prose: 'place the pieces',
  manipulative: {
    kind: 'chocolate',
    totalPieces: 4,
    referenceFraction: { numerator: 1, denominator: 2 },
  },
};

const pizzaBeat: Beat = {
  id: 'pizza_explore',
  phase: 'period_2_recognize',
  kindLabel: 'manipulative — pizza',
  prose: 'slice it',
  manipulative: { kind: 'pizza', initialSlices: 2, targetSlices: 4 },
};

const paperBeat: Beat = {
  id: 'paper_fold_final',
  phase: 'period_3_recall',
  kindLabel: 'manipulative + check — paper',
  prose: 'fold it',
  manipulative: { kind: 'paper', targetFolds: ['horizontal', 'vertical'] },
};

describe('isBeatComplete — chocolate', () => {
  it('is true when exactly two pieces sit on the reference', () => {
    expect(
      isBeatComplete(chocolateBeat, {
        kind: 'chocolate',
        piecesOnReference: 2,
      }),
    ).toBe(true);
  });

  it('is false when fewer or more than two pieces are placed', () => {
    expect(
      isBeatComplete(chocolateBeat, {
        kind: 'chocolate',
        piecesOnReference: 1,
      }),
    ).toBe(false);
    expect(
      isBeatComplete(chocolateBeat, {
        kind: 'chocolate',
        piecesOnReference: 3,
      }),
    ).toBe(false);
  });

  it('is false without any state', () => {
    expect(isBeatComplete(chocolateBeat, undefined)).toBe(false);
  });

  it('is false when state kind does not match', () => {
    expect(
      isBeatComplete(chocolateBeat, { kind: 'pizza', sliceCount: 4 }),
    ).toBe(false);
  });
});

describe('isBeatComplete — pizza', () => {
  it('is true when slice count hits the target', () => {
    expect(isBeatComplete(pizzaBeat, { kind: 'pizza', sliceCount: 4 })).toBe(
      true,
    );
  });

  it('is false short of the target', () => {
    expect(isBeatComplete(pizzaBeat, { kind: 'pizza', sliceCount: 2 })).toBe(
      false,
    );
  });
});

describe('isBeatComplete — paper', () => {
  it('is true once two folds are present, in any order', () => {
    expect(
      isBeatComplete(paperBeat, {
        kind: 'paper',
        folds: ['vertical', 'horizontal'],
      }),
    ).toBe(true);
  });

  it('is false with a single fold', () => {
    expect(
      isBeatComplete(paperBeat, { kind: 'paper', folds: ['horizontal'] }),
    ).toBe(false);
  });
});

const fractionBoxBeat: Beat = {
  id: 'fraction_box_explore',
  phase: 'period_3_recall',
  kindLabel: 'manipulative — fraction box',
  prose: 'build it',
  manipulative: {
    kind: 'fractionbox',
    palette: [
      { num: 1, den: 2 },
      { num: 1, den: 4 },
    ],
    minCombos: 2,
  },
};

describe('isBeatComplete — fractionbox', () => {
  it('is true at or above minCombos', () => {
    expect(
      isBeatComplete(fractionBoxBeat, {
        kind: 'fractionbox',
        bars: [],
        combos: 2,
      }),
    ).toBe(true);
  });

  it('is false below minCombos', () => {
    expect(
      isBeatComplete(fractionBoxBeat, {
        kind: 'fractionbox',
        bars: [],
        combos: 1,
      }),
    ).toBe(false);
  });
});

describe('lookupHint', () => {
  const hints = ['first', 'second', 'third'];

  it('returns the nth hint', () => {
    expect(lookupHint(hints, 0)).toBe('first');
    expect(lookupHint(hints, 1)).toBe('second');
    expect(lookupHint(hints, 2)).toBe('third');
  });

  it('caps at the last hint when the learner runs out', () => {
    expect(lookupHint(hints, 99)).toBe('third');
  });

  it('clamps negative attempts to zero', () => {
    expect(lookupHint(hints, -2)).toBe('first');
  });

  it('returns null with no hints', () => {
    expect(lookupHint([], 0)).toBe(null);
    expect(lookupHint(undefined, 0)).toBe(null);
  });
});
