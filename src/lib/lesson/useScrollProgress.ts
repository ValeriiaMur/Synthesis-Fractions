'use client';

import { useEffect, useState } from 'react';

/**
 * Listens to window scroll and returns a 0..1 progress through the page.
 * Used by the top-of-page progress bar on the one-pager.
 */
export function useScrollProgress(): number {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return pct;
}
