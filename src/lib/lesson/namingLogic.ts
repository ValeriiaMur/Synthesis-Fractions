/**
 * Pure helpers for the NamingMaterial tap-mastery interaction.
 *
 * Three layouts driven entirely by `NamingConfig.fractions`:
 *
 *   ['half']             — 2-region chocolate bar (L1)
 *   ['quarter']          — 4-region chocolate bar (L2)
 *   ['half', 'quarter']  — pre-separated mat: 1 half-tile + 4 quarter-tiles (L3)
 *
 * Tap-mastery contract:
 *   - Correct tap (region kind matches the active prompt) → streak increments,
 *     prompt cycles for L3.
 *   - Wrong tap → silent rejection. No streak change, no penalty, no error
 *     signal. The Montessori "control of error in the material" principle:
 *     the absence of the expected response IS the feedback.
 */

export type FractionKind = 'half' | 'quarter';

export function regionCount(fractions: readonly FractionKind[]): number {
  if (fractions.length === 1 && fractions[0] === 'half') return 2;
  if (fractions.length === 1 && fractions[0] === 'quarter') return 4;
  // Mixed layout: 1 half-tile + 4 quarter-tiles.
  return 5;
}

export function regionKind(
  idx: number,
  fractions: readonly FractionKind[],
): FractionKind {
  if (fractions.length === 1) return fractions[0];
  // Mixed: index 0 is the half-tile, 1..4 are the quarter-tiles.
  return idx === 0 ? 'half' : 'quarter';
}

/**
 * Decide which fraction the next prompt asks for.
 *
 * Single-fraction lessons (L1, L2) always prompt the same kind. Mixed lessons
 * alternate strictly from the previous prompt — predictable over a 4-tap run
 * and trivially testable without random injection.
 */
export function pickPromptKind(
  fractions: readonly FractionKind[],
  prev: FractionKind | undefined,
): FractionKind {
  if (fractions.length === 1) return fractions[0];
  if (!prev) return 'half';
  return prev === 'half' ? 'quarter' : 'half';
}

export type TapResult = {
  readonly accepted: boolean;
  readonly nextStreak: number;
};

export function evalTap(
  promptKind: FractionKind,
  tappedKind: FractionKind,
  prevStreak: number,
): TapResult {
  if (promptKind === tappedKind) {
    return { accepted: true, nextStreak: prevStreak + 1 };
  }
  return { accepted: false, nextStreak: prevStreak };
}

/**
 * Observational feedback for the kid after a tap. Two tones:
 *
 *  - `success` — they tapped the right kind. We *describe* what they got
 *    ("one half") rather than praise ("nice job!"). The visible label is
 *    the math, not the validation.
 *  - `observation` — they tapped a different kind than the prompt asked
 *    for. We *name* what they tapped and re-issue the prompt softly
 *    ("that's a quarter — find the half"). No "wrong", no "try again".
 *
 * Single-kind layouts (L1 halves-only, L2 quarters-only) can never
 * mis-tap, so callers only get a `success` message back.
 */
export type FeedbackTone = 'success' | 'observation';
export type Feedback = { readonly tone: FeedbackTone; readonly text: string };

function indef(kind: FractionKind): string {
  return kind === 'half' ? 'a half' : 'a quarter';
}

export function feedbackMessage(
  promptKind: FractionKind,
  tappedKind: FractionKind,
): Feedback {
  if (promptKind === tappedKind) {
    return { tone: 'success', text: `yes — that's ${indef(tappedKind)}.` };
  }
  return {
    tone: 'observation',
    text: `that's ${indef(tappedKind)} — find the ${promptKind}.`,
  };
}
