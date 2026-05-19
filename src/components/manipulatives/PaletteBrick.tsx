'use client';

import type { PointerEvent as ReactPointerEvent } from 'react';
import { FracInline } from './FracInline';
import { StudRow } from './StudRow';
import { shade } from './shade';

export type PaletteBrickProps = {
  readonly num: number;
  readonly den: number;
  readonly color: string;
  readonly disabled?: boolean;
  /** Optional — when omitted (the dnd-kit path in BlockStudio) the brick is
   *  purely visual and its parent wrapper owns drag activation. */
  readonly onPointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void;
};

/**
 * Standalone Lego brick used in the palette row. Width is fixed and
 * proportional to the fraction (½ widest, ⅛ smallest) so the palette
 * reads like a row of physical bricks on a desk.
 */
export function PaletteBrick({
  num,
  den,
  color,
  disabled = false,
  onPointerDown,
}: PaletteBrickProps) {
  const w = 36 + (num / den) * 220;
  return (
    <div
      role="button"
      aria-label={`${num}/${den} brick — drag into the workspace`}
      onPointerDown={onPointerDown}
      style={{
        position: 'relative',
        height: 56,
        width: w,
        cursor: disabled ? 'default' : 'grab',
        opacity: disabled ? 0.35 : 1,
        transition: 'opacity .2s',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <StudRow color={color} />
      <div
        style={{
          height: 42,
          background: `linear-gradient(180deg, ${color} 0%, ${shade(color, -0.14)} 100%)`,
          borderRadius: '3px 3px 5px 5px',
          boxShadow:
            'inset 0 -5px 0 rgba(0,0,0,0.22), inset 0 3px 0 rgba(255,255,255,0.22), inset -2px 0 0 rgba(0,0,0,0.15), inset 2px 0 0 rgba(255,255,255,0.10), 0 4px 12px -4px rgba(0,0,0,0.5)',
          border: '1px solid rgba(0,0,0,0.30)',
          display: 'grid',
          placeItems: 'center',
          color: 'rgba(0,0,0,0.78)',
          fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
          fontWeight: 600,
          fontSize: 16,
        }}
      >
        <FracInline n={num} d={den} />
      </div>
    </div>
  );
}
