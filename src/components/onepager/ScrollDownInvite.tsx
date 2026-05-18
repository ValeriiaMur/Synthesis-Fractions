'use client';

import type { CSSProperties } from 'react';

export type ScrollDownInviteProps = {
  /** Hash href to anchor-jump to. Defaults to `#principles`. */
  readonly href?: string;
  readonly label?: string;
};

/**
 * Subtle scroll-down affordance pinned near the bottom of the hero. A small
 * caps label + an animated chevron that drifts down on a 2s ease loop.
 * Anchors to `#principles` so it doubles as a keyboard/click target.
 *
 * Animation respects `prefers-reduced-motion` via the page-wide override.
 */
export function ScrollDownInvite({
  href = '#principles',
  label = 'scroll',
}: ScrollDownInviteProps) {
  return (
    <a
      href={href}
      className="scroll-down"
      aria-label="Scroll down to the eight principles"
    >
      <span className="scroll-down-label">{label}</span>
      <span className="scroll-down-chevron" aria-hidden>
        <Chevron />
      </span>
    </a>
  );
}

const CHEVRON_STYLE: CSSProperties = {
  display: 'block',
};

function Chevron() {
  return (
    <svg
      width="18"
      height="22"
      viewBox="0 0 18 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={CHEVRON_STYLE}
    >
      <path d="M9 3 L9 17" />
      <path d="M3 12 L9 19 L15 12" />
    </svg>
  );
}
