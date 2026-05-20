import { describe, it, expect } from 'vitest';
import { placeQuarter, isCovered, coverStatusText, COVER_TARGET } from './coverLogic';

describe('coverLogic (whole = 4 quarters)', () => {
  it('COVER_TARGET is 4 — the whole is 4 quarters', () => {
    expect(COVER_TARGET).toBe(4);
  });

  it('placeQuarter on empty state: accepted, placedCount 0 → 1', () => {
    const res = placeQuarter({ placedCount: 0 });
    expect(res.accepted).toBe(true);
    expect(res.newState.placedCount).toBe(1);
  });

  it('placeQuarter accumulates up to the target', () => {
    expect(placeQuarter({ placedCount: 1 }).newState.placedCount).toBe(2);
    expect(placeQuarter({ placedCount: 3 }).newState.placedCount).toBe(4);
  });

  it('placeQuarter when target reached: rejected, state unchanged (overflow guard)', () => {
    const res = placeQuarter({ placedCount: 4 });
    expect(res.accepted).toBe(false);
    expect(res.newState.placedCount).toBe(4);
  });

  it('placeQuarter past target: still rejected (idempotent at cap)', () => {
    const res = placeQuarter({ placedCount: 7 });
    expect(res.accepted).toBe(false);
    expect(res.newState.placedCount).toBe(7);
  });

  it('isCovered: false below target, true at or above', () => {
    expect(isCovered({ placedCount: 0 })).toBe(false);
    expect(isCovered({ placedCount: 3 })).toBe(false);
    expect(isCovered({ placedCount: 4 })).toBe(true);
    expect(isCovered({ placedCount: 5 })).toBe(true);
  });

  it('legacy target = 2 still works for the half-cover behaviour', () => {
    expect(placeQuarter({ placedCount: 2 }, 2).accepted).toBe(false);
    expect(isCovered({ placedCount: 2 }, 2)).toBe(true);
  });

  describe('coverStatusText — whole (target = 4)', () => {
    it('empty: tells the kid to drag a quarter to fill the whole', () => {
      const text = coverStatusText({ placedCount: 0 }, 4);
      expect(text).toMatch(/drag a quarter/);
      expect(text).toMatch(/whole/i);
    });
    it('partial: names placed count + remaining', () => {
      const text = coverStatusText({ placedCount: 2 }, 4);
      expect(text).toMatch(/2 quarters/);
      expect(text).toMatch(/2 more/);
    });
    it('full: states the equivalence (4 quarters = 1 whole)', () => {
      const text = coverStatusText({ placedCount: 4 }, 4);
      expect(text).toMatch(/four quarters fill the whole/);
    });
    it('never uses "wrong"', () => {
      const samples = [0, 1, 2, 3, 4].map((n) =>
        coverStatusText({ placedCount: n }, 4),
      );
      samples.forEach((s) => expect(s.toLowerCase()).not.toMatch(/\bwrong\b/));
    });
  });
});
