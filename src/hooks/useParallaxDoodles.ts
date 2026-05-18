'use client';

import { useEffect } from 'react';

/**
 * On scroll, applies `translate3d(0, scrollY * factor * -1, 0)` to every
 * `[data-parallax]` child of `.doodles`. Factor is the value of the
 * `data-parallax` attribute (e.g. "0.30"). Passive listener for scroll perf.
 */
export function useParallaxDoodles(): void {
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>(
      '.doodles [data-parallax]',
    );
    if (nodes.length === 0) return;

    const onScroll = () => {
      const y = window.scrollY;
      nodes.forEach((n) => {
        const factor = parseFloat(n.dataset.parallax ?? '0');
        if (Number.isFinite(factor) && factor !== 0) {
          n.style.transform = `translate3d(0, ${(-y * factor).toFixed(2)}px, 0)`;
        }
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}
