'use client';

import { useEffect, useRef, useState } from 'react';
import type { NamingConfig, NamingState } from '@/lib/lesson/types';
import {
  evalTap,
  feedbackMessage,
  pickPromptKind,
  regionCount,
  regionKind,
  type Feedback,
} from '@/lib/lesson/namingLogic';
import { ChocolatePiece } from '@/components/manipulatives/ChocolatePiece';
import { getSfxPlayer } from '@/lib/audio/sfxPlayer';
import { useSpokenFeedback } from '@/lib/lesson/useSpokenFeedback';

/** Unit-based sizes — matches the home tray demo and the WholeMaterial:
 *  one quarter = one UNIT_PX square, one half = TWO units (a 2×1 slab made
 *  of two seamless quarter-images, mirroring how the WholeMaterial builds
 *  its halves). The unit stays constant across every beat so "half = 2
 *  quarters" is a visible fact, not just a label. */
const UNIT_PX = 80;
const QUARTER_PX = UNIT_PX;    // 80×80

/** How long an observational feedback line stays before fading. Long enough
 *  to read once; short enough not to overlap the next tap. */
const FEEDBACK_MS = 1600;

/** Idle delay before the soft hint appears under the bar. Tuned to "kid
 *  paused, not looking — give them a nudge" not "spam every second". */
const IDLE_HINT_MS = 4000;

export type NamingMaterialProps = {
  readonly config: NamingConfig;
  readonly value: NamingState | undefined;
  readonly onChange: (state: NamingState) => void;
  readonly disabled?: boolean;
};

/**
 * Tap-mastery material for Lessons 1–3.
 *
 *   L1 ['half']            — chocolate bar, 2 regions
 *   L2 ['quarter']         — chocolate bar, 4 regions
 *   L3 ['half','quarter']  — 1 half-tile + 4 quarter-tiles, prompt label cycles
 *
 * Feedback shape:
 *   - Correct tap: chocolate lifts (250ms) AND an observational line
 *     appears under the bar ("yes — that's a half"). The line fades.
 *   - Wrong tap (L3 only): nothing animates, but an observational line
 *     appears ("that's a quarter — find the half"). Streak is unchanged
 *     per Montessori control-of-error.
 *   - Idle: after IDLE_HINT_MS of no taps, a faint hint line appears.
 */
export function NamingMaterial({
  config,
  value,
  onChange,
  disabled = false,
}: NamingMaterialProps) {
  const fractions = config.fractions;
  const count = regionCount(fractions);
  const mixed = fractions.length > 1;

  const [liftedIdx, setLiftedIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [idle, setIdle] = useState(false);
  const liftTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (liftTimerRef.current !== null) window.clearTimeout(liftTimerRef.current);
      if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    },
    [],
  );

  /** (Re)arm the idle-hint timer. Called after every tap. State (`idle`)
   *  starts false on mount, so we only need to clear-and-reset state here
   *  — the mount-time arming is a pure ref write (see effect below) and
   *  doesn't touch state, which would otherwise trip
   *  react-hooks/set-state-in-effect. */
  const armIdle = (): void => {
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    setIdle(false);
    idleTimerRef.current = window.setTimeout(() => setIdle(true), IDLE_HINT_MS);
  };
  /* Mount-time idle timer — no setState in the effect body so the React
   *  Compiler/eslint rule stays happy. The timer fires once after
   *  IDLE_HINT_MS and flips `idle` true via setIdle inside the timeout
   *  (a deferred state change is fine). */
  useEffect(() => {
    idleTimerRef.current = window.setTimeout(() => setIdle(true), IDLE_HINT_MS);
  }, []);

  const speakFeedback = useSpokenFeedback();

  const tappedIndices = value?.tapped ?? [];
  const tappedSet = new Set(tappedIndices);
  const promptKind = pickPromptKind(fractions, tappedIndices);

  const handleTap = (idx: number): void => {
    if (disabled) return;
    getSfxPlayer().play('chocolateSnap');
    const tappedKind = regionKind(idx, fractions);
    const result = evalTap(promptKind, tappedKind, idx, tappedIndices);

    // Always show feedback — both for correct AND rejected taps. Wrong
    // kind = observation. Repeat tap of an already-tapped piece doesn't
    // change state (the kid already mastered that piece).
    const fb = feedbackMessage(promptKind, tappedKind);
    setFeedback(fb);
    // Speak the observation too (throttled, enqueued after any prose).
    speakFeedback(fb.text);
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, FEEDBACK_MS);

    armIdle();

    if (!result.accepted) return;

    if (liftTimerRef.current !== null) window.clearTimeout(liftTimerRef.current);
    setLiftedIdx(idx);
    liftTimerRef.current = window.setTimeout(() => {
      setLiftedIdx(null);
      liftTimerRef.current = null;
    }, 280);

    onChange({ kind: 'naming', tapped: result.nextTapped });
  };

  const layout = mixed ? 'mixed' : fractions[0];
  const idleHint = (() => {
    if (!idle || feedback) return null;
    if (tappedIndices.length > 0) return null; // they've engaged — don't nag.
    if (mixed) return `find a ${promptKind} and tap it.`;
    return `tap each ${fractions[0]} on the bar.`;
  })();

  return (
    <div className="naming-material" data-layout={layout}>
      {mixed && (
        <div className="naming-prompt" aria-live="polite">
          tap the <strong>{promptKind === 'half' ? 'half' : 'quarter'}</strong>
        </div>
      )}
      <div className={`naming-bar naming-bar--${layout}`} aria-label="chocolate bar">
        {Array.from({ length: count }).map((_, i) => {
          const kind = regionKind(i, fractions);
          const lifted = liftedIdx === i;
          const alreadyTapped = tappedSet.has(i);
          return (
            <button
              key={i}
              type="button"
              className={`naming-piece naming-piece--${kind}${lifted ? ' is-lifted' : ''}${alreadyTapped ? ' is-tapped' : ''}`}
              data-kind={kind}
              data-lifted={lifted || undefined}
              data-tapped={alreadyTapped || undefined}
              onClick={() => handleTap(i)}
              disabled={disabled}
              aria-label={`${kind} piece${alreadyTapped ? ' (tapped)' : ''}`}
            >
              {kind === 'half' ? (
                // A half is literally two quarter-units glued together,
                // wrapped in a slab container that carries the rounded
                // corners + drop-shadow (the inner pieces are seamless).
                // The "1⁄2" overlay names the symbol on top of the slab.
                <span className="naming-half-slab">
                  <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" seamless />
                  <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" seamless />
                  <span className="stacked-frac naming-piece-frac" aria-hidden>
                    <span className="stacked-frac-top">1</span>
                    <span className="stacked-frac-bot">2</span>
                  </span>
                </span>
              ) : (
                <span className="naming-quarter-tile">
                  <ChocolatePiece
                    size={QUARTER_PX}
                    width={QUARTER_PX}
                    placed={lifted}
                    alt=""
                  />
                  <span className="stacked-frac naming-piece-frac" aria-hidden>
                    <span className="stacked-frac-top">1</span>
                    <span className="stacked-frac-bot">4</span>
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div
        className={`naming-feedback${feedback ? ` is-${feedback.tone}` : ''}${
          idleHint && !feedback ? ' is-hint' : ''
        }`}
        role="status"
        aria-live="polite"
        data-testid="naming-feedback"
      >
        {feedback?.text ?? idleHint ?? ''}
      </div>
    </div>
  );
}
