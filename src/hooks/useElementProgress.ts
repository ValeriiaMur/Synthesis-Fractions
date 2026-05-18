'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * Returns a 0..1 scroll progress through the element's viewport pass:
 *   0  → element's top has just touched the bottom of viewport
 *   1  → element's bottom has just left the top of viewport
 *
 * rAF-throttled. Used to drive section-local scroll animations (the
 * one-pager's ghost numerals) without thrashing layout.
 */
export function useElementProgress(
  ref: RefObject<HTMLElement | null>,
): number {
  const [p, setP] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let raf: number | null = null;

    const apply = (): void => {
      raf = null;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height + vh;
      if (total <= 0) {
        setP(0);
        return;
      }
      const traveled = vh - r.top;
      const next = Math.max(0, Math.min(1, traveled / total));
      setP((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
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
  }, [ref]);

  return p;
}
