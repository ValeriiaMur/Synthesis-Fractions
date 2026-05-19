'use client';

import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { PaletteBrick } from '../PaletteBrick';
import type { PaletteFrac } from './types';

export type BlockStudioPaletteProps = {
  readonly palette: readonly PaletteFrac[];
  readonly disabled: boolean;
  readonly onStartDrag: (
    e: ReactPointerEvent<HTMLDivElement>,
    frac: PaletteFrac,
  ) => void;
};

const sectionLabel: CSSProperties = {
  fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
  fontSize: 10,
  letterSpacing: '0.18em',
  color: 'var(--ink-mute)',
  textTransform: 'uppercase',
  marginBottom: 8,
};

const note: CSSProperties = {
  fontSize: 12,
  color: 'var(--ink-mute)',
  lineHeight: 1.5,
  marginBottom: 14,
  fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
};

const grid: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  alignItems: 'flex-start',
};

export function BlockStudioPalette({
  palette,
  disabled,
  onStartDrag,
}: BlockStudioPaletteProps) {
  return (
    <div>
      <div style={sectionLabel}>Brick tray</div>
      <div style={note}>Each brick is labeled with its fraction. Wider = bigger.</div>
      <div style={grid}>
        {palette.map((p) => (
          <PaletteBrick
            key={`${p.num}/${p.den}`}
            num={p.num}
            den={p.den}
            color={p.color}
            disabled={disabled}
            onPointerDown={(e) => {
              if (!disabled) onStartDrag(e, p);
            }}
          />
        ))}
      </div>
    </div>
  );
}
