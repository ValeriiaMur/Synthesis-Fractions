import { describe, it, expect } from 'vitest';
import { placeQuarter, isCovered, coverStatusText, COVER_TARGET } from './coverLogic';

describe('coverLogic', () => {
  it('COVER_TARGET is 2 (one half = two quarters)', () => {
    expect(COVER_TARGET).toBe(2);
  });

  it('placeQuarter on empty state: accepted, placedCount 0 → 1', () => {
    const res = placeQuarter({ placedCount: 0 });
    expect(res.accepted).toBe(true);
    expect(res.newState.placedCount).toBe(1);
  });

  it('placeQuarter when one already placed: accepted, 1 → 2', () => {
    const res = placeQuarter({ placedCount: 1 });
    expect(res.accepted).toBe(true);
    expect(res.newState.placedCount).toBe(2);
  });

  it('placeQuarter when target reached: rejected, state unchanged (overflow guard)', () => {
    const res = placeQuarter({ placedCount: 2 });
    expect(res.accepted).toBe(false);
    expect(res.newState.placedCount).toBe(2);
  });

  it('placeQuarter past target: still rejected (idempotent at cap)', () => {
    const res = placeQuarter({ placedCount: 5 });
    expect(res.accepted).toBe(false);
    expect(res.newState.placedCount).toBe(5);
  });

  it('isCovered: false below target, true at or above', () => {
    expect(isCovered({ placedCount: 0 })).toBe(false);
    expect(isCovered({ placedCount: 1 })).toBe(false);
    expect(isCovered({ placedCount: 2 })).toBe(true);
    expect(isCovered({ placedCount: 3 })).toBe(true);
  });

  describe('coverStatusText', () => {
    it('empty: tells the kid to tap a quarter', () => {
      const text = coverStatusText({ placedCount: 0 });
      expect(text).toMatch(/tap a quarter/);
    });
    it('one placed: names the state + counts the remaining', () => {
      const text = coverStatusText({ placedCount: 1 });
      expect(text).toMatch(/one quarter/);
      expect(text).toMatch(/one more/);
    });
    it('fully covered: states the equivalence', () => {
      const text = coverStatusText({ placedCount: 2 });
      expect(text).toMatch(/two quarters/);
      expect(text).toMatch(/cover the half exactly/);
    });
    it('never uses "wrong" — observational only', () => {
      const samples = [0, 1, 2, 3].map((n) =>
        coverStatusText({ placedCount: n }),
      );
      samples.forEach((s) => expect(s.toLowerCase()).not.toMatch(/\bwrong\b/));
    });
  });
});
