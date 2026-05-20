export type LessonTrailProps = {
  /** True once every beat is done — lights the path + raises the flag. */
  readonly allDone: boolean;
};

const W = 40;
const H = 150;

/** A short winding (sine) descent so the path reads as a curly trail. */
function buildPath(): string {
  const cx = W / 2;
  const amp = 13;
  const cycles = 1.5; // ends back at center-bottom (sin(3π) = 0)
  const steps = 50;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const x = (cx + amp * Math.sin(f * cycles * Math.PI * 2)).toFixed(2);
    const y = (f * H).toFixed(1);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return d;
}

/**
 * A short curly, broken (dotted) trail rendered in normal flow directly
 * after the last card, ending in a small flag — the lesson's
 * destination. Lights green and raises the flag once every beat is done
 * ("you got here").
 *
 * Placed in the flow (not absolutely positioned) so it always hugs the
 * last card instead of guessing a percentage down the page. Purely
 * decorative: `pointer-events: none`.
 */
export function LessonTrail({ allDone }: LessonTrailProps): React.ReactElement {
  return (
    <div className={`lesson-trail${allDone ? ' is-done' : ''}`} aria-hidden>
      <svg
        className="lesson-trail-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        width={W}
        height={H}
      >
        <path
          className="lesson-trail-path"
          d={buildPath()}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="lesson-trail-flag">
        <span className="lesson-trail-flag-pole" />
        <span className="lesson-trail-flag-cloth" />
        <span className="lesson-trail-flag-pin" />
      </div>
    </div>
  );
}
