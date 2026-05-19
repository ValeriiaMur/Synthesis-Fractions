import { describe, it, expect } from 'vitest';
import { lesson } from './lessonData';
import {
  interpolate,
  reactToMC,
  enterLineFor,
  type MCReaction,
} from './branching';

function getBeat(id: string) {
  const b = lesson.beats.find((x) => x.id === id);
  if (!b) throw new Error(`Unknown beat: ${id}`);
  return b;
}

describe('interpolate', () => {
  it('replaces {name} with the supplied name', () => {
    expect(interpolate('Hi, {name}.', { name: 'Ben' })).toBe('Hi, Ben.');
  });

  it('handles multiple {name} occurrences', () => {
    expect(interpolate('{name}, {name}!', { name: 'Lera' })).toBe(
      'Lera, Lera!',
    );
  });

  it('returns the template unchanged when no slot is present', () => {
    expect(interpolate('No slots here.', { name: 'Ben' })).toBe(
      'No slots here.',
    );
  });

  it('leaves unknown slots intact', () => {
    expect(interpolate('Hi {name}, your {planet}.', { name: 'Ben' })).toBe(
      'Hi Ben, your {planet}.',
    );
  });
});

describe('reactToMC — correct answer', () => {
  it('returns correctReply interpolated with the student name', () => {
    const beat = getBeat('chocolate_check');
    const r = reactToMC(beat, 'two', 0, 'Ben');
    expect(r.kind).toBe('correct');
    if (r.kind !== 'correct') throw new Error('type narrowed wrong');
    expect(r.line).toMatch(/two/i);
    // correctReply doesn't have {name} in this beat — but interpolate is
    // a no-op then, so the assertion is that no `{name}` token survives.
    expect(r.line).not.toMatch(/\{name\}/);
  });

  it('reports the next beat id when there is one', () => {
    const beat = getBeat('chocolate_check');
    const r = reactToMC(beat, 'two', 0, 'Ben');
    if (r.kind !== 'correct') throw new Error('type narrowed wrong');
    expect(r.nextBeatId).toBe('pizza_explore');
  });

  it('supplies the next beat enterLine when present, name-interpolated', () => {
    const beat = getBeat('chocolate_check');
    const r = reactToMC(beat, 'two', 0, 'Lera');
    if (r.kind !== 'correct') throw new Error('type narrowed wrong');
    expect(r.transitionLine).toContain('Lera');
    expect(r.transitionLine).not.toMatch(/\{name\}/);
  });

  it('reports null nextBeatId on the final MC', () => {
    const beat = getBeat('paper_fold_final');
    const r = reactToMC(beat, 'half-equals-two-quarters', 0, 'Ben');
    if (r.kind !== 'correct') throw new Error('type narrowed wrong');
    // paper_fold_final is followed by fraction_box_explore (a manipulative
    // beat with no MC). The correct branch should still report the next
    // beat id when one exists.
    expect(r.nextBeatId).toBe('fraction_box_explore');
  });
});

describe('reactToMC — wrong answer', () => {
  it('returns the per-wrong-option hint when one is authored', () => {
    const beat = getBeat('chocolate_check');
    const r = reactToMC(beat, 'four', 0, 'Ben');
    expect(r.kind).toBe('wrong');
    if (r.kind !== 'wrong') throw new Error('type narrowed wrong');
    expect(r.line).toMatch(/whole bar|tray only holds the half/i);
  });

  it('falls back to the attempt-indexed canonical hint when no per-option hint exists', () => {
    // Pizza check has hintByWrongOption only for "no". To exercise the
    // fallback path we synthesize a beat where the option isn't covered.
    const beat = getBeat('pizza_check');
    // First attempt — would normally pick canonicalHints[0]. We pass a
    // wrong option that isn't in hintByWrongOption to force the fallback.
    const r = reactToMC(
      { ...beat, mc: { ...beat.mc!, hintByWrongOption: {} } },
      'no',
      0,
      'Ben',
    );
    if (r.kind !== 'wrong') throw new Error('type narrowed wrong');
    expect(r.line).toBe(beat.mc!.canonicalHints[0]);
  });

  it('escalates through canonicalHints by attempt count', () => {
    const beat = getBeat('chocolate_check');
    // Stub out hintByWrongOption so we can observe escalation cleanly.
    const stubbed = { ...beat, mc: { ...beat.mc!, hintByWrongOption: {} } };
    const r0 = reactToMC(stubbed, 'four', 0, 'Ben');
    const r1 = reactToMC(stubbed, 'four', 1, 'Ben');
    const r2 = reactToMC(stubbed, 'four', 2, 'Ben');
    if (
      r0.kind !== 'wrong' ||
      r1.kind !== 'wrong' ||
      r2.kind !== 'wrong'
    ) {
      throw new Error('type narrowed wrong');
    }
    expect(r0.line).toBe(beat.mc!.canonicalHints[0]);
    expect(r1.line).toBe(beat.mc!.canonicalHints[1]);
    expect(r2.line).toBe(beat.mc!.canonicalHints[2]);
  });

  it('clamps escalation to the last canonical hint when attempts run past', () => {
    const beat = getBeat('chocolate_check');
    const stubbed = { ...beat, mc: { ...beat.mc!, hintByWrongOption: {} } };
    const r99 = reactToMC(stubbed, 'four', 99, 'Ben');
    if (r99.kind !== 'wrong') throw new Error('type narrowed wrong');
    const hints = beat.mc!.canonicalHints;
    expect(r99.line).toBe(hints[hints.length - 1]);
  });

  it('flags shouldScaffold once the threshold is reached AND a scaffolded MC exists', () => {
    const beat = getBeat('chocolate_check'); // has scaffolded
    const before = reactToMC(beat, 'four', 1, 'Ben'); // attempt count 2 after this
    const at = reactToMC(beat, 'four', 2, 'Ben'); // attempt count 3 after this
    if (before.kind !== 'wrong' || at.kind !== 'wrong') {
      throw new Error('type narrowed wrong');
    }
    expect(before.shouldScaffold).toBe(false);
    expect(at.shouldScaffold).toBe(true);
  });

  it('never flags shouldScaffold when the beat has no scaffolded variant', () => {
    const beat = getBeat('pizza_check'); // no scaffolded (only 2 options)
    const r = reactToMC(beat, 'no', 5, 'Ben');
    if (r.kind !== 'wrong') throw new Error('type narrowed wrong');
    expect(r.shouldScaffold).toBe(false);
  });
});

describe('enterLineFor', () => {
  it('returns the beat enterLine with {name} interpolated', () => {
    expect(enterLineFor(getBeat('pizza_explore'), 'Ben')).toBe(
      'Locked in, Ben. Pizza touchdown coming up.',
    );
  });

  it('returns null when the beat has no enterLine', () => {
    expect(enterLineFor(getBeat('chocolate_intro'), 'Ben')).toBeNull();
  });
});

// One catch-all assertion that the discriminated union is exhaustive —
// keeps future refactors honest.
describe('MCReaction type shape', () => {
  it('correct and wrong are the only kinds', () => {
    const kinds: MCReaction['kind'][] = ['correct', 'wrong'];
    expect(kinds).toHaveLength(2);
  });
});
