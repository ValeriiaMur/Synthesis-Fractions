'use client';

import type { PointerEvent as ReactPointerEvent } from 'react';
import { FracInline } from './FracInline';
import { StudRow } from './StudRow';
import { shade } from './shade';

export type LegoBrickProps = {
  readonly num: number;
  readonly den: number;
  readonly color: string;
  /** Width of the brick as a percent of its parent. */
  readonly widthPct: number;
  readonly dataBarId: string;
  /** Optional — when omitted (the dnd-kit path in BlockStudio) the brick is
   *  purely visual and its parent wrapper owns drag activation. */
  readonly onPointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  readonly disabled?: boolean;
  readonly animateIn?: boolean;
};

/**
 * The workspace flavor of a Lego brick. Width is a percent of the workspace,
 * so it slots in-line with neighbors and they share the "one whole" plate.
 */
export function LegoBrick({
  num,
  den,
  color,
  widthPct,
  dataBarId,
  onPointerDown,
  disabled = false,
  animateIn = false,
}: LegoBrickProps) {
  return (
    <div
      data-bar-id={dataBarId}
      role="button"
      aria-label={`${num}/${den} brick — drag to move or remove`}
      onPointerDown={onPointerDown}
      style={{
        position: 'relative',
        width: `${widthPct}%`,
        height: 58,
        cursor: disabled ? 'default' : 'grab',
        animation: animateIn
          ? 'brickIn .28s cubic-bezier(.3,1.4,.55,1)'
          : 'none',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <StudRow color={color} />
      <div
        style={{
          height: 44,
          background: `linear-gradient(180deg, ${color} 0%, ${shade(color, -0.12)} 100%)`,
          borderRadius: '3px 3px 5px 5px',
          boxShadow:
            'inset 0 -5px 0 rgba(0,0,0,0.22), inset 0 3px 0 rgba(255,255,255,0.22), inset -2px 0 0 rgba(0,0,0,0.15), inset 2px 0 0 rgba(255,255,255,0.10)',
          border: '1px solid rgba(0,0,0,0.30)',
          display: 'grid',
          placeItems: 'center',
          color: 'rgba(0,0,0,0.78)',
          fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
          fontWeight: 600,
          fontSize: 14,
          transition: 'filter .15s',
        }}
      >
        <FracInline n={num} d={den} />
      </div>
    </div>
  );
}
