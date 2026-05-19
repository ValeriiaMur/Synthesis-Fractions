'use client';

import { useMemo, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { fracSum, fracValue, isOne } from '@/lib/lesson/fractions';
import type { FractionBoxBar } from '@/lib/lesson/types';
import { LegoBrick } from '../LegoBrick';
import { FracInline } from '../FracInline';
import type { DragState, Rail } from './types';

export type BlockStudioRailProps = {
  readonly rail: Rail;
  readonly index: number;
  readonly drag: DragState | null;
  readonly hoverRailId: string | null;
  readonly isEquivWithOther: boolean;
  readonly canRemove: boolean;
  readonly disabled: boolean;
  readonly onPointerDownBrick: (
    e: ReactPointerEvent<HTMLDivElement>,
    railId: string,
    bar: FractionBoxBar,
  ) => void;
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
    color: isFull ? 'var(--green)' : isOver ? 'var(--orange)' : 'var(--ink-faint)',
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

export function BlockStudioRail({
  rail,
  index,
  drag,
  hoverRailId,
  isEquivWithOther,
  canRemove,
  disabled,
  onPointerDownBrick,
  onRemoveRail,
}: BlockStudioRailProps) {
  const visibleBars =
    drag?.source === 'workspace' && drag.fromRailId === rail.id
      ? rail.bars.filter((b) => b.id !== drag.barId)
      : rail.bars;

  const s = useMemo(() => fracSum(visibleBars), [visibleBars]);
  const sumV = fracValue(s);
  const full = isOne(s);
  const over = sumV > 1 + 1e-9;
  const fillW = Math.max(0, Math.min(1, sumV)) * 100;

  const isHover = hoverRailId === rail.id;

  // Card border / glow shifts subtly based on hover / full / equivalence
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
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

      {/* The plate — drop target */}
      <div data-rail-id={rail.id} style={plate}>
        {/* tick markers (1/2 darker, 1/4 and 3/4 subtle) */}
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
            <LegoBrick
              key={b.id}
              num={b.num}
              den={b.den}
              color={b.color}
              widthPct={(b.num / b.den) * 100}
              dataBarId={b.id}
              animateIn
              disabled={disabled}
              onPointerDown={(e) => onPointerDownBrick(e, rail.id, b)}
            />
          ))}
        </div>

        {visibleBars.length === 0 && !drag && (
          <div style={plateEmpty}>drop a brick here</div>
        )}
        {visibleBars.length === 0 && drag && isHover && (
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
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
              transition: 'width .35s cubic-bezier(.4,1.3,.55,1), background .2s',
            }}
          />
        </div>
      </div>
    </div>
  );
}
