import { describe, it, expect } from 'vitest';
import {
  gcd,
  lcm,
  fracSum,
  fracValue,
  isOne,
  canFit,
  comboKey,
} from './fractions';
import type { FractionBoxBar } from './types';

function bar(num: number, den: number, id = `${num}/${den}`): FractionBoxBar {
  return { id, num, den, color: '' };
}

describe('gcd / lcm', () => {
  it('gcd handles positives, zeros, and order independence', () => {
    expect(gcd(12, 8)).toBe(4);
    expect(gcd(8, 12)).toBe(4);
    expect(gcd(7, 0)).toBe(7);
    expect(gcd(0, 7)).toBe(7);
  });

  it('lcm of co-primes is the product', () => {
    expect(lcm(3, 4)).toBe(12);
    expect(lcm(6, 8)).toBe(24);
  });
});

describe('fracSum', () => {
  it('returns 0/1 for the empty list', () => {
    expect(fracSum([])).toEqual({ num: 0, den: 1 });
  });

  it('sums two halves to 1/1', () => {
    expect(fracSum([bar(1, 2), bar(1, 2)])).toEqual({ num: 1, den: 1 });
  });

  it('sums ½ + ¼ + ¼ to 1/1', () => {
    expect(fracSum([bar(1, 2), bar(1, 4), bar(1, 4)])).toEqual({
      num: 1,
      den: 1,
    });
  });

  it('sums three sixths to 1/2', () => {
    expect(fracSum([bar(1, 6), bar(1, 6), bar(1, 6)])).toEqual({
      num: 1,
      den: 2,
    });
  });

  it('reduces 4/8 to 1/2', () => {
    expect(fracSum([bar(1, 8), bar(1, 8), bar(1, 8), bar(1, 8)])).toEqual({
      num: 1,
      den: 2,
    });
  });
});

describe('fracValue + isOne', () => {
  it('isOne is true when sum equals 1', () => {
    expect(isOne(fracSum([bar(1, 2), bar(1, 4), bar(1, 4)]))).toBe(true);
  });

  it('isOne is false for partial sums', () => {
    expect(isOne(fracSum([bar(1, 2), bar(1, 4)]))).toBe(false);
  });

  it('fracValue is 0 on zero-denominator (defensive)', () => {
    expect(fracValue({ num: 1, den: 0 })).toBe(0);
  });
});

describe('canFit', () => {
  it('lets a brick join when the result stays ≤ 1', () => {
    expect(canFit([bar(1, 2), bar(1, 4)], { num: 1, den: 4 })).toBe(true);
  });

  it('rejects a brick that would overflow', () => {
    expect(canFit([bar(1, 2), bar(1, 2)], { num: 1, den: 8 })).toBe(false);
  });
});

describe('comboKey', () => {
  it('is order-independent', () => {
    const a = comboKey([bar(1, 2, 'a'), bar(1, 4, 'b'), bar(1, 4, 'c')]);
    const b = comboKey([bar(1, 4, 'x'), bar(1, 2, 'y'), bar(1, 4, 'z')]);
    expect(a).toBe(b);
  });

  it('distinguishes different shapes that still sum to 1', () => {
    const halves = comboKey([bar(1, 2), bar(1, 2)]);
    const quarters = comboKey([bar(1, 4), bar(1, 4), bar(1, 4), bar(1, 4)]);
    expect(halves).not.toBe(quarters);
  });
});
