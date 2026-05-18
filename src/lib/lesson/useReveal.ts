'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * IntersectionObserver-driven scroll reveal with a mount-visible fast path and
 * a 1.5s fallback so static captures aren't blank.
 * Returns [ref, shown].
 */
export function useReveal(): readonly [
  React.RefObject<HTMLDivElement | null>,
  boolean,
] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 1.1) {
      setShown(true);
    }
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    const fallback = window.setTimeout(() => setShown(true), 1500);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return [ref, shown] as const;
}
