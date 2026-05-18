'use client';

import Link from 'next/link';
import { IconArrowLeft } from './IconArrowLeft';
import { IconSound } from './IconSound';

export type ProgressSegmentStatus = 'idle' | 'active' | 'done';

export type TopBarProps = {
  readonly progress: readonly ProgressSegmentStatus[];
  readonly onToggleSound?: () => void;
  readonly muted?: boolean;
};

/**
 * 64px-tall header — back-to-home link + lesson tag on the left; segmented
 * progress + mute toggle on the right. Pause was removed at the user's
 * request — the lesson auto-pauses by virtue of being self-paced (nothing
 * advances on a timer).
 */
export function TopBar({
  progress,
  onToggleSound,
  muted = false,
}: TopBarProps) {
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
          equivalent fractions · ½ = ²⁄₄
        </div>
      </div>
      <div className="topbar-side">
        <div className="progress" aria-label="lesson progress">
          {progress.map((s, i) => (
            <div
              key={i}
              className={`seg${s === 'idle' ? '' : ` ${s}`}`}
            />
          ))}
        </div>
        <button
          type="button"
          className="icon-btn"
          title={muted ? 'Unmute Ari' : 'Mute Ari'}
          aria-label={muted ? 'Unmute Ari' : 'Mute Ari'}
          aria-pressed={muted}
          onClick={onToggleSound}
        >
          <IconSound muted={muted} />
        </button>
      </div>
    </div>
  );
}
