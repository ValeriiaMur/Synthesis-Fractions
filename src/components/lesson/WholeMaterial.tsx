'use client';

import type { WholeState } from '@/lib/lesson/types';
import { ChocolatePiece } from '@/components/manipulatives/ChocolatePiece';
import { getSfxPlayer } from '@/lib/audio/sfxPlayer';
import { useSpokenFeedback } from '@/lib/lesson/useSpokenFeedback';

/** One quarter-square in CSS pixels. The intro bar is built from 4 of these
 *  laid out with NO gap so the kid reads them as one continuous whole. When
 *  the bar splits, an inline gap opens between the two halves and the
 *  "1⁄2" labels fade in flanking each half. */
const UNIT_PX = 80;

export type WholeMaterialProps = {
  readonly value?: WholeState;
  readonly onChange: (state: WholeState) => void;
  readonly disabled?: boolean;
};

/** Stacked fraction (numerator over denominator with a horizontal rule).
 *  Shared markup with HeroPreview; styles live in globals.css under
 *  `.stacked-frac`. */
function HalfFrac() {
  return (
    <span
      className="stacked-frac whole-frac"
      aria-hidden
      style={{ fontSize: 22 }}
    >
      <span className="stacked-frac-top">1</span>
      <span className="stacked-frac-bot">2</span>
    </span>
  );
}

/**
 * Beat 0 — "this is one whole. tap to split it in half."
 *
 * Visual model is unit-based and matches the home tray:
 *   - one whole = 4 quarter-squares laid out with NO gap (reads as one bar)
 *   - after the tap, the middle gap opens, making two pairs of 2 squares
 *     each — i.e., two halves
 *
 * Labels frame the bar so the math is visible:
 *   - "1" sits outside the tray on the left (this is one whole = 1)
 *   - When split, three stacked-fraction labels appear inside the tray:
 *     one on the outer-left, one in the middle gap, one on the outer-right.
 *     Each half is flanked on both sides by a "1⁄2" — the visitor sees
 *     half + half = 1.
 *
 * Toggle behaviour: tapping the bar always toggles `split`. The first
 * tap that flips it to true completes the beat and the lesson advances;
 * subsequent taps let the kid snap the chocolate back together and pop
 * it apart again to explore. The state machine never un-marks a done
 * beat, so the toggle is purely exploratory once mastered.
 */
export function WholeMaterial({
  value,
  onChange,
  disabled = false,
}: WholeMaterialProps) {
  const split = value?.split ?? false;
  const speakFeedback = useSpokenFeedback();

  const status = split
    ? 'yes — one whole, split into two halves. each half is two quarters.'
    : 'this is one whole. tap to split it in half.';

  const handleTap = (): void => {
    if (disabled) return;
    const willSplit = !split;
    // Split = the bar cracks apart; snap-back reuses the soft chocolate snap.
    getSfxPlayer().play(willSplit ? 'wholeSplit' : 'chocolateSnap');
    onChange({ kind: 'whole', split: willSplit });
    // Voice the observation only on the split (not the snap-back).
    if (willSplit) {
      speakFeedback('one whole, split into two halves. each half is two quarters.');
    }
  };

  return (
    <div className="whole-stage">
      <div className="whole-row">
        {/* "1" labels the whole bar BEFORE the split — once the kid pops
            it apart, the bar is no longer one whole and the "1" hides.
            Kept mounted with a CSS opacity toggle so the layout stays
            put across the toggle, then visually-hidden via aria-hidden. */}
        <span
          className={`whole-label-big${split ? ' is-hidden' : ''}`}
          aria-hidden
        >
          1
        </span>
        <button
          type="button"
          className={`whole-bar${split ? ' is-split' : ''}`}
          aria-label={
            split
              ? 'snap the two halves back together'
              : 'split the whole bar in half'
          }
          onClick={handleTap}
          disabled={disabled}
        >
          {/* Flex layout: [frac] [half] [half] [frac]. The outer two
              fractions flank the pair of halves so the kid sees
              "1⁄2 + 1⁄2 = (the whole that just split)". The fractions
              collapse to zero width when not split so the four quarters
              read as one continuous chocolate rectangle. */}
          <HalfFrac />
          <span className="whole-half">
            <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" seamless />
            <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" seamless />
          </span>
          <span className="whole-half">
            <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" seamless />
            <ChocolatePiece size={UNIT_PX} width={UNIT_PX} alt="" seamless />
          </span>
          <HalfFrac />
        </button>
      </div>
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
