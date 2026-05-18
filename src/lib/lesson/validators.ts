import type {
  MCConfig,
  MCValidation,
  ManipulativeConfig,
  ManipulativeState,
  ManipulativeValidation,
} from './types';

export function validateMC(
  config: MCConfig,
  selectedOptionId: string,
): MCValidation {
  return {
    correct: selectedOptionId === config.correctOptionId,
    correctOptionId: config.correctOptionId,
  };
}

export function validateManipulative(
  config: ManipulativeConfig,
  state: ManipulativeState,
): ManipulativeValidation {
  if (config.kind !== state.kind) {
    return { correct: false, reason: 'manipulative-kind-mismatch' };
  }

  if (config.kind === 'chocolate' && state.kind === 'chocolate') {
    const expected =
      (config.referenceFraction.numerator * config.totalPieces) /
      config.referenceFraction.denominator;
    return { correct: state.piecesOnReference === expected };
  }

  if (config.kind === 'pizza' && state.kind === 'pizza') {
    return { correct: state.sliceCount === config.targetSlices };
  }

  if (config.kind === 'paper' && state.kind === 'paper') {
    const all = config.targetFolds.every((f) => state.folds.includes(f));
    return { correct: all };
  }

  if (config.kind === 'fractionbox' && state.kind === 'fractionbox') {
    return { correct: state.combos >= config.minCombos };
  }

  return { correct: false, reason: 'unhandled-manipulative-kind' };
}
