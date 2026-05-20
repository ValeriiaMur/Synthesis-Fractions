'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { PaperState } from '@/lib/lesson/types';
import { Paper } from './paper/Paper';
import { WholeNumber } from './paper/WholeNumber';

type FoldDirection = 'horizontal' | 'vertical';
type FoldCount = 0 | 1 | 2;

export type PaperFoldProps = {
  readonly value?: PaperState;
  readonly onChange?: (state: PaperState) => void;
  readonly disabled?: boolean;
};

type CornerSpec = {
  readonly from: 'tl' | 'tr' | 'bl' | 'br';
  readonly to: 'tl' | 'tr' | 'bl' | 'br';
  readonly direction: 'h' | 'v';
  /** Arrow glyph rendered on the corner handle. */
  readonly arrow: '↑' | '←';
  /** Hint copy shown while idle on this fold step. */
  readonly hint: string;
};

type DragState = {
  readonly startX: number;
  readonly startY: number;
  readonly x: number;
  readonly y: number;
  /** Offset inside the corner element where the pointer landed. */
  readonly gx: number;
  readonly gy: number;
  readonly w: number;
  readonly h: number;
  /** Workspace dimensions captured at pointerdown. The workspace can't
   *  resize mid-drag, so caching this avoids reading the ref during
   *  render (which would trip react-hooks/refs). */
  readonly wsWidth: number;
  readonly wsHeight: number;
};

const FOLDS_BY_COUNT: Record<FoldCount, readonly FoldDirection[]> = {
  0: [],
  1: ['horizontal'],
  2: ['horizontal', 'vertical'],
};

function countFromFolds(folds: readonly FoldDirection[] | undefined): FoldCount {
  if (!folds) return 0;
  if (folds.length >= 2) return 2;
  if (folds.length >= 1) return 1;
  return 0;
}

function specFor(folds: FoldCount): CornerSpec | null {
  if (folds === 0) {
    return {
      from: 'br',
      to: 'tr',
      direction: 'h',
      arrow: '↑',
      hint: 'Drag this corner up to the top — crease the paper across the middle.',
    };
  }
  if (folds === 1) {
    return {
      from: 'tr',
      to: 'tl',
      direction: 'v',
      arrow: '←',
      hint: 'Now drag this corner left — crease the paper the other way.',
    };
  }
  return null;
}

function cornerStyleFor(spec: CornerSpec): CSSProperties {
  if (spec.from === 'br') return { left: 'calc(100% - 26px)', top: 'calc(100% - 26px)' };
  if (spec.from === 'tr') return { left: 'calc(100% - 26px)', top: '-22px' };
  if (spec.from === 'tl') return { left: '-22px', top: '-22px' };
  return { left: '-22px', top: 'calc(100% - 26px)' };
}

function dropStyleFor(folds: FoldCount): CSSProperties | null {
  if (folds === 0) return { left: '50%', top: '0%', width: '50%', height: '50%' };
  if (folds === 1) return { left: '0%', top: '0%', width: '50%', height: '50%' };
  return null;
}

/**
 * PaperFold — drag-and-drop folding of a 4-quadrant star-paper square.
 * The student grabs a corner and pulls it across the paper; the paper
 * folds in real time (CSS 3D + sin-curve Z-lift). Past the halfway
 * point on release, the fold commits.
 *
 * Keyboard fallback: pressing Enter or Space on the corner handle
 * advances one fold without dragging (for non-pointer users + tests).
 *
 * Contract preserved from the prior tap-based version: `onChange` fires
 * `{ kind: 'paper', folds }` where `folds` is an ordered subset of
 * `['horizontal', 'vertical']`. The `paper_fold_final` beat completes
 * on `folds.length >= 2`.
 */
