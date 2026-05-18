import { describe, it, expect } from 'vitest';
import { stripMarkup } from './stripMarkup';

describe('stripMarkup', () => {
  it('returns plain text unchanged', () => {
    expect(stripMarkup('Hello, world.')).toBe('Hello, world.');
  });

  it('removes a single highlight pair', () => {
    expect(stripMarkup('place {y}two{/y} pieces')).toBe('place two pieces');
  });

  it('removes nested-ish multi-color tokens', () => {
    expect(
      stripMarkup('{r}1{/r} half equals {b}2{/b} quarters and {g}½{/g}'),
    ).toBe('1 half equals 2 quarters and ½');
  });

  it('handles strings with no tokens at all', () => {
    expect(stripMarkup('')).toBe('');
  });

  it('only strips lowercase single-letter tokens', () => {
    // Multi-character tags aren't a part of the format.
    expect(stripMarkup('left {Y}word{/Y} alone')).toBe('left {Y}word{/Y} alone');
  });
});
