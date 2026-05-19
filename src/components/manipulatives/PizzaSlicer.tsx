'use client';

import { useEffect, useRef, useState } from 'react';
import type { PizzaState } from '@/lib/lesson/types';
import { Pizza } from './pizza/Pizza';

export type PizzaSlicerProps = {
  readonly value?: PizzaState;
  readonly onChange?: (state: PizzaState) => void;
  readonly disabled?: boolean;
};

const SLICE_OPTIONS = [2, 3, 4, 6, 8, 12] as const;
type SliceCount = (typeof SLICE_OPTIONS)[number];

function clampToOption(n: number): SliceCount {
  return (SLICE_OPTIONS as readonly number[]).includes(n)
    ? (n as SliceCount)
    : 2;
}

/**
 * PizzaSlicer — a realistic SVG pizza on a wooden board. The student
 * picks a slice count (2 · 3 · 4 · 6 · 8 · 12) and can tap any slice to
 * pull it out from the pie. The cursor over the pizza becomes a small
 * pizza-cutter wheel.
 *
 * Contract preserved from the prior slider-based version: `onChange`
 * fires `{ kind: 'pizza', sliceCount }` on mount and whenever the
 * count changes. The lesson's `pizza_explore` beat completes at
 * sliceCount === targetSlices (4).
 */
export function PizzaSlicer({
  value,
  onChange,
  disabled = false,
}: PizzaSlicerProps) {
  const [count, setCount] = useState<SliceCount>(() =>
    clampToOption(value?.sliceCount ?? 2),
  );
  const [extended, setExtended] = useState<ReadonlySet<number>>(
    () => new Set(),
  );

  /* Stable ref for onChange so re-renders in the parent don't loop. */
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    onChangeRef.current?.({ kind: 'pizza', sliceCount: count });
  }, [count]);

  const setSlicing = (n: SliceCount) => {
    if (disabled) return;
    setCount(n);
    setExtended(new Set());
  };

  const toggleSlice = (i: number) => {
    if (disabled) return;
    setExtended((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const resetExtended = () => {
    if (disabled) return;
    setExtended(new Set());
  };

  const taken = extended.size;
  const hint =
    taken === 0
      ? 'Tap a slice to pull it from the pie.'
      : taken === count
        ? `All ${count} slices out — the whole pie.`
        : `${taken} slice${taken === 1 ? '' : 's'} out of ${count} (${taken}/${count}).`;

  return (
    <div className="pizza-stage">
      <div className="pizza-board">
        <div className="pizza-wrap">
          <Pizza
            count={count}
            extendedSet={extended}
            onTapSlice={toggleSlice}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="pizza-panel">
        <div className="pizza-label">cut into</div>
        <div className="pizza-slice-buttons">
          {SLICE_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className={`pizza-slice-btn${count === n ? ' is-active' : ''}`}
              onClick={() => setSlicing(n)}
              disabled={disabled}
              aria-label={`Cut into ${n} slices`}
              aria-pressed={count === n}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="pizza-hint">{hint}</div>

      <button
        type="button"
        className="pizza-reset-btn"
        onClick={resetExtended}
        disabled={disabled || extended.size === 0}
      >
        push all back
      </button>
    </div>
  );
}
