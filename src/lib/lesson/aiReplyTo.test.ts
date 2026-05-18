import { describe, it, expect } from 'vitest';
import { aiReplyTo } from './aiReplyTo';
import type { Beat } from './types';

const chocolateBeat: Beat = {
  id: 'chocolate_intro',
  phase: 'period_1_introduce',
  kindLabel: 'manipulative — chocolate bar',
  prose: 'Here is a {y}chocolate bar{/y}.',
  manipulative: {
    kind: 'chocolate',
    totalPieces: 4,
    referenceFraction: { numerator: 1, denominator: 2 },
  },
};

const mcBeat: Beat = {
  id: 'chocolate_check',
  phase: 'period_2_recognize',
  kindLabel: 'check — recall',
  prose: 'You moved quarter-pieces.',
  mc: {
    question: 'How many quarter-pieces covered the half-space?',
    options: [{ id: 'two', label: 'Two' }],
    correctOptionId: 'two',
    canonicalHints: ['first hint', 'second hint'],
  },
};

describe('aiReplyTo', () => {
  it('greets the student by name on hello', () => {
    expect(aiReplyTo('hi', chocolateBeat, 'Ben')).toContain('Ben');
  });

  it('returns the first MC hint when stuck on an MC beat', () => {
    expect(aiReplyTo("I'm stuck", mcBeat, 'Ben')).toBe('first hint');
  });

  it('returns the chocolate-specific stuck hint on a chocolate beat', () => {
    expect(aiReplyTo('help me', chocolateBeat, 'Ben')).toMatch(
      /quarter-pieces/i,
    );
  });

  it('strips highlight tokens when asked to repeat the prose', () => {
    expect(aiReplyTo('show me again', chocolateBeat, 'Ben')).toBe(
      'Here is a chocolate bar.',
    );
  });

  it('falls back to a generic redirect when nothing matches', () => {
    expect(aiReplyTo('purple', chocolateBeat, 'Ben')).toMatch(
      /Look at what's in front of you/i,
    );
  });

  it("steers a 'what next' question toward the active manipulative", () => {
    expect(aiReplyTo('what next?', chocolateBeat, 'Ben')).toMatch(
      /next cell will open/,
    );
  });
});
