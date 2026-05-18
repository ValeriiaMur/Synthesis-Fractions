'use client';

import { IconPause } from './IconPause';
import { IconSound } from './IconSound';

export type ProgressSegmentStatus = 'idle' | 'active' | 'done';

export type TopBarProps = {
  readonly progress: readonly ProgressSegmentStatus[];
  readonly onPause?: () => void;
  readonly onToggleSound?: () => void;
};

/**
 * 64px-tall header — pause icon + lesson tag on the left; segmented progress
 * + sound icon on the right.
 */
export function TopBar({ progress, onPause, onToggleSound }: TopBarProps) {
  return (
    <div className="topbar">
      <div className="topbar-side">
        <button
          type="button"
          className="icon-btn"
          title="Pause"
          aria-label="Pause"
          onClick={onPause}
        >
          <IconPause />
        </button>
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
          title="Sound"
          aria-label="Toggle sound"
          onClick={onToggleSound}
        >
          <IconSound />
        </button>
      </div>
    </div>
  );
}
