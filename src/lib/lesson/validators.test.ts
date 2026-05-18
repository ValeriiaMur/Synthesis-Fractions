import { describe, it, expect } from 'vitest';
import { validateMC, validateManipulative } from './validators';
import type { MCConfig, ManipulativeConfig, ManipulativeState } from './types';

const sampleMC: MCConfig = {
  question: 'How many quarter-pieces make one half?',
  options: [
    { id: 'one', label: 'One' },
    { id: 'two', label: 'Two' },
    { id: 'three', label: 'Three' },
  ],
  correctOptionId: 'two',
  canonicalHints: [
    'Look at the chocolate bar — what if you put two quarter-pieces together?',
  ],
};

describe('validateMC', () => {
  it('marks the keyed option as correct', () => {
    const result = validateMC(sampleMC, 'two');
    expect(result.correct).toBe(true);
    expect(result.correctOptionId).toBe('two');
  });

  it('marks any other option as incorrect', () => {
    expect(validateMC(sampleMC, 'one').correct).toBe(false);
    expect(validateMC(sampleMC, 'three').correct).toBe(false);
  });

  it('returns the correct option id even when the student is wrong', () => {
    expect(validateMC(sampleMC, 'three').correctOptionId).toBe('two');
  });

  it('treats an unknown option id as incorrect', () => {
    expect(validateMC(sampleMC, 'not-an-option').correct).toBe(false);
  });
});

describe('validateManipulative — chocolate', () => {
  const config: ManipulativeConfig = {
    kind: 'chocolate',
    totalPieces: 4,
    referenceFraction: { numerator: 1, denominator: 2 },
  };

  it('is correct when two quarter-pieces are placed on the half-bar reference', () => {
    const state: ManipulativeState = { kind: 'chocolate', piecesOnReference: 2 };
    expect(validateManipulative(config, state).correct).toBe(true);
  });

  it('is incorrect when fewer than two pieces cover the reference', () => {
    const state: ManipulativeState = { kind: 'chocolate', piecesOnReference: 1 };
    expect(validateManipulative(config, state).correct).toBe(false);
  });

  it('is incorrect when more than two pieces are stacked on the reference', () => {
    const state: ManipulativeState = { kind: 'chocolate', piecesOnReference: 3 };
    expect(validateManipulative(config, state).correct).toBe(false);
  });

  it('is incorrect when the state kind does not match the config kind', () => {
    const state: ManipulativeState = { kind: 'pizza', sliceCount: 4 };
    expect(validateManipulative(config, state).correct).toBe(false);
  });
});

describe('validateManipulative — pizza', () => {
  const config: ManipulativeConfig = {
    kind: 'pizza',
    initialSlices: 2,
    targetSlices: 4,
  };

  it('is correct when slice count reaches the target', () => {
    const state: ManipulativeState = { kind: 'pizza', sliceCount: 4 };
    expect(validateManipulative(config, state).correct).toBe(true);
  });

  it('is incorrect when slice count is short of the target', () => {
    const state: ManipulativeState = { kind: 'pizza', sliceCount: 2 };
    expect(validateManipulative(config, state).correct).toBe(false);
  });
});

describe('validateManipulative — paper', () => {
  const config: ManipulativeConfig = {
    kind: 'paper',
    targetFolds: ['horizontal', 'vertical'],
  };

  it('is correct when both target folds are present, in any order', () => {
    const state: ManipulativeState = {
      kind: 'paper',
      folds: ['vertical', 'horizontal'],
    };
    expect(validateManipulative(config, state).correct).toBe(true);
  });

  it('is incorrect when a target fold is missing', () => {
    const state: ManipulativeState = { kind: 'paper', folds: ['horizontal'] };
    expect(validateManipulative(config, state).correct).toBe(false);
  });
});

describe('validateManipulative — fractionbox', () => {
  const config: ManipulativeConfig = {
    kind: 'fractionbox',
    palette: [
      { num: 1, den: 2 },
      { num: 1, den: 4 },
    ],
    minCombos: 2,
  };

  it('is correct once the learner has built minCombos full-fills', () => {
    const state: ManipulativeState = {
      kind: 'fractionbox',
      bars: [],
      combos: 2,
    };
    expect(validateManipulative(config, state).correct).toBe(true);
  });

  it('is incorrect with fewer combos than required', () => {
    const state: ManipulativeState = {
      kind: 'fractionbox',
      bars: [],
      combos: 1,
    };
    expect(validateManipulative(config, state).correct).toBe(false);
  });

  it('is incorrect when state kind does not match', () => {
    const state: ManipulativeState = { kind: 'paper', folds: [] };
    expect(validateManipulative(config, state).correct).toBe(false);
  });
});
