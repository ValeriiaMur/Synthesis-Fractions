'use client';

import Link from 'next/link';
import { IconArrowLeft } from './IconArrowLeft';
import { IconSound } from './IconSound';

export type TopBarProps = {
  readonly onToggleSound?: () => void;
  readonly muted?: boolean;
};

/**
 * 64px-tall header — back-to-home link + lesson tag on the left; mute
 * toggle on the right. No progress segments — Montessori rebuild treats
 * the lesson as mastery-paced, not progress-bar-paced.
 */
export function TopBar({ onToggleSound, muted = false }: TopBarProps) {
  return (
    <div className="topbar">
      <div className="topbar-side">
        <Link
          href="/"
          className="icon-btn"
          title="Back to home"
          aria-label="Back to home"
        >
          <IconArrowLeft />
        </Link>
        <div className="lesson-tag">
          <span className="dot" aria-hidden />
          fractions
        </div>
      </div>
      <div className="topbar-side">
        <button
          type="button"
          className="icon-btn"
          title={muted ? 'Unmute' : 'Mute'}
          aria-label={muted ? 'Unmute' : 'Mute'}
          aria-pressed={muted}
          onClick={onToggleSound}
        >
          <IconSound muted={muted} />
        </button>
      </div>
    </div>
  );
}
