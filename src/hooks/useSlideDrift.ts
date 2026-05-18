'use client';

import { useEffect } from 'react';
import { slideDriftOffset } from '@/lib/onepager/slideDrift';

/**
 * Applies a small deterministic translate to every `[data-slide-drift]`
 * element whenever `activeIdx` changes. Combined with `useParallaxDoodles`
 * (which acts on the OUTER `[data-parallax]` wrapper), this produces a
 * subtle per-slide shift on top of the continuous parallax — so doodles
 * feel like they "nudge" as the scrollytelling advances to each new
 * principle, while still drifting smoothly while you scroll within a slide.
 *
 * Respects `prefers-reduced-motion: reduce` and short-circuits.
 */
export function useSlideDrift(activeIdx: number): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reduce = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    )?.matches;

    const nodes = document.querySelectorAll<HTMLElement>(
      '[data-slide-drift]',
    );
    nodes.forEach((el) => {
      const i = Number.parseInt(el.dataset.slideDrift ?? '0', 10);
      if (reduce) {
        el.style.transform = 'translate3d(0, 0, 0)';
        return;
      }
      const { dx, dy } = slideDriftOffset(
        Number.isFinite(i) ? i : 0,
        activeIdx,
      );
      el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
    });
  }, [activeIdx]);
}
