'use client';

import { useEffect } from 'react';

/**
 * Global parallax for every `[data-parallax]` element on the page. One rAF
 * coalesces scroll events so doodles + ghost numerals + ambient glow all
 * share a single paint frame.
 *
 * Each element's `data-parallax` attribute is a factor (e.g. "0.30"); the
 * applied translate is `-scrollY * factor * 0.25`. The 0.25 damping keeps
 * the doodles a gentle drift rather than a sudden fly-by — matches the
 * scrollytelling handoff.
 *
 * Respects `prefers-reduced-motion: reduce` and short-circuits the listener.
 */
export function useParallaxDoodles(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reduce = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    )?.matches;
    if (reduce) return;

    let raf: number | null = null;

    const apply = (): void => {
      raf = null;
      const y = window.scrollY;
      const nodes =
        document.querySelectorAll<HTMLElement>('[data-parallax]');
      nodes.forEach((el) => {
        const f = Number.parseFloat(el.dataset.parallax ?? '0');
        if (!Number.isFinite(f) || f === 0) return;
        el.style.transform = `translate3d(0, ${(-y * f * 0.25).toFixed(1)}px, 0)`;
      });
    };

    const onScroll = (): void => {
      if (raf == null) raf = window.requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf != null) window.cancelAnimationFrame(raf);
    };
  }, []);
}
