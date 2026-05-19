import { useMemo, type CSSProperties } from 'react';

export type StarsProps = {
  readonly count?: number;
};

function seededRandom(seed: number): () => number {
  let x = seed;
  return () => {
    x = (x * 9301 + 49297) % 233280;
    return x / 233280;
  };
}

type StarDot = {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly o: number;
  readonly s: number;
  /** Twinkle cycle duration in seconds. */
  readonly dur: number;
  /** Twinkle phase offset in seconds — staggers stars so they don't pulse together. */
  readonly delay: number;
};

/** CSS-vars-on-an-SVG-circle aren't part of the typed CSSProperties, so we
 *  extend the type rather than fight it. */
type CssVars = CSSProperties & {
  readonly ['--o']?: string | number;
  readonly ['--dur']?: string;
};

/**
 * Deterministic star field rendered as SVG dots.
 * Same seed → same field, so SSR matches client. Each star has its own
 * twinkle cycle duration (3–7s) and phase offset (0–5s) so the field
 * shimmers visibly without any two stars pulsing in lockstep. The base
 * opacity is exposed as `--o`; globals.css drives the keyframe — a
 * 35 %→110 % opacity swing paired with a small scale pop.
 */
export function Stars({ count = 80 }: StarsProps) {
  const dots = useMemo<readonly StarDot[]>(() => {
    const r = seededRandom(7);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: r() * 100,
      y: r() * 100,
      o: 0.2 + r() * 0.6,
      s: 0.4 + r() * 1.2,
      dur: 3 + r() * 4,
      delay: r() * 5,
    }));
  }, [count]);

  return (
    <svg
      className="stars-layer"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {dots.map((d) => {
        const style: CssVars = {
          '--o': d.o.toFixed(3),
          '--dur': `${d.dur.toFixed(2)}s`,
          animationDelay: `${d.delay.toFixed(2)}s`,
        };
        return (
          <circle
            key={d.id}
            className="star-dot"
            cx={d.x}
            cy={d.y}
            r={d.s * 0.08}
            fill="#cdd6ff"
            style={style}
          />
        );
      })}
    </svg>
  );
}
