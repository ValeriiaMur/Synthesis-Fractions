'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PizzaState } from '@/lib/lesson/types';
import { Caption } from './Caption';

export type PizzaSlicerProps = {
  readonly value?: PizzaState;
  readonly onChange?: (state: PizzaState) => void;
  readonly disabled?: boolean;
};

type Topping = { x: number; y: number; c: string; s: number };

function makeToppings(cx: number, cy: number): readonly Topping[] {
  let s = 13;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const items: Topping[] = [];
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2;
    const r = rand() * 78 + 10;
    items.push({
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
      c: i % 2 === 0 ? '#f06b85' : '#ffd86b',
      s: 4 + rand() * 3,
    });
  }
  return items;
}

/**
 * PizzaSlicer — a 2-slice pizza with a draggable knife.
 * Slider goes 0..1; the second cut rotates from 0 → 90° and becomes
 * solid as the value approaches 1. Completes when sliceCount === 4.
 */
export function PizzaSlicer({ value, onChange, disabled }: PizzaSlicerProps) {
  const [cut, setCut] = useState<number>(value?.sliceCount === 4 ? 1 : 0);
  const slices: 2 | 4 = cut > 0.5 ? 4 : 2;

  /* Stable ref for onChange so re-renders in the parent don't spin a loop. */
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    onChangeRef.current?.({ kind: 'pizza', sliceCount: slices });
  }, [slices]);

  const R = 110;
  const cx = 140;
  const cy = 140;
  const secondAngle = cut * 90;
  const toppings = useMemo(() => makeToppings(cx, cy), []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        alignItems: 'center',
      }}
    >
      <svg
        role="img"
        aria-label="Pizza"
        width="280"
        height="280"
        viewBox="0 0 280 280"
        style={{ display: 'block' }}
      >
        <circle cx={cx} cy={cy} r={R + 6} fill="#5a3a1f" />
        <circle cx={cx} cy={cy} r={R} fill="#d8a86a" />
        <circle cx={cx} cy={cy} r={R - 4} fill="#e3b574" />
        <circle cx={cx} cy={cy} r={R - 14} fill="#c83a3a" opacity="0.85" />
        <circle cx={cx} cy={cy} r={R - 14} fill="#ffd86b" opacity="0.45" />
        {toppings.map((t, i) => (
          <circle
            key={i}
            cx={t.x}
            cy={t.y}
            r={t.s}
            fill={t.c}
            opacity="0.9"
          />
        ))}

        <line
          x1={cx - R}
          y1={cy}
          x2={cx + R}
          y2={cy}
          stroke="#fff"
          strokeWidth={2.5}
          strokeLinecap="round"
          data-testid="pizza-cut-first"
        />

        <g
          style={{
            transition: 'transform .35s ease',
            transformOrigin: `${cx}px ${cy}px`,
          }}
          transform={`rotate(${secondAngle - 90} ${cx} ${cy})`}
        >
          <line
            x1={cx - R}
            y1={cy}
            x2={cx + R}
            y2={cy}
            stroke="#fff"
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={cut > 0.05 ? Math.min(1, cut * 2) : 0.15}
            strokeDasharray={cut > 0.9 ? '0' : '6 6'}
            data-testid="pizza-cut-second"
          />
        </g>

        <g
          style={{
            transition: 'transform .35s ease',
            transformOrigin: `${cx}px ${cy}px`,
          }}
          transform={`rotate(${secondAngle - 90} ${cx} ${cy})`}
        >
          <g transform={`translate(${cx - R - 20}, ${cy - 6})`}>
            <rect x="0" y="0" width="14" height="12" rx="2" fill="#3a4a78" />
            <rect x="14" y="2" width="22" height="8" fill="#dfe5f5" />
            <path d="M36 2 L42 6 L36 10 Z" fill="#dfe5f5" />
          </g>
        </g>
      </svg>

      <div
        style={{
          width: 280,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={cut}
          disabled={disabled}
          onChange={(e) => setCut(parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: 'var(--blue)',
            height: 32,
            cursor: disabled ? 'default' : 'pointer',
          }}
          aria-label="Drag the knife"
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.12em',
            color: 'var(--ink-mute)',
            textTransform: 'uppercase',
          }}
        >
          <span>2 slices</span>
          <span>drag knife →</span>
          <span>4 slices</span>
        </div>
      </div>

      <Caption>
        {slices === 2 && 'Two halves. Each half is one big slice.'}
        {slices === 4 &&
          'Each half just became two slices. Same pizza — different pieces.'}
      </Caption>
    </div>
  );
}
