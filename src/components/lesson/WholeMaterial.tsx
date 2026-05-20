'use client';

import type { WholeState } from '@/lib/lesson/types';
import { ChocolatePiece } from '@/components/manipulatives/ChocolatePiece';

/** One quarter-square in CSS pixels. The intro bar is built from 4 of these
 *  laid out with NO gap so the kid reads them as one continuous whole. When
 *  the bar splits, the middle gap opens by SPLIT_GAP_PX, making it visible
 *  that one whole is now two halves of 2 quarters each. */
const UNIT_PX = 80;
const SPLIT_GAP_PX = 28;

export type WholeMaterialProps = {
  readonly value?: WholeState;
  readonly onChange: (state: WholeState) => void;
  readonly disabled?: boolean;
};

/**
 * Beat 0 — "this is one whole. tap to split it in half."
 *
 * Visual model is unit-based and matches the home tray:
 *   - one whole = 4 quarter-squares laid out with NO gap (reads as one bar)
 *   - after the tap, the middle gap opens, making two pairs of 2 squares
 *     each — i.e., two halves
 *
 * The kid sees the equivalence physically: one whole is the same chocolate
 * as two halves stuck together. Tap = split. No drag, no choice — the
 * action IS the introduction. Streak / mastery doesn't apply here; one
 * confirmed split completes the beat and the lesson moves on to naming
 * the half.
 */
export function WholeMaterial({
  value,
  onChange,
  disabled = false,
}: WholeMaterialProps) {
  const split = value?.split ?? false;

  const handleTap = (): void => {
    if (disabled) return;
    if (split) return; // idempotent — extra taps are no-ops
    onChange({ kind: 'whole', split: true });
  };

  const status = split
    ? 'yes — one whole, split into two halves. each half is two quarters.'
    : 'this is one whole. tap to split it in half.';

  return (
    <div className="whole-stage">
      <button
        type="button"
        className={`whole-bar${split ? ' is-split' : ''}`}
        aria-label="split the whole bar in half"
        onClick={handleTap}
        disabled={disabled}
      >
        {/* Two half-slabs, each made of 2 quarter-units stuck together. Before
            the split they sit flush (gap: 0) so the four squares read as one
            continuous whole. After the split, an inline gap opens between
            them. */}
        <span className="whole-half">
          <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" />
          <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" />
        </span>
        <span
          className="whole-gap"
          aria-hidden
          style={{ width: split ? SPLIT_GAP_PX : 0 }}
        />
        <span className="whole-half">
          <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" />
          <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" />
        </span>
      </button>
      <div
        className={`whole-status${split ? ' is-success' : ''}`}
        role="status"
        aria-live="polite"
        data-testid="whole-status"
      >
        {status}
      </div>
    </div>
  );
}
