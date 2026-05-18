'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type {
  FractionBoxBar,
  FractionBoxConfig,
  FractionBoxState,
} from '@/lib/lesson/types';
import {
  comboKey,
  canFit,
  fracSum,
  fracValue,
  isOne,
} from '@/lib/lesson/fractions';
import { Caption } from './Caption';
import { Plate } from './Plate';
import { LegoBrick } from './LegoBrick';
import { PaletteBrick } from './PaletteBrick';
import { DragGhostBrick } from './DragGhostBrick';
import { FracInline } from './FracInline';

type PaletteFrac = {
  readonly num: number;
  readonly den: number;
  readonly color: string;
};

type DragState =
  | {
      readonly source: 'palette';
      readonly frac: PaletteFrac;
      x: number;
      y: number;
      readonly gx: number;
      readonly gy: number;
      readonly w: number;
      readonly h: number;
    }
  | {
      readonly source: 'workspace';
      readonly barId: string;
      readonly frac: PaletteFrac;
      x: number;
      y: number;
      readonly gx: number;
      readonly gy: number;
      readonly w: number;
      readonly h: number;
    };

/* Palette colors, in declaration order. Bound to the five canonical unit
   fractions used in the lesson; we look up by `1/den`. */
const PALETTE_COLORS: Readonly<Record<number, string>> = {
  2: '#f06b85', // red
  3: '#ffb079', // orange
  4: '#5b8cff', // blue
  6: '#5fd897', // green
  8: '#b69bff', // purple
};

function colorForDen(den: number): string {
  return PALETTE_COLORS[den] ?? '#5b8cff';
}

const brickLabel: CSSProperties = {
  fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
  fontSize: 10,
  letterSpacing: '0.14em',
  color: 'var(--ink-mute)',
  textTransform: 'uppercase',
  marginBottom: 8,
  display: 'flex',
  justifyContent: 'space-between',
};

const emptyState: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  color: 'var(--ink-faint)',
  fontSize: 12,
  fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  pointerEvents: 'none',
};

export type FractionBoxProps = {
  readonly config: FractionBoxConfig;
  readonly value?: FractionBoxState;
  readonly onChange?: (state: FractionBoxState) => void;
  readonly disabled?: boolean;
};

/**
 * Lego-brick fraction puzzle. Drag unit-fraction bricks from the palette
 * into the workspace; bricks lay along a "one whole" row. Same total →
 * same visible space → equivalence. Completes when the learner has built
 * `config.minCombos` distinct full-fills.
 */
