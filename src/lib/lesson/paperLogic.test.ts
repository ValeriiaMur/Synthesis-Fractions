import { describe, it, expect } from 'vitest';
import { applyFold, isProven, nextFoldAxis, REQUIRED_FOLDS } from './paperLogic';

describe('paperLogic', () => {
  it('REQUIRED_FOLDS is [horizontal, vertical] — two perpendicular folds prove the equivalence', () => {
    expect(REQUIRED_FOLDS).toEqual(['horizontal', 'vertical']);
  });

  it('nextFoldAxis on empty folds: horizontal first', () => {
    expect(nextFoldAxis([])).toBe('horizontal');
  });

  it('nextFoldAxis after horizontal: vertical next', () => {
    expect(nextFoldAxis(['horizontal'])).toBe('vertical');
  });

  it('nextFoldAxis when both folds done: null (no more folds)', () => {
    expect(nextFoldAxis(['horizontal', 'vertical'])).toBeNull();
  });

  it('applyFold from empty: returns [horizontal]', () => {
    expect(applyFold([])).toEqual(['horizontal']);
  });

  it('applyFold from [horizontal]: returns [horizontal, vertical]', () => {
    expect(applyFold(['horizontal'])).toEqual(['horizontal', 'vertical']);
  });

  it('applyFold at the cap: idempotent — returns the same folds reference', () => {
    const at = ['horizontal', 'vertical'] as const;
    expect(applyFold(at)).toEqual(at);
  });

  it('isProven: false below 2 folds, true at 2 or more', () => {
    expect(isProven([])).toBe(false);
    expect(isProven(['horizontal'])).toBe(false);
    expect(isProven(['horizontal', 'vertical'])).toBe(true);
  });
});
