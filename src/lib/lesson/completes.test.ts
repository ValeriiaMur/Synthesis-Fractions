import { describe, it, expect } from 'vitest';
import { isBeatComplete } from './completes';
import type { Beat } from './types';

const namingHalfBeat: Beat = {
  id: 'name_half',
  phase: 'period_1_introduce',
  kindLabel: 'one half',
  prose: 'Tap each half.',
  manipulative: { kind: 'naming', fractions: ['half'] },
};

const namingMixBeat: Beat = {
  id: 'mix_half_quarter',
  phase: 'period_2_recognize',
  kindLabel: 'halves and quarters',
  prose: 'Tap the half. Then tap each quarter.',
  manipulative: {
    kind: 'naming',
    fractions: ['half', 'quarter'],
  },
};

const equivBeat: Beat = {
  id: 'equiv_half_two_quarters',
  phase: 'period_3_recall',
  kindLabel: 'whole = four quarters',
  prose: 'Place four quarters to fill the whole.',
  manipulative: { kind: 'equivalence', targetCount: 4 },
};

const paperBeat: Beat = {
  id: 'equiv_paper_check',
  phase: 'period_3_recall',
  kindLabel: 'check: half = two quarters',
  prose: 'Notice what we just saw: a whole can be named as halves and as quarters. Now show that same idea by folding the paper.',
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
      isBeatComplete(wholeBeat, { kind: 'naming', tapped: [0, 1] }),
    ).toBe(false);
  });
});

describe('isBeatComplete — naming (tap-each-piece)', () => {
  it('L1 halves-only: false until BOTH halves are tapped, true at 2 uniques', () => {
    expect(isBeatComplete(namingHalfBeat, { kind: 'naming', tapped: [] })).toBe(false);
    expect(isBeatComplete(namingHalfBeat, { kind: 'naming', tapped: [0] })).toBe(false);
    expect(isBeatComplete(namingHalfBeat, { kind: 'naming', tapped: [0, 1] })).toBe(true);
  });

  it('L3 mixed: needs all 5 pieces tapped (1 half + 4 quarters)', () => {
    expect(
      isBeatComplete(namingMixBeat, {
        kind: 'naming',
        tapped: [0, 1, 2, 3],
      }),
    ).toBe(false);
    expect(
      isBeatComplete(namingMixBeat, {
        kind: 'naming',
        tapped: [0, 1, 2, 3, 4],
      }),
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

describe('isBeatComplete — equivalence (whole = 4 quarters)', () => {
  it('is true when placedCount hits the target', () => {
    expect(
      isBeatComplete(equivBeat, { kind: 'equivalence', placedCount: 4 }),
    ).toBe(true);
  });

  it('is false short of the target', () => {
    expect(
      isBeatComplete(equivBeat, { kind: 'equivalence', placedCount: 3 }),
    ).toBe(false);
  });

  it('is false when state kind does not match', () => {
    expect(
      isBeatComplete(equivBeat, { kind: 'naming', tapped: [0, 1] }),
    ).toBe(false);
  });
});

describe('isBeatComplete — recall', () => {
  const recallBeat: Beat = {
    id: 'recall_name',
    phase: 'period_3_recall',
    kindLabel: 'what is this?',
    prose: 'What is this? Say it out loud — then show me.',
    manipulative: { kind: 'recall', fraction: 'half' },
  };

  it('is true once the answer is revealed', () => {
    expect(isBeatComplete(recallBeat, { kind: 'recall', revealed: true })).toBe(
      true,
    );
  });
  it('is false before reveal', () => {
    expect(isBeatComplete(recallBeat, { kind: 'recall', revealed: false })).toBe(
      false,
    );
  });
  it('is false when state kind does not match', () => {
    expect(
      isBeatComplete(recallBeat, { kind: 'naming', tapped: [0, 1] }),
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
