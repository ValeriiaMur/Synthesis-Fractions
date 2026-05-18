import { describe, it, expect } from 'vitest';
import { hexA, resolveHex } from './hexA';

describe('resolveHex', () => {
  it('returns a literal hex unchanged', () => {
    expect(resolveHex('#f06b85')).toBe('#f06b85');
  });

  it('resolves a known CSS var token to its hex', () => {
    expect(resolveHex('var(--blue)')).toBe('#5b8cff');
    expect(resolveHex('var(--green)')).toBe('#5fd897');
  });

  it('returns null for an unknown var', () => {
    expect(resolveHex('var(--mars)')).toBeNull();
  });

  it('returns null for a malformed input', () => {
    expect(resolveHex('not a color')).toBeNull();
    expect(resolveHex('#abc')).toBeNull();
    expect(resolveHex('')).toBeNull();
  });
});

describe('hexA', () => {
  it('builds an rgba string from a literal hex', () => {
    expect(hexA('#f06b85', 0.18)).toBe('rgba(240, 107, 133, 0.18)');
  });

  it('builds an rgba string from a CSS var', () => {
    expect(hexA('var(--blue)', 0.5)).toBe('rgba(91, 140, 255, 0.5)');
  });

  it('clamps alpha to [0,1]', () => {
    expect(hexA('#5fd897', 1.5)).toBe('rgba(95, 216, 151, 1)');
    expect(hexA('#5fd897', -0.2)).toBe('rgba(95, 216, 151, 0)');
  });

  it('returns transparent for an unresolvable input', () => {
    expect(hexA('not-a-color', 0.5)).toBe('transparent');
    expect(hexA('var(--mars)', 0.5)).toBe('transparent');
  });
});
