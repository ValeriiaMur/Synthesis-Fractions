'use client';

import { hexA } from '@/lib/onepager/hexA';

export type AmbientGlowProps = {
  /** Active principle's accent color (hex or `var(--name)`), or null when
   *  no principle is centered. */
  readonly color: string | null;
};

/**
 * Fixed full-viewport tinted glow that softly lifts the cosmos backdrop
 * with the currently-centered principle's color. `mix-blend-mode: screen`
 * so it lightens instead of overlaying; crossfades 1.2s when the active
 * principle changes.
 */
export function AmbientGlow({ color }: AmbientGlowProps) {
  const bg = color
    ? `radial-gradient(900px 700px at 50% 60%, ${hexA(color, 0.18)}, transparent 65%),
       radial-gradient(700px 500px at 80% 20%, ${hexA(color, 0.10)}, transparent 70%)`
    : 'none';

  return (
    <div
      aria-hidden
      data-testid="ambient-glow"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        backgroundImage: bg,
        opacity: color ? 1 : 0,
        transition: 'background-image 1.2s ease, opacity 1.2s ease',
        mixBlendMode: 'screen',
      }}
    />
  );
}
