'use client';

import { useScrollProgress } from '@/lib/lesson/useScrollProgress';

/**
 * Fixed 2px-tall progress bar pinned to the top of the page. Width tracks
 * the page's scroll position.
 */
export function ScrollProgress() {
  const pct = useScrollProgress();
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 50,
        pointerEvents: 'none',
      }}
      aria-hidden
    >
      <div
        style={{
          height: '100%',
          width: '100%',
          background: 'linear-gradient(90deg, var(--blue), var(--green))',
          boxShadow: '0 0 12px rgba(91,140,255,0.7)',
          transform: `scaleX(${pct})`,
          transformOrigin: 'left center',
          transition: 'transform .2s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
