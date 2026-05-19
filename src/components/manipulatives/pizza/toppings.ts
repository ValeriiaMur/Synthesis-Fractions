import { useMemo } from 'react';

/* ----------------------------------------------------------------
   Deterministic per-slice topping placement. Seeded RNG so the
   pepperoni + basil don't dance between renders, and pepperoni are
   placed PER slice (along each slice's midpoint angle) so they
   never get sliced by a wedge boundary. */

export type Pepperoni = {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly rot: number;
};

export type Basil = {
  readonly x: number;
  readonly y: number;
  readonly rot: number;
};

export type CharSpot = {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly dark: boolean;
};

export type CheeseBlob = {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly opacity: number;
};

export type Toppings = {
  readonly pepperoni: readonly Pepperoni[];
  readonly basil: readonly Basil[];
  readonly charSpots: readonly CharSpot[];
  readonly cheeseBlobs: readonly CheeseBlob[];
};

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function useToppings(count: number): Toppings {
  return useMemo<Toppings>(() => {
    const r = seeded(7);
    const angleStep = (Math.PI * 2) / count;
    const baseSize = count >= 10 ? 20 : count >= 6 ? 24 : 28;
    const innerR = 75;
    const outerR = 145;

    const pepperoni: Pepperoni[] = [];
    for (let i = 0; i < count; i++) {
      const mid = -Math.PI / 2 + angleStep * i;
      const jitter = (r() - 0.5) * 6;
      const sizeJitterA = (r() - 0.5) * 3;
      const sizeJitterB = (r() - 0.5) * 3;
      pepperoni.push({
        x: 250 + Math.cos(mid) * innerR + jitter,
        y: 250 + Math.sin(mid) * innerR + jitter,
        size: baseSize + sizeJitterA,
        rot: r() * 360,
      });
      pepperoni.push({
        x: 250 + Math.cos(mid) * outerR + jitter * 0.5,
        y: 250 + Math.sin(mid) * outerR + jitter * 0.5,
        size: baseSize + sizeJitterB,
        rot: r() * 360,
      });
    }

    const basil: Basil[] = [];
    const basilStride = Math.max(2, Math.round(count / 3));
    for (let i = 0; i < count; i += basilStride) {
      const mid = -Math.PI / 2 + angleStep * i + angleStep * 0.18;
      const radius = 100;
      basil.push({
        x: 250 + Math.cos(mid) * radius,
        y: 250 + Math.sin(mid) * radius,
        rot: (mid * 180) / Math.PI + 90 + (r() - 0.5) * 40,
      });
    }

    const charSpots: CharSpot[] = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + r() * 0.3;
      const radius = 200 + r() * 18;
      charSpots.push({
        x: 250 + Math.cos(a) * radius,
        y: 250 + Math.sin(a) * radius,
        size: 2 + r() * 5,
        dark: r() > 0.4,
      });
    }

    const cheeseBlobs: CheeseBlob[] = [];
    for (let i = 0; i < 16; i++) {
      const a = r() * Math.PI * 2;
      const radius = r() * 130 + 10;
      cheeseBlobs.push({
        x: 250 + Math.cos(a) * radius,
        y: 250 + Math.sin(a) * radius,
        size: 14 + r() * 18,
        opacity: 0.35 + r() * 0.45,
      });
    }

    return { pepperoni, basil, charSpots, cheeseBlobs };
  }, [count]);
}
