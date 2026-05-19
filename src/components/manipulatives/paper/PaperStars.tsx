import { useMemo } from 'react';

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export type PaperStarsProps = {
  /** Number of sparkle dots to render. */
  readonly count: number;
  /** Seed for the placement RNG. Pass distinct seeds per quad so each
   *  quadrant has its own constellation but each one is deterministic. */
  readonly seed?: number;
};

/**
 * Tiny gold sparkles sprinkled inside one quadrant of the star-paper.
 * Placement is seeded so the dots don't dance between renders.
 */
export function PaperStars({ count, seed = 31 }: PaperStarsProps) {
  const dots = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, () => ({
      x: 6 + r() * 88,
      y: 6 + r() * 88,
      size: 2 + r() * 3,
      opacity: 0.4 + r() * 0.4,
    }));
  }, [count, seed]);

  return (
    <>
      {dots.map((d, i) => (
        <span
          key={i}
          className="paper-star"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            opacity: d.opacity,
          }}
        />
      ))}
    </>
  );
}
