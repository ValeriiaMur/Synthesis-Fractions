'use client';

import type { ReactNode, RefObject } from 'react';
import type { BeatStatus } from '@/lib/lesson/types';

export type CellStatus = Extract<BeatStatus, 'locked' | 'active' | 'done'>;

export type CellProps = {
  /** 1-based cell index — rendered in the gutter. */
  readonly index: number;
  /** Caps text such as "P1 · introduce". */
  readonly phaseLabel: string;
  readonly status: CellStatus;
  /** Caps text shown inside the body, e.g. "manipulative — chocolate bar". */
  readonly kind: string;
  readonly anchorRef?: RefObject<HTMLDivElement | null>;
  readonly children: ReactNode;
};

/**
 * Single notebook cell — gutter on the left (cell number + phase), card on
 * the right (cell-kind header + content). Status drives the border color and
 * the gutter number color (blue for active, green for done).
 */
export function Cell({
  index,
  phaseLabel,
  status,
  kind,
  anchorRef,
  children,
}: CellProps) {
  const padded = String(index).padStart(2, '0');
  return (
    <div
      ref={anchorRef}
      className={`cell ${status}`}
      data-screen-label={`${padded} ${kind}`}
    >
      <div className="cell-gutter">
        <span className="num">{padded}</span>
        <span className="phase">{phaseLabel}</span>
      </div>
      <div className="cell-body">
        <div className="cell-kind">
          <span className="label">{kind}</span>
          <span className="sep" />
          {status === 'done' && (
            <span style={{ color: 'var(--green)' }}>done ✓</span>
          )}
          {status === 'active' && (
            <span style={{ color: 'var(--blue)' }}>active</span>
          )}
          {status === 'locked' && <span>locked</span>}
        </div>
        {children}
      </div>
    </div>
  );
}
