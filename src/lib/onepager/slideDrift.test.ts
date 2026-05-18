import { describe, it, expect } from 'vitest';
import { slideDriftOffset } from './slideDrift';

describe('slideDriftOffset', () => {
  it('returns zero drift when no principle is active (idx -1)', () => {
    expect(slideDriftOffset(3, -1)).toEqual({ dx: 0, dy: 0 });
  });

  it('is deterministic — same inputs → same output across calls', () => {
    const a = slideDriftOffset(2, 5);
    const b = slideDriftOffset(2, 5);
    expect(a).toEqual(b);
  });

  it('produces different offsets for different slides', () => {
    const a = slideDriftOffset(0, 0);
    const b = slideDriftOffset(0, 1);
    expect(a).not.toEqual(b);
  });

  it('produces different offsets for different doodles on the same slide', () => {
    const a = slideDriftOffset(0, 3);
    const b = slideDriftOffset(1, 3);
    expect(a).not.toEqual(b);
  });

  it('clamps magnitudes to the documented limits (±14px x, ±10px y)', () => {
    for (let i = 0; i < 12; i++) {
      for (let s = 0; s < 8; s++) {
        const { dx, dy } = slideDriftOffset(i, s);
        expect(Math.abs(dx)).toBeLessThanOrEqual(14);
        expect(Math.abs(dy)).toBeLessThanOrEqual(10);
      }
    }
  });
});
