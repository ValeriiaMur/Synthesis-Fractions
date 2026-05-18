import { useMemo } from 'react';

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
};

/**
 * Deterministic star field rendered as SVG dots.
 * Same seed → same field, so SSR matches client.
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
    }));
  }, [count]);

  return (
    <svg
      className="stars-layer"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {dots.map((d) => (
        <circle
          key={d.id}
          cx={d.x}
          cy={d.y}
          r={d.s * 0.08}
          fill="#cdd6ff"
          opacity={d.o}
        />
      ))}
    </svg>
  );
}
