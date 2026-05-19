'use client';

import { useDraggable } from '@dnd-kit/core';
import type { CSSProperties } from 'react';
import { PaletteBrick } from '../PaletteBrick';
import type { DragSourcePalette, PaletteFrac } from './types';

export type BlockStudioPaletteProps = {
  readonly palette: readonly PaletteFrac[];
  readonly disabled: boolean;
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

/** Single-brick wrapper that registers itself with the DndContext as a
 *  palette-source draggable. The visual brick itself is the unmodified
 *  PaletteBrick — listeners are spread on the wrapper so the parent owns
 *  drag activation cleanly. */
function PaletteBrickDraggable({
  frac,
  disabled,
}: {
  readonly frac: PaletteFrac;
  readonly disabled: boolean;
}) {
  const data: DragSourcePalette = { source: 'palette', frac };
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `palette:${frac.num}/${frac.den}`,
    data,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        // Hide the original while it's being dragged — DragOverlay shows
        // the ghost in its place so the kid sees one brick, not two.
        opacity: isDragging ? 0 : 1,
        // touchAction: none is critical for touch — without it, a vertical
        // scroll wins over the drag on most mobile browsers.
        touchAction: 'none',
      }}
    >
      <PaletteBrick
        num={frac.num}
        den={frac.den}
        color={frac.color}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Brick tray (left rail of the BlockStudio layout). Each brick is its own
 * @dnd-kit draggable; the inner PaletteBrick is a pure visual.
 */
export function BlockStudioPalette({
  palette,
  disabled,
}: BlockStudioPaletteProps) {
  return (
    <div>
      <div style={sectionLabel}>Brick tray</div>
      <div style={note}>
        Each brick is labeled with its fraction. Wider = bigger.
      </div>
      <div style={grid}>
        {palette.map((p) => (
          <PaletteBrickDraggable
            key={`${p.num}/${p.den}`}
            frac={p}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
