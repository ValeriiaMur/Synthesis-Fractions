import type { ReactNode } from 'react';
import { Planet } from './Planet';
import { Satellite } from './Satellite';
import { Telescope } from './Telescope';
import { UFO } from './UFO';
import { Rocket } from './Rocket';
import { Comet } from './Comet';
import { Atom } from './Atom';
import { Star } from './Star';
import { Moon } from './Moon';

/**
 * Two layers of transform per doodle so the two motions can transition
 * independently:
 *   - outer `[data-parallax]` carries the scroll-driven drift (no transition)
 *   - inner `[data-slide-drift]` carries the per-slide nudge that springs
 *     when the active principle changes (700ms cubic-bezier transition)
 */
function Drift({
  parallax,
  driftIdx,
  children,
}: {
  readonly parallax: number;
  readonly driftIdx: number;
  readonly children: ReactNode;
}) {
  return (
    <span data-parallax={parallax.toFixed(2)}>
      <span data-slide-drift={String(driftIdx)}>{children}</span>
    </span>
  );
}

/**
 * Scattered hand-drawn space doodles across the viewport. Outer spans
 * parallax with scroll; inner spans nudge a few pixels each time the
 * active principle changes.
 */
export function Doodles() {
  return (
    <div className="doodles" aria-hidden>
      <Drift parallax={0.3} driftIdx={0}>
        <Planet x="6%" y="9%" size={72} color="#b69bff" rotate={-6} />
      </Drift>
      <Drift parallax={0.18} driftIdx={1}>
        <Satellite x="88%" y="6%" size={68} color="#ffb079" rotate={12} />
      </Drift>
      <Drift parallax={0.42} driftIdx={2}>
        <Star x="58%" y="14%" size={28} color="#ffd86b" opacity={0.6} />
      </Drift>
      <Drift parallax={0.55} driftIdx={3}>
        <Comet
          x="48%"
          y="22%"
          size={56}
          color="#ff9ed1"
          rotate={-18}
          opacity={0.7}
        />
      </Drift>
      <Drift parallax={0.25} driftIdx={4}>
        <Telescope x="3%" y="78%" size={76} color="#ff9ed1" rotate={4} />
      </Drift>
      <Drift parallax={0.35} driftIdx={5}>
        <UFO x="90%" y="74%" size={70} color="#ffd86b" rotate={-6} />
      </Drift>
      <Drift parallax={0.48} driftIdx={6}>
        <Atom x="48%" y="83%" size={60} color="#5fd897" opacity={0.55} />
      </Drift>
      <Drift parallax={0.65} driftIdx={7}>
        <Rocket
          x="86%"
          y="40%"
          size={56}
          color="#5b8cff"
          rotate={18}
          opacity={0.6}
        />
      </Drift>
      <Drift parallax={0.22} driftIdx={8}>
        <Moon x="4%" y="42%" size={52} color="#ffd86b" opacity={0.5} />
      </Drift>
      <Drift parallax={0.4} driftIdx={9}>
        <Star x="22%" y="60%" size={22} color="#ff9ed1" opacity={0.5} />
      </Drift>
      <Drift parallax={0.3} driftIdx={10}>
        <Star x="74%" y="55%" size={20} color="#b69bff" opacity={0.6} />
      </Drift>
      <Drift parallax={0.5} driftIdx={11}>
        <Star x="32%" y="36%" size={18} color="#5fd897" opacity={0.45} />
      </Drift>
    </div>
  );
}
