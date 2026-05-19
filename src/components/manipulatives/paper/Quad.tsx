import { PaperStars } from './PaperStars';

export type QuadPos = 'tl' | 'tr' | 'bl' | 'br';

export type QuadProps = {
  readonly pos: QuadPos;
  readonly transform: string;
  readonly dragging: boolean;
};

/** Distinct seeds per quadrant so each one has its own star pattern. */
const QUAD_SEED: Record<QuadPos, number> = {
  tl: 31,
  tr: 47,
  bl: 53,
  br: 61,
};

/**
 * One 50% × 50% quadrant of the paper. The front face is the visible
 * cream paper; the pre-rotated `.paper-quad-back` div shows the
 * slightly darker underside when the quadrant flips past 90°
 * (backface-visibility hides whichever face isn't toward the viewer).
 *
 * `dragging` toggles the CSS transition off so the per-frame transform
 * updates during pointer drag stay locked to the cursor.
 */
export function Quad({ pos, transform, dragging }: QuadProps) {
  return (
    <div
      className={`paper-quad ${pos}${dragging ? ' is-dragging' : ''}`}
      style={{ transform }}
    >
      <div className="paper-quad-back" />
      <PaperStars count={5} seed={QUAD_SEED[pos]} />
    </div>
  );
}
