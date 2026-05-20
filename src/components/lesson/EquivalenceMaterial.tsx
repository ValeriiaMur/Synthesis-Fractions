'use client';

import type { EquivalenceConfig, EquivalenceState } from '@/lib/lesson/types';
import { coverStatusText, isCovered, placeQuarter } from '@/lib/lesson/coverLogic';
import { ChocolatePiece } from '@/components/manipulatives/ChocolatePiece';

const QUARTER_PX = 96;

export type EquivalenceMaterialProps = {
  readonly config: EquivalenceConfig;
  readonly value: EquivalenceState | undefined;
  readonly onChange: (state: EquivalenceState) => void;
  readonly disabled?: boolean;
};

/** How many quarter-tiles are visible in the pile to start with. Only two
 *  ever stick to the half; the rest are visual decoy ("there are more in
 *  the pile") and become disabled once the half is covered. */
const PILE_INITIAL = 4;

/**
 * L4 chocolate tap-to-cover. The kid sees one half-piece on the mat and a
 * pile of quarter-tiles on the right. Tap a quarter → it slides onto the
 * next empty slot on the half. Two placed → half glows (data-covered=true).
 * Extra taps after coverage are silently rejected by `coverLogic.placeQuarter`.
 *
 * An observational status line below the mat names the current
 * configuration ("one quarter on the half — one more to cover it") at
 * each step. No drag, no snap zones — the kid has been tapping chocolate
 * since Lesson 1.
 *
 * Voice is intentionally NOT triggered from inside this component. When the
 * beat completes, the state machine advances to L5 and speaks L5's prose —
 * one voice event, not two.
 */
export function EquivalenceMaterial({
  config,
  value,
  onChange,
  disabled = false,
}: EquivalenceMaterialProps) {
  const placed = value?.placedCount ?? 0;
  const covered = isCovered({ placedCount: placed }, config.targetCount);
  const pileRemaining = Math.max(0, PILE_INITIAL - placed);
  const status = coverStatusText({ placedCount: placed }, config.targetCount);

  const handleTap = (): void => {
    if (disabled) return;
    const result = placeQuarter({ placedCount: placed }, config.targetCount);
    if (!result.accepted) return;
    onChange({ kind: 'equivalence', placedCount: result.newState.placedCount });
  };

  return (
    <div className="equivalence-stage">
      <div className="equivalence-material" data-covered={covered || undefined}>
        <div
          className="equivalence-half"
          aria-label="one half"
          data-covered={covered || undefined}
        >
          <div
            className="equivalence-slot"
            data-testid="equivalence-slot"
            data-filled={placed >= 1 || undefined}
          >
            {placed >= 1 && (
              <ChocolatePiece size={QUARTER_PX} width={QUARTER_PX} alt="" />
            )}
          </div>
          <div
            className="equivalence-slot"
            data-testid="equivalence-slot"
            data-filled={placed >= 2 || undefined}
          >
            {placed >= 2 && (
              <ChocolatePiece size={QUARTER_PX} width={QUARTER_PX} alt="" />
            )}
          </div>
        </div>
        <div className="equivalence-pile" aria-label="pile of quarters">
          {Array.from({ length: pileRemaining }).map((_, i) => (
            <button
              key={i}
              type="button"
              className="equivalence-quarter"
              aria-label="place quarter on the half"
              onClick={handleTap}
              disabled={disabled || covered}
            >
              <ChocolatePiece size={QUARTER_PX} width={QUARTER_PX} alt="" />
            </button>
          ))}
        </div>
      </div>
      <div
        className={`equivalence-status${covered ? ' is-covered' : ''}`}
        role="status"
        aria-live="polite"
        data-testid="equivalence-status"
      >
        {status}
      </div>
    </div>
  );
}
