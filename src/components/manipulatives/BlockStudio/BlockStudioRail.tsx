'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useMemo, type CSSProperties } from 'react';
import { fracSum, fracValue, isOne } from '@/lib/lesson/fractions';
import type { FractionBoxBar } from '@/lib/lesson/types';
import { LegoBrick } from '../LegoBrick';
import { FracInline } from '../FracInline';
import type { ActiveDrag, DragSourceWorkspace, Rail } from './types';

export type BlockStudioRailProps = {
  readonly rail: Rail;
  readonly index: number;
  /** Snapshot of the active drag so the rail can hide the bar currently
   *  being dragged out of it (and color its border when something is
   *  being dragged over). Null when no drag is in progress. */
  readonly activeDrag: ActiveDrag | null;
  /** dnd-kit's `over` id — when this rail is the drop target, we light
   *  up the border + show the "release to drop" caption. */
  readonly hoverRailId: string | null;
  readonly isEquivWithOther: boolean;
  readonly canRemove: boolean;
  readonly disabled: boolean;
  readonly onRemoveRail: (railId: string) => void;
};

const headRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
};

const railName: CSSProperties = {
  fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
  fontSize: 11,
  letterSpacing: '0.16em',
  color: 'var(--ink-mute)',
  textTransform: 'uppercase',
};

function statusStyle(isFull: boolean, isOver: boolean): CSSProperties {
  return {
    fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
    fontSize: 10.5,
    letterSpacing: '0.04em',
    color: isFull
      ? 'var(--green)'
      : isOver
        ? 'var(--orange)'
        : 'var(--ink-faint)',
    marginLeft: 12,
  };
}

const deleteBtn: CSSProperties = {
  display: 'inline-grid',
  placeItems: 'center',
  width: 24,
  height: 24,
  borderRadius: 999,
  background: 'transparent',
  border: '1px solid var(--line)',
  color: 'var(--ink-mute)',
  cursor: 'pointer',
};

const plateRow: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'flex-end',
  padding: '2px 2px 0',
};

const plateEmpty: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  color: 'var(--ink-faint)',
  fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  pointerEvents: 'none',
};

const footRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 12,
  gap: 16,
  flexWrap: 'wrap',
};

const sumStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexWrap: 'wrap',
  fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
  fontSize: 14,
  color: 'var(--ink-soft)',
};

const barTrack: CSSProperties = {
  width: 140,
  height: 6,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid var(--line)',
  overflow: 'hidden',
  flexShrink: 0,
};

/** Per-brick draggable wrapper — kept inside this file because it's only
 *  used by the rail and stays tightly coupled to the brick visual layout. */
function RailBrickDraggable({
  bar,
  railId,
  color,
  widthPct,
  disabled,
}: {
  readonly bar: FractionBoxBar;
  readonly railId: string;
  readonly color: string;
  readonly widthPct: number;
  readonly disabled: boolean;
}) {
  const data: DragSourceWorkspace = {
    source: 'workspace',
    fromRailId: railId,
    barId: bar.id,
    frac: { num: bar.num, den: bar.den, color },
  };
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `bar:${bar.id}`,
    data,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-bar-id={bar.id}
      style={{
        position: 'relative',
        width: `${widthPct}%`,
        // Match the visual brick height so the parent flex doesn't shrink.
        height: 58,
        // Hide while being dragged — DragOverlay paints the ghost.
        opacity: isDragging ? 0 : 1,
        touchAction: 'none',
      }}
    >
      <LegoBrick
        num={bar.num}
        den={bar.den}
        color={color}
        widthPct={100}
        dataBarId={bar.id}
        animateIn
        disabled={disabled}
      />
    </div>
  );
}

/**
 * A single "one whole" rail. Its plate is a @dnd-kit droppable; each brick
 * inside is its own draggable. Layout, tick markers, sum readout, and
 * fill-meter are unchanged from the original implementation.
 */
