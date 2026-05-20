'use client';

import type { RecallConfig, RecallState } from '@/lib/lesson/types';
import { ChocolatePiece } from '@/components/manipulatives/ChocolatePiece';
import { useSpokenFeedback } from '@/lib/lesson/useSpokenFeedback';

const UNIT_PX = 80;

export type RecallMaterialProps = {
  readonly config: RecallConfig;
  readonly value: RecallState | undefined;
  readonly onChange: (state: RecallState) => void;
  readonly disabled?: boolean;
};

/**
 * Period-3 recall ("what is this?"). The canonical Montessori third
 * period: the child is shown one piece and *names it aloud*. There's no
 * speech capture — the saying is the recall. Tapping "show me" reveals
 * the tutor's confirmation: the symbol fades onto the piece, the piece
 * lifts, and the voice names it back ("yes — that's a half"). The reveal
 * completes the beat.
 *
 * Self-paced (Montessori): nothing is on a timer; the child reveals when
 * they're ready. The beat's prose ("What is this? Say it out loud — then
 * show me.") is spoken on entry by the lesson's voice channel, so this
 * component only handles the reveal.
 */
export function RecallMaterial({
  config,
  value,
  onChange,
  disabled = false,
}: RecallMaterialProps) {
  const revealed = value?.revealed ?? false;
  const speakFeedback = useSpokenFeedback();

  const isHalf = config.fraction === 'half';
  const name = isHalf ? 'a half' : 'a quarter';
  const denominator = isHalf ? '2' : '4';

  const reveal = (): void => {
    if (disabled || revealed) return;
    speakFeedback(`yes — that's ${name}.`);
    onChange({ kind: 'recall', revealed: true });
  };

  const frac = (
    <span className="stacked-frac naming-piece-frac" aria-hidden>
      <span className="stacked-frac-top">1</span>
      <span className="stacked-frac-bot">{denominator}</span>
    </span>
  );

  return (
    <div className="recall-stage">
      <div className="recall-prompt">what is this?</div>

      <div className={`recall-piece${revealed ? ' is-revealed' : ''}`}>
        {isHalf ? (
          <span className="naming-half-slab">
            <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" seamless />
            <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" seamless />
            {revealed && frac}
          </span>
        ) : (
          <span className="naming-quarter-tile">
            <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" />
            {revealed && frac}
          </span>
        )}
      </div>

      {!revealed ? (
        <button
          type="button"
          className="recall-btn"
          onClick={reveal}
          disabled={disabled}
        >
          show me
        </button>
      ) : (
        <div
          className="recall-answer"
          role="status"
          aria-live="polite"
          data-testid="recall-answer"
        >
          yes — that&rsquo;s {name}.
        </div>
      )}
    </div>
  );
}