export function PaperFold({ value, onChange, disabled = false }: PaperFoldProps) {
  const [folds, setFolds] = useState<FoldCount>(() => countFromFolds(value?.folds));
  const [drag, setDrag] = useState<DragState | null>(null);
  /** True for ~1.5s right after a fold commits. Lets the hint line briefly
   *  read in success-green ("yes — one fold…") before settling back to the
   *  observational idle copy. */
  const [justFolded, setJustFolded] = useState(false);
  const justFoldedTimerRef = useRef<number | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  useEffect(
    () => () => {
      if (justFoldedTimerRef.current !== null) {
        window.clearTimeout(justFoldedTimerRef.current);
      }
    },
    [],
  );

  const flashJustFolded = useCallback(() => {
    if (justFoldedTimerRef.current !== null) {
      window.clearTimeout(justFoldedTimerRef.current);
    }
    setJustFolded(true);
    justFoldedTimerRef.current = window.setTimeout(() => {
      setJustFolded(false);
      justFoldedTimerRef.current = null;
    }, 1500);
  }, []);

  /* Stable ref for onChange so re-renders in the parent don't loop. */
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    onChangeRef.current?.({ kind: 'paper', folds: FOLDS_BY_COUNT[folds] });
  }, [folds]);

  const cornerSpec = useMemo(() => specFor(folds), [folds]);

  /* Live drag progress (0..1) — derived per render from cursor travel
     vs paper size. The Paper component reads this to drive the in-flight
     transforms. Workspace dimensions were captured at pointerdown so we
     don't read the ref during render. */
  const dragProgress = useMemo(() => {
    if (!drag || !cornerSpec) return 0;
    if (cornerSpec.direction === 'h') {
      return Math.max(0, Math.min(1, (drag.startY - drag.y) / drag.wsHeight));
    }
    return Math.max(0, Math.min(1, (drag.startX - drag.x) / drag.wsWidth));
  }, [drag, cornerSpec]);

  const dragDirection: 'h' | 'v' | null =
    drag && cornerSpec ? cornerSpec.direction : null;

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (disabled || !cornerSpec) return;
      const ws = workspaceRef.current;
      if (!ws) return;
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const wsRect = ws.getBoundingClientRect();
      setDrag({
        startX: e.clientX,
        startY: e.clientY,
        x: e.clientX,
        y: e.clientY,
        gx: e.clientX - rect.left,
        gy: e.clientY - rect.top,
        w: rect.width,
        h: rect.height,
        wsWidth: wsRect.width,
        wsHeight: wsRect.height,
      });
    },
    [disabled, cornerSpec],
  );

  /* Keyboard fallback — Enter / Space advances one fold without
     dragging. Mirrors what a successful drag would do. */
  const onCornerKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled || !cornerSpec) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      setFolds((f) => {
        if (f >= 2) return f;
        flashJustFolded();
        return (f + 1) as FoldCount;
      });
    },
    [disabled, cornerSpec, flashJustFolded],
  );

  /* Window-level pointer listeners drive the live drag + release. The
     refs hold the latest spec + state so the listener closes over fresh
     values without re-binding every render. */
  useEffect(() => {
    if (!drag || !cornerSpec) return;
    const onMove = (ev: PointerEvent) => {
      setDrag((d) => (d ? { ...d, x: ev.clientX, y: ev.clientY } : d));
    };
    const onUp = (ev: PointerEvent) => {
      const progress =
        cornerSpec.direction === 'h'
          ? Math.max(0, Math.min(1, (drag.startY - ev.clientY) / drag.wsHeight))
          : Math.max(0, Math.min(1, (drag.startX - ev.clientX) / drag.wsWidth));
      if (progress > 0.5) {
        setFolds((f) => {
          if (f >= 2) return f;
          flashJustFolded();
          return (f + 1) as FoldCount;
        });
      }
      setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag, cornerSpec, flashJustFolded]);

  const unfold = () => {
    if (disabled) return;
    setFolds((f) => (f > 0 ? ((f - 1) as FoldCount) : f));
  };
  const reset = () => {
    if (disabled) return;
    setFolds(0);
  };

  const hint = (() => {
    if (drag) {
      if (dragProgress < 0.3) return 'Pull it across…';
      if (dragProgress < 0.7) return 'Almost there…';
      return 'Release to crease the paper.';
    }
    if (justFolded && folds === 1)
      return 'yes — one fold. two halves, one on top of the other.';
    if (justFolded && folds === 2)
      return 'yes — two folds. four quarters, and two of them cover one half.';
    if (folds === 0) return cornerSpec?.hint ?? '';
    if (folds === 1)
      return 'One fold. The paper is now in two halves — one half on top of the other.';
    return 'Two folds. The paper is in four quarters — and two of them cover one half.';
  })();

  const partsCount = folds === 0 ? 1 : folds === 1 ? 2 : 4;
  const partFrac = folds === 0 ? '1' : folds === 1 ? '½' : '¼';
  const dropStyle = dropStyleFor(folds);
  const cornerStyle = cornerSpec ? cornerStyleFor(cornerSpec) : null;
  const dropActive = dragProgress > 0.5;

  return (
    <div className="paper-stage">
      <div className="paper-workspace" ref={workspaceRef}>
        <Paper
          folds={folds}
          dragProgress={dragProgress}
          dragDirection={dragDirection}
        />

        <WholeNumber visible={folds === 0 && dragProgress < 0.05} />

        {dropStyle && cornerSpec && (
          <div
            className={`paper-drop-zone${dropActive ? ' is-hover' : ''}`}
            style={dropStyle}
            aria-hidden
          >
            drop here
          </div>
        )}

        {cornerSpec && !drag && (
          <button
            type="button"
            className="paper-corner"
            onPointerDown={onPointerDown}
            onKeyDown={onCornerKeyDown}
            disabled={disabled}
            style={cornerStyle ?? undefined}
            aria-label="Drag this corner to fold the paper"
          >
            {cornerSpec.arrow}
          </button>
        )}

        {drag && cornerSpec && (
          <div
            className="paper-corner is-ghost"
            aria-hidden
            style={{
              position: 'fixed',
              left: drag.x - drag.gx,
              top: drag.y - drag.gy,
              width: drag.w,
              height: drag.h,
              pointerEvents: 'none',
              transform: `scale(1.08) rotate(${cornerSpec.direction === 'h' ? -3 : 3}deg)`,
              boxShadow: '0 14px 28px rgba(0,0,0,0.55)',
              zIndex: 1000,
            }}
          >
            {cornerSpec.arrow}
          </div>
        )}

        <div
          className={`paper-completion-glow${folds === 2 ? ' is-on' : ''}`}
          aria-hidden
        />
      </div>

      <div className="paper-panel">
        <div className="paper-panel-meta">
          <span className="emph">
            {partsCount} {partsCount === 1 ? 'whole' : 'parts'}
          </span>
          {' · '}
          <span>each {partFrac}</span>
        </div>
        <button
          type="button"
          className="paper-btn ghost"
          onClick={unfold}
          disabled={disabled || folds === 0}
        >
          ↩ unfold
        </button>
        <button
          type="button"
          className="paper-btn"
          onClick={reset}
          disabled={disabled || folds === 0}
        >
          start over
        </button>
      </div>

      <div
        className={`paper-hint${justFolded ? ' is-success' : ''}`}
        role="status"
        aria-live="polite"
      >
        {hint}
      </div>
    </div>
  );
}