export function BlockStudioRail({
  rail,
  index,
  activeDrag,
  hoverRailId,
  isEquivWithOther,
  canRemove,
  disabled,
  onRemoveRail,
}: BlockStudioRailProps) {
  // Hide a bar that is currently being dragged out of THIS rail so the
  // remaining bricks reflow naturally (the ghost paints in its place).
  // Pull the source out into a local so TS narrows it to the workspace
  // variant before we read `barId`/`fromRailId`.
  const dragSource = activeDrag?.source ?? null;
  const visibleBars =
    dragSource?.source === 'workspace' && dragSource.fromRailId === rail.id
      ? rail.bars.filter((b) => b.id !== dragSource.barId)
      : rail.bars;

  const s = useMemo(() => fracSum(visibleBars), [visibleBars]);
  const sumV = fracValue(s);
  const full = isOne(s);
  const over = sumV > 1 + 1e-9;
  const fillW = Math.max(0, Math.min(1, sumV)) * 100;

  const isHover = hoverRailId === rail.id;
  const isDragInProgress = activeDrag !== null;

  // Register the plate as a droppable. The id is namespaced so onDragEnd
  // can route 'rail:<railId>' targets without colliding with bar ids.
  const { setNodeRef } = useDroppable({
    id: `rail:${rail.id}`,
    data: { railId: rail.id },
  });

  const cardStyle: CSSProperties = {
    position: 'relative',
    padding: '16px 18px 18px',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.025)',
    border: `1px solid ${
      isHover
        ? 'var(--blue)'
        : full
          ? 'rgba(95,216,151,0.45)'
          : isEquivWithOther
            ? 'rgba(91,140,255,0.45)'
            : 'var(--line)'
    }`,
    boxShadow: isHover
      ? '0 0 0 3px rgba(91,140,255,0.18)'
      : isEquivWithOther
        ? '0 0 0 3px rgba(91,140,255,0.12)'
        : full
          ? '0 0 0 2px rgba(95,216,151,0.18)'
          : 'none',
    transition: 'border-color .2s, box-shadow .25s',
  };

  const plate: CSSProperties = {
    position: 'relative',
    height: 64,
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
    border: '1px solid var(--line-strong)',
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.25)',
  };

  return (
    <div style={cardStyle}>
      <div style={headRow}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={railName}>
            Rail {String(index + 1).padStart(2, '0')}
          </span>
          <span style={statusStyle(full, over)}>
            {visibleBars.length === 0 && 'empty'}
            {visibleBars.length > 0 && !full && !over && (
              <>{Math.round(sumV * 100)}% of 1</>
            )}
            {full && (
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path
                    d="M2 5.8L4.4 8.2L9 3.2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                one whole
              </span>
            )}
            {over && 'over one whole'}
          </span>
        </div>
        {canRemove && (
          <button
            type="button"
            aria-label="Remove rail"
            title="Remove this rail"
            onClick={() => onRemoveRail(rail.id)}
            disabled={disabled}
            style={deleteBtn}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 3L11 11M11 3L3 11"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* The plate — droppable target. The ref + data-rail-id let
          BlockStudio's onDragEnd both (a) accept the drop and
          (b) measure child rects for the insertion-by-midpoint logic. */}
      <div ref={setNodeRef} data-rail-id={rail.id} style={plate}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '50%',
            width: 1,
            background: 'rgba(170,190,255,0.18)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '25%',
            width: 1,
            background: 'rgba(170,190,255,0.08)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '75%',
            width: 1,
            background: 'rgba(170,190,255,0.08)',
          }}
        />

        <div style={plateRow}>
          {visibleBars.map((b) => (
            <RailBrickDraggable
              key={b.id}
              bar={b}
              railId={rail.id}
              color={b.color}
              widthPct={(b.num / b.den) * 100}
              disabled={disabled}
            />
          ))}
        </div>

        {visibleBars.length === 0 && !isDragInProgress && (
          <div style={plateEmpty}>drop a brick here</div>
        )}
        {visibleBars.length === 0 && isDragInProgress && isHover && (
          <div style={{ ...plateEmpty, color: 'var(--blue)' }}>
            release to drop
          </div>
        )}
      </div>

      <div style={footRow}>
        <div style={sumStyle}>
          {visibleBars.length === 0 ? (
            <span style={{ color: 'var(--ink-faint)' }}>no bricks yet</span>
          ) : (
            <>
              {visibleBars.map((b, i) => (
                <span
                  key={b.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {i > 0 && <span style={{ color: 'var(--ink-mute)' }}>+</span>}
                  <span style={{ color: b.color, fontWeight: 500 }}>
                    <FracInline n={b.num} d={b.den} />
                  </span>
                </span>
              ))}
              <span style={{ color: 'var(--ink-mute)', marginLeft: 4 }}>=</span>
              <span style={{ color: full ? 'var(--green)' : 'var(--ink)' }}>
                {full ? (
                  <span>
                    1{' '}
                    <span style={{ color: 'var(--ink-mute)', fontSize: 12 }}>
                      (one whole)
                    </span>
                  </span>
                ) : (
                  <FracInline n={s.num} d={s.den} />
                )}
              </span>
            </>
          )}
        </div>
        <div style={barTrack} title={`${Math.round(sumV * 100)}% of one whole`}>
          <div
            style={{
              width: `${fillW}%`,
              height: '100%',
              background: full
                ? 'var(--green)'
                : over
                  ? 'var(--orange)'
                  : 'var(--blue)',
              transition:
                'width .35s cubic-bezier(.4,1.3,.55,1), background .2s',
            }}
          />
        </div>
      </div>
    </div>
  );
}
