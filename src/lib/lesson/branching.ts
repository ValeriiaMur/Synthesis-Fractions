// Pure, deterministic branching layer for the scripted tutor.
//
// The lesson is a state machine. State lives in React (`activeIdx`,
// `doneSet`, `hintAttempts`, etc.). This module is the *rulebook* —
// given a beat + the kid's input + a couple of counters, it returns
// what the tutor says next. No LLM. No async. No side effects.
//
// Tested in `branching.test.ts`. Called from `LessonPage` at the four
// scripted-tutor decision points:
//
//   1. Wrong MC → which hint?            → reactToMC(...).line
//   2. Right MC → which celebration?     → reactToMC(...).line
//   3. Right MC → which next beat?       → reactToMC(...).nextBeatId
//   4. Right MC → which transition line? → reactToMC(...).transitionLine
//
// Plus a tiny helper for `{name}` slots and a one-liner to fetch a
// beat's enterLine (used by the mount-time speak on resume).

import { lesson } from './lessonData';
import type { Beat, BeatId } from './types';

/** Number of wrong attempts after which a beat's scaffolded MC (if
 *  authored) replaces the original. Lifted to a constant so tests and
 *  callers agree. */
export const SCAFFOLD_THRESHOLD = 3;

/** Substitute `{name}` (and any other `{slot}` you add later) in a
 *  template. Unknown slots are left untouched so an authoring typo
 *  shows up as `{misspelled}` in the UI rather than crashing. */
export function interpolate(
  template: string,
  vars: Readonly<Record<string, string>>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? vars[key] : match,
  );
}

export type MCReaction =
  | {
      readonly kind: 'correct';
      /** Tutor's celebration line, ready to speak. */
      readonly line: string;
      /** Id of the beat to advance to, or null on the final beat. */
      readonly nextBeatId: BeatId | null;
      /** Optional in-world line for the next beat, name-interpolated.
       *  Speak before the next beat's prose if present. */
      readonly transitionLine: string | null;
    }
  | {
      readonly kind: 'wrong';
      /** Tutor's hint, ready to speak. */
      readonly line: string;
      /** True once the kid has accumulated enough wrong attempts AND
       *  this beat has a scaffolded variant. */
      readonly shouldScaffold: boolean;
    };

/** Decide what the tutor says in response to an MC click.
 *
 *  @param beat            The active beat. Must have an `mc`.
 *  @param selectedOptionId  Which option the kid clicked.
 *  @param prevAttempts    How many wrong attempts the kid has *already*
 *                         made on this beat. Pass 0 for the first click.
 *  @param studentName     Used to interpolate `{name}` slots.
 *  @param scaffoldThreshold  Defaults to `SCAFFOLD_THRESHOLD`.
 */
export function reactToMC(
  beat: Beat,
  selectedOptionId: string,
  prevAttempts: number,
  studentName: string,
  scaffoldThreshold: number = SCAFFOLD_THRESHOLD,
): MCReaction {
  const mc = beat.mc;
  if (!mc) {
    throw new Error(`Beat ${beat.id} has no MC; reactToMC is not applicable.`);
  }

  // ---- correct path ----
  if (selectedOptionId === mc.correctOptionId) {
    const beats = lesson.beats;
    const idx = beats.findIndex((b) => b.id === beat.id);
    const nextBeat = idx >= 0 && idx + 1 < beats.length ? beats[idx + 1] : null;
    return {
      kind: 'correct',
      line: interpolate(mc.correctReply, { name: studentName }),
      nextBeatId: nextBeat?.id ?? null,
      transitionLine:
        nextBeat?.enterLine != null
          ? interpolate(nextBeat.enterLine, { name: studentName })
          : null,
    };
  }

  // ---- wrong path ----
  // Prefer the per-wrong-option hint if one is authored, otherwise fall
  // back to the attempt-indexed canonical hint (clamped at the last
  // entry so hints never run out).
  const attempt = prevAttempts + 1;
  const perOption = mc.hintByWrongOption?.[selectedOptionId];
  const escalating =
    mc.canonicalHints[Math.min(attempt - 1, mc.canonicalHints.length - 1)];
  const line = perOption ?? escalating;

  const shouldScaffold = attempt >= scaffoldThreshold && !!mc.scaffolded;

  return { kind: 'wrong', line, shouldScaffold };
}

/** Return a beat's enterLine with `{name}` interpolated, or null if the
 *  beat has none. Used at lesson-mount when resuming partway through. */
export function enterLineFor(beat: Beat, studentName: string): string | null {
  if (!beat.enterLine) return null;
  return interpolate(beat.enterLine, { name: studentName });
}
