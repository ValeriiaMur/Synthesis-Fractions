import { describe, it, expect } from 'vitest';
import { shade } from './shade';

describe('shade', () => {
  it('lightens a mid-gray', () => {
    expect(shade('#808080', 0.1).toLowerCase()).toBe('#999999');
  });

  it('darkens a mid-gray', () => {
    expect(shade('#808080', -0.1).toLowerCase()).toBe('#676767');
  });

  it('clamps when overshooting white', () => {
    expect(shade('#f0f0f0', 1).toLowerCase()).toBe('#ffffff');
  });

  it('clamps when overshooting black', () => {
    expect(shade('#101010', -1).toLowerCase()).toBe('#000000');
  });

  it('returns CSS var strings unchanged', () => {
    expect(shade('var(--red)', 0.2)).toBe('var(--red)');
  });

  it('returns malformed hex unchanged', () => {
    expect(shade('#fff', 0.1)).toBe('#fff');
  });
});
