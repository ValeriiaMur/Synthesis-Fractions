import { describe, it, expect } from 'vitest';
import {
  evalTap,
  feedbackMessage,
  pickPromptKind,
  regionCount,
  regionKind,
  type FractionKind,
} from './namingLogic';

describe('regionCount', () => {
  it('returns 2 for halves-only (L1)', () => {
    expect(regionCount(['half'])).toBe(2);
  });
  it('returns 4 for quarters-only (L2)', () => {
    expect(regionCount(['quarter'])).toBe(4);
  });
  it('returns 5 for mixed: 1 half + 4 quarters (L3)', () => {
    expect(regionCount(['half', 'quarter'])).toBe(5);
  });
});

describe('regionKind', () => {
  it('halves-only: every region is a half', () => {
    expect(regionKind(0, ['half'])).toBe('half');
    expect(regionKind(1, ['half'])).toBe('half');
  });
  it('quarters-only: every region is a quarter', () => {
    expect(regionKind(0, ['quarter'])).toBe('quarter');
    expect(regionKind(3, ['quarter'])).toBe('quarter');
  });
  it('mixed: index 0 is the half-tile, 1..4 are quarter-tiles', () => {
    expect(regionKind(0, ['half', 'quarter'])).toBe('half');
    expect(regionKind(1, ['half', 'quarter'])).toBe('quarter');
    expect(regionKind(2, ['half', 'quarter'])).toBe('quarter');
    expect(regionKind(3, ['half', 'quarter'])).toBe('quarter');
    expect(regionKind(4, ['half', 'quarter'])).toBe('quarter');
  });
});

describe('pickPromptKind', () => {
  it('halves-only always prompts half', () => {
    expect(pickPromptKind(['half'], undefined)).toBe('half');
    expect(pickPromptKind(['half'], 'half')).toBe('half');
  });
  it('quarters-only always prompts quarter', () => {
    expect(pickPromptKind(['quarter'], undefined)).toBe('quarter');
  });
  it('mixed: first prompt is half by convention', () => {
    expect(pickPromptKind(['half', 'quarter'], undefined)).toBe('half');
  });
  it('mixed: alternates strictly from the previous prompt', () => {
    expect(pickPromptKind(['half', 'quarter'], 'half')).toBe('quarter');
    expect(pickPromptKind(['half', 'quarter'], 'quarter')).toBe('half');
  });
});

describe('evalTap', () => {
  it('correct tap: accepted + streak increments', () => {
    expect(evalTap('half', 'half', 0)).toEqual({ accepted: true, nextStreak: 1 });
    expect(evalTap('quarter', 'quarter', 2)).toEqual({
      accepted: true,
      nextStreak: 3,
    });
  });
  it('wrong tap: silent — not accepted, streak unchanged, no penalty', () => {
    expect(evalTap('half', 'quarter', 2)).toEqual({
      accepted: false,
      nextStreak: 2,
    });
    expect(evalTap('quarter', 'half', 0)).toEqual({
      accepted: false,
      nextStreak: 0,
    });
  });
  it('streak never resets on wrong tap (Montessori control-of-error)', () => {
    const result = evalTap('half', 'quarter', 5);
    expect(result.nextStreak).toBe(5);
  });
});

describe('feedbackMessage', () => {
  it('correct tap on half-prompt: success tone + names the half', () => {
    const fb = feedbackMessage('half', 'half');
    expect(fb.tone).toBe('success');
    expect(fb.text).toMatch(/half/);
  });
  it('correct tap on quarter-prompt: success tone + names the quarter', () => {
    const fb = feedbackMessage('quarter', 'quarter');
    expect(fb.tone).toBe('success');
    expect(fb.text).toMatch(/quarter/);
  });
  it('wrong tap on half-prompt: observation, names tapped kind, points back', () => {
    const fb = feedbackMessage('half', 'quarter');
    expect(fb.tone).toBe('observation');
    expect(fb.text).toMatch(/quarter/);
    expect(fb.text).toMatch(/find the half/);
  });
  it('wrong tap on quarter-prompt: observation, names tapped kind, points back', () => {
    const fb = feedbackMessage('quarter', 'half');
    expect(fb.tone).toBe('observation');
    expect(fb.text).toMatch(/half/);
    expect(fb.text).toMatch(/find the quarter/);
  });
  it('never uses the word "wrong" — observational, not corrective', () => {
    const fb = feedbackMessage('half', 'quarter');
    expect(fb.text.toLowerCase()).not.toMatch(/\bwrong\b/);
  });
});

describe('type contract', () => {
  it('FractionKind admits only half and quarter', () => {
    const halves: FractionKind[] = ['half'];
    const quarters: FractionKind[] = ['quarter'];
    expect(halves[0]).toBe('half');
    expect(quarters[0]).toBe('quarter');
  });
});
