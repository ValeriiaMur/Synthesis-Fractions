'use client';

import { useEffect, useState } from 'react';

export type ActivePrincipleInput = {
  readonly num: string;
  readonly color: string;
};

export type ActivePrinciple = {
  /** Index into the principles list, or -1 when no principle is centered. */
  readonly idx: number;
  /** Color of the currently-centered principle, or null. */
  readonly color: string | null;
};

const INITIAL: ActivePrinciple = { idx: -1, color: null };

/**
 * Tracks which principle section currently contains viewport center. Used by
 * AmbientGlow to tint the backdrop with the active accent. rAF-throttled
 * scroll listener; only re-renders when the *index* changes.
 */
export function useActivePrinciple(
  principles: readonly ActivePrincipleInput[],
): ActivePrinciple {
  const [active, setActive] = useState<ActivePrinciple>(INITIAL);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let raf: number | null = null;
    const ids = principles.map((p) => `p-${p.num}`);

    const apply = (): void => {
      raf = null;
      const y = window.scrollY + window.innerHeight * 0.5;
      let i = -1;
      for (let j = 0; j < ids.length; j++) {
        const el = document.getElementById(ids[j]);
        if (!el) continue;
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (top <= y && y < bottom) {
          i = j;
        }
      }
      const next: ActivePrinciple =
        i >= 0
          ? { idx: i, color: principles[i].color }
          : { idx: -1, color: null };
      setActive((prev) => (prev.idx === next.idx ? prev : next));
    };

    const onScroll = (): void => {
      if (raf == null) raf = window.requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf != null) window.cancelAnimationFrame(raf);
    };
  }, [principles]);

  return active;
}
