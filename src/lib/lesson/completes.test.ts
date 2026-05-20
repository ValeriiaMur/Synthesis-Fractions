import { describe, it, expect } from 'vitest';
import { isBeatComplete } from './completes';
import type { Beat } from './types';

const namingHalfBeat: Beat = {
  id: 'name_half',
  phase: 'period_1_introduce',
  kindLabel: 'one half',
  prose: 'Tap one half.',
  manipulative: { kind: 'naming', fractions: ['half'], masteryStreak: 3 },
};

const namingMixBeat: Beat = {
  id: 'mix_half_quarter',
  phase: 'period_2_recognize',
  kindLabel: 'halves and quarters',
  prose: 'Tap the half. Then tap the quarter.',
  manipulative: {
    kind: 'naming',
    fractions: ['half', 'quarter'],
    masteryStreak: 4,
  },
};

const equivBeat: Beat = {
  id: 'equiv_half_two_quarters',
  phase: 'period_3_recall',
  kindLabel: 'half = two quarters',
  prose: 'Place quarters on the half until it fits exactly.',
  manipulative: { kind: 'equivalence', targetCount: 2 },
};

const paperBeat: Beat = {
  id: 'equiv_paper_check',
  phase: 'period_3_recall',
  kindLabel: 'check: half = two quarters',
  prose: 'Fold the paper. Then fold again.',
  manipulative: { kind: 'paper', targetFolds: ['horizontal', 'vertical'] },
};

const wholeBeat: Beat = {
  id: 'whole_intro',
  phase: 'period_1_introduce',
  kindLabel: 'one whole',
  prose: 'This is one whole. Tap to split it in half.',
  manipulative: { kind: 'whole' },
};

describe('isBeatComplete — whole intro', () => {
  it('is true once the kid has split the whole', () => {
    expect(isBeatComplete(wholeBeat, { kind: 'whole', split: true })).toBe(true);
  });
  it('is false until the split happens', () => {
    expect(isBeatComplete(wholeBeat, { kind: 'whole', split: false })).toBe(false);
  });
  it('is false without state', () => {
    expect(isBeatComplete(wholeBeat, undefined)).toBe(false);
  });
  it('is false when state kind does not match', () => {
    expect(
      isBeatComplete(wholeBeat, { kind: 'naming', streak: 5 }),
    ).toBe(false);
  });
});

describe('isBeatComplete — naming', () => {
  it('is true when streak meets the mastery threshold', () => {
    expect(
      isBeatComplete(namingHalfBeat, { kind: 'naming', streak: 3 }),
    ).toBe(true);
  });

  it('is true once streak exceeds the threshold', () => {
    expect(
      isBeatComplete(namingHalfBeat, { kind: 'naming', streak: 5 }),
    ).toBe(true);
  });

  it('is false below the threshold', () => {
    expect(
      isBeatComplete(namingHalfBeat, { kind: 'naming', streak: 2 }),
    ).toBe(false);
  });

  it('respects a custom streak threshold per beat', () => {
    expect(
      isBeatComplete(namingMixBeat, { kind: 'naming', streak: 3 }),
    ).toBe(false);
    expect(
      isBeatComplete(namingMixBeat, { kind: 'naming', streak: 4 }),
    ).toBe(true);
  });

  it('is false without any state', () => {
    expect(isBeatComplete(namingHalfBeat, undefined)).toBe(false);
  });

  it('is false when state kind does not match', () => {
    expect(
      isBeatComplete(namingHalfBeat, {
        kind: 'equivalence',
        placedCount: 2,
      }),
    ).toBe(false);
  });
});

describe('isBeatComplete — equivalence', () => {
  it('is true when placedCount hits the target', () => {
    expect(
      isBeatComplete(equivBeat, { kind: 'equivalence', placedCount: 2 }),
    ).toBe(true);
  });

  it('is false short of the target', () => {
    expect(
      isBeatComplete(equivBeat, { kind: 'equivalence', placedCount: 1 }),
    ).toBe(false);
  });

  it('is false when state kind does not match', () => {
    expect(
      isBeatComplete(equivBeat, { kind: 'naming', streak: 2 }),
    ).toBe(false);
  });
});

describe('isBeatComplete — paper-fold transfer check', () => {
  it('is true after both required folds have been made', () => {
    expect(
      isBeatComplete(paperBeat, {
        kind: 'paper',
        folds: ['horizontal', 'vertical'],
      }),
    ).toBe(true);
  });

  it('is false after only one fold', () => {
    expect(
      isBeatComplete(paperBeat, { kind: 'paper', folds: ['horizontal'] }),
    ).toBe(false);
  });

  it('is false with zero folds', () => {
    expect(isBeatComplete(paperBeat, { kind: 'paper', folds: [] })).toBe(false);
  });

  it('is false when state kind does not match the manipulative kind', () => {
    expect(
      isBeatComplete(paperBeat, { kind: 'equivalence', placedCount: 2 }),
    ).toBe(false);
  });
});
