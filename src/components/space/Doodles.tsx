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
 * Scattered hand-drawn space doodles across the viewport.
 * Each is wrapped in `[data-parallax]` so the parallax hook can offset them
 * on scroll.
 */
export function Doodles() {
  return (
    <div className="doodles" aria-hidden>
      <span data-parallax="0.30">
        <Planet x="6%" y="9%" size={72} color="#b69bff" rotate={-6} />
      </span>
      <span data-parallax="0.18">
        <Satellite x="88%" y="6%" size={68} color="#ffb079" rotate={12} />
      </span>
      <span data-parallax="0.42">
        <Star x="58%" y="14%" size={28} color="#ffd86b" opacity={0.6} />
      </span>
      <span data-parallax="0.55">
        <Comet
          x="48%"
          y="22%"
          size={56}
          color="#ff9ed1"
          rotate={-18}
          opacity={0.7}
        />
      </span>
      <span data-parallax="0.25">
        <Telescope x="3%" y="78%" size={76} color="#ff9ed1" rotate={4} />
      </span>
      <span data-parallax="0.35">
        <UFO x="90%" y="74%" size={70} color="#ffd86b" rotate={-6} />
      </span>
      <span data-parallax="0.48">
        <Atom x="48%" y="83%" size={60} color="#5fd897" opacity={0.55} />
      </span>
      <span data-parallax="0.65">
        <Rocket
          x="86%"
          y="40%"
          size={56}
          color="#5b8cff"
          rotate={18}
          opacity={0.6}
        />
      </span>
      <span data-parallax="0.22">
        <Moon x="4%" y="42%" size={52} color="#ffd86b" opacity={0.5} />
      </span>
      <span data-parallax="0.40">
        <Star x="22%" y="60%" size={22} color="#ff9ed1" opacity={0.5} />
      </span>
      <span data-parallax="0.30">
        <Star x="74%" y="55%" size={20} color="#b69bff" opacity={0.6} />
      </span>
      <span data-parallax="0.50">
        <Star x="32%" y="36%" size={18} color="#5fd897" opacity={0.45} />
      </span>
    </div>
  );
}