export function FractionBox({
  config,
  value,
  onChange,
  disabled = false,
}: FractionBoxProps) {
  const [bars, setBars] = useState<readonly FractionBoxBar[]>(
    () => value?.bars ?? [],
  );
  const [combos, setCombos] = useState<ReadonlySet<string>>(() => new Set());
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverWs, setHoverWs] = useState(false);
  const [justFilled, setJustFilled] = useState(false);

  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const barsRef = useRef(bars);
  barsRef.current = bars;

  const palette = useMemo<readonly PaletteFrac[]>(
    () =>
      config.palette.map((p) => ({
        num: p.num,
        den: p.den,
        color: colorForDen(p.den),
      })),
    [config.palette],
  );

  const sum = useMemo(() => fracSum(bars), [bars]);
  const sumValue = fracValue(sum);
  const filled = isOne(sum);

  /* Whenever the workspace just hit "exactly one", capture the combo and
     flip the green-glow flag for 1.2s. */
  useEffect(() => {
    if (!filled || bars.length === 0) return;
    const key = comboKey(bars);
    setCombos((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setJustFilled(true);
    const t = window.setTimeout(() => setJustFilled(false), 1200);
    return () => window.clearTimeout(t);
  }, [filled, bars]);

  /* Publish to the lesson state machine. */
  useEffect(() => {
    onChange?.({
      kind: 'fractionbox',
      bars,
      combos: combos.size,
    });
  }, [bars, combos, onChange]);

  const computeInsertIndex = useCallback(
    (clientX: number, wsEl: HTMLElement | null): number => {
      if (!wsEl) return barsRef.current.length;
      const children = wsEl.querySelectorAll<HTMLElement>('[data-bar-id]');
      for (let i = 0; i < children.length; i++) {
        const cr = children[i].getBoundingClientRect();
        if (clientX < cr.left + cr.width / 2) return i;
      }
      return children.length;
    },
    [],
  );

  const startDrag = useCallback(
    (
      e: ReactPointerEvent<HTMLDivElement>,
      src:
        | { readonly source: 'palette'; readonly frac: PaletteFrac }
        | {
            readonly source: 'workspace';
            readonly frac: PaletteFrac;
            readonly barId: string;
          },
    ) => {
      if (disabled) return;
      e.preventDefault();
      const r = e.currentTarget.getBoundingClientRect();
      const gx = e.clientX - r.left;
      const gy = e.clientY - r.top;
      if (src.source === 'palette') {
        setDrag({
          source: 'palette',
          frac: src.frac,
          x: e.clientX,
          y: e.clientY,
          gx,
          gy,
          w: r.width,
          h: r.height,
        });
      } else {
        setDrag({
          source: 'workspace',
          frac: src.frac,
          barId: src.barId,
          x: e.clientX,
          y: e.clientY,
          gx,
          gy,
          w: r.width,
          h: r.height,
        });
      }
    },
    [disabled],
  );

  useEffect(() => {
    if (!drag) return;

    const onMove = (ev: PointerEvent) => {
      setDrag((d) => (d ? { ...d, x: ev.clientX, y: ev.clientY } : d));
      const ws = workspaceRef.current;
      if (!ws) return;
      const r = ws.getBoundingClientRect();
      const inside =
        ev.clientX >= r.left &&
        ev.clientX <= r.right &&
        ev.clientY >= r.top &&
        ev.clientY <= r.bottom;
      setHoverWs(inside);
    };

    const onUp = (ev: PointerEvent) => {
      const wsEl = workspaceRef.current;
      const r = wsEl?.getBoundingClientRect();
      const inside =
        !!r &&
        ev.clientX >= r.left &&
        ev.clientX <= r.right &&
        ev.clientY >= r.top &&
        ev.clientY <= r.bottom;
      const cur = barsRef.current;

      if (inside) {
        if (drag.source === 'palette') {
          if (canFit(cur, { num: drag.frac.num, den: drag.frac.den })) {
            const newBar: FractionBoxBar = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              num: drag.frac.num,
              den: drag.frac.den,
              color: drag.frac.color,
            };
            const insertAt = computeInsertIndex(ev.clientX, wsEl);
            const next = [...cur];
            next.splice(insertAt, 0, newBar);
            setBars(next);
          }
        } else {
          const others = cur.filter((b) => b.id !== drag.barId);
          const dragged = cur.find((b) => b.id === drag.barId);
          if (dragged) {
            const insertAt = computeInsertIndex(ev.clientX, wsEl);
            const next = [...others];
            next.splice(insertAt, 0, dragged);
            setBars(next);
          }
        }
      } else if (drag.source === 'workspace') {
        setBars(cur.filter((b) => b.id !== drag.barId));
      }
      setDrag(null);
      setHoverWs(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag, computeInsertIndex]);

  const reset = () => {
    if (disabled) return;
    setBars([]);
    setHoverWs(false);
  };

  /* While dragging FROM the workspace, hide the picked-up bar from the
     visible row so the ghost stands in for it and other bars reflow. */
  const visibleBars =
    drag?.source === 'workspace'
      ? bars.filter((b) => b.id !== drag.barId)
      : bars;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        alignItems: 'stretch',
        maxWidth: 540,
        width: '100%',
        margin: '0 auto',
        userSelect: drag ? 'none' : 'auto',
        touchAction: 'none',
      }}
    >
      {/* reference: one whole */}
      <div>
        <div style={brickLabel}>
          <span>one whole</span>
          <span style={{ color: filled ? 'var(--green)' : 'var(--ink-faint)' }}>
            {filled ? '✓ filled' : 'drop bricks below to fill'}
          </span>
        </div>
        <Plate>
          <div
            data-testid="fraction-box-fill"
            style={{
              position: 'absolute',
              top: 4,
              bottom: 4,
              left: 4,
              width: `calc(${Math.min(1, sumValue) * 100}% - 8px)`,
              background: filled
                ? 'linear-gradient(180deg, rgba(95,216,151,0.18), rgba(95,216,151,0.05))'
                : 'linear-gradient(180deg, rgba(91,140,255,0.16), rgba(91,140,255,0.04))',
              border: `1px solid ${filled ? 'rgba(95,216,151,0.4)' : 'rgba(91,140,255,0.25)'}`,
              borderRadius: 4,
              transition:
                'width .35s cubic-bezier(.4,1.3,.55,1), background .3s, border-color .3s',
            }}
          />
        </Plate>
      </div>

      {/* workspace */}
      <div>
        <div style={brickLabel}>
          <span>your fractions</span>
          <span style={{ color: 'var(--ink-faint)' }}>
            drag bricks in · drag out to remove
          </span>
        </div>
        <div
          ref={workspaceRef}
          data-testid="fraction-box-workspace"
          style={{
            position: 'relative',
            height: 72,
            display: 'flex',
            alignItems: 'flex-end',
            paddingTop: 14,
            background: hoverWs
              ? 'rgba(91,140,255,0.06)'
              : 'rgba(255,255,255,0.025)',
            border: `1px dashed ${
              hoverWs
                ? 'rgba(91,140,255,0.55)'
                : justFilled
                  ? 'rgba(95,216,151,0.55)'
                  : 'var(--line-strong)'
            }`,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: justFilled
              ? '0 0 0 2px rgba(95,216,151,0.45), 0 0 40px rgba(95,216,151,0.3) inset'
              : 'none',
            transition:
              'background .2s, border-color .2s, box-shadow .35s',
          }}
        >
          {visibleBars.length === 0 && !drag && (
            <div style={emptyState}>drag bricks here ↓</div>
          )}
          {visibleBars.length === 0 && drag && (
            <div style={{ ...emptyState, color: 'var(--blue)' }}>
              release to drop
            </div>
          )}
          {visibleBars.map((b) => (
            <LegoBrick
              key={b.id}
              num={b.num}
              den={b.den}
              color={b.color}
              widthPct={(b.num / b.den) * 100}
              dataBarId={b.id}
              animateIn
              onPointerDown={(e) =>
                startDrag(e, {
                  source: 'workspace',
                  barId: b.id,
                  frac: { num: b.num, den: b.den, color: b.color },
                })
              }
              disabled={disabled || !!drag}
            />
          ))}
        </div>

        {/* live sum readout */}
        <div
          style={{
            marginTop: 12,
            minHeight: 28,
            fontSize: 15,
            color: 'var(--ink-soft)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            alignItems: 'center',
            fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
            fontWeight: 300,
          }}
          aria-label="Current sum"
        >
          {bars.length === 0 ? (
            <span style={{ color: 'var(--ink-faint)' }}>—</span>
          ) : (
            <>
              {bars.map((b, i) => (
                <span
                  key={b.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {i > 0 && (
                    <span style={{ color: 'var(--ink-mute)' }}>+</span>
                  )}
                  <span style={{ color: b.color, fontWeight: 500 }}>
                    <FracInline n={b.num} d={b.den} />
                  </span>
                </span>
              ))}
              <span style={{ color: 'var(--ink-mute)', marginLeft: 6 }}>
                =
              </span>
              <span
                style={{ color: filled ? 'var(--green)' : 'var(--ink)' }}
              >
                {filled ? (
                  <span>
                    1{' '}
                    <span
                      style={{ color: 'var(--ink-mute)', fontSize: 12 }}
                    >
                      (one whole)
                    </span>
                  </span>
                ) : (
                  <FracInline n={sum.num} d={sum.den} />
                )}
              </span>
            </>
          )}
        </div>
      </div>

      {/* palette */}
      <div>
        <div
          style={{
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.14em',
            color: 'var(--ink-mute)',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          fraction bricks · grab to drag
        </div>
        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          {palette.map((p) => {
            const ok = canFit(bars, p);
            return (
              <PaletteBrick
                key={`${p.num}/${p.den}`}
                num={p.num}
                den={p.den}
                color={p.color}
                disabled={disabled || !ok || !!drag}
                onPointerDown={(e) =>
                  ok && startDrag(e, { source: 'palette', frac: p })
                }
              />
            );
          })}
        </div>
      </div>

      {/* combos + reset */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            fontSize: 11,
            letterSpacing: '0.12em',
            color: 'var(--ink-mute)',
            textTransform: 'uppercase',
          }}
        >
          <span>ways found</span>
          <span style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: config.minCombos }, (_, i) => (
              <span
                key={i}
                style={{
                  width: 18,
                  height: 18,
                  display: 'grid',
                  placeItems: 'center',
                  border: `1px solid ${combos.size > i ? 'var(--green)' : 'var(--line-strong)'}`,
                  color: combos.size > i ? 'var(--green)' : 'transparent',
                  borderRadius: 4,
                  fontSize: 11,
                  fontFamily:
                    'var(--font-work-sans), Work Sans, sans-serif',
                }}
              >
                ✓
              </span>
            ))}
          </span>
          <span
            style={{
              color:
                combos.size >= config.minCombos
                  ? 'var(--green)'
                  : 'var(--ink-faint)',
            }}
          >
            {combos.size} / {config.minCombos}
          </span>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={disabled || bars.length === 0}
          style={{
            background: 'transparent',
            border: '1px solid var(--line-strong)',
            color: 'var(--ink-mute)',
            borderRadius: 10,
            padding: '6px 12px',
            fontSize: 11,
            fontFamily:
              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            letterSpacing: '0.12em',
            cursor:
              disabled || bars.length === 0 ? 'default' : 'pointer',
            textTransform: 'uppercase',
          }}
        >
          clear
        </button>
      </div>

      <Caption>
        {bars.length === 0 &&
          'Drag a brick from below into the workspace.'}
        {bars.length > 0 &&
          !filled &&
          'Keep dragging bricks in until they fill the whole row.'}
        {filled &&
          combos.size < config.minCombos &&
          'You filled the whole. Clear and try a different combination of bricks.'}
        {combos.size >= config.minCombos &&
          "Two different combinations — same whole. That's what equivalence looks like."}
      </Caption>

      {/* floating ghost while dragging */}
      {drag && (
        <div
          style={{
            position: 'fixed',
            left: drag.x - drag.gx,
            top: drag.y - drag.gy,
            width: drag.w,
            height: drag.h,
            pointerEvents: 'none',
            zIndex: 1000,
            transform: 'scale(1.04) rotate(-1deg)',
            transformOrigin: 'center center',
            filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.55))',
          }}
        >
          <DragGhostBrick
            num={drag.frac.num}
            den={drag.frac.den}
            color={drag.frac.color}
          />
        </div>
      )}

      <style>{`
        @keyframes brickIn {
          from { transform: translateY(-8px) scale(0.96); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
