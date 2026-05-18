'use client';

import { useEffect, useState } from 'react';
import type { PaperState } from '@/lib/lesson/types';
import { Caption } from './Caption';
import { FoldChip } from './FoldChip';

type FoldDirection = 'horizontal' | 'vertical';

export type PaperFoldProps = {
  readonly value?: PaperState;
  readonly onChange?: (state: PaperState) => void;
  readonly disabled?: boolean;
};

/**
 * PaperFold — tap to cycle 0 → [horizontal] → [horizontal, vertical] → 0.
 * On the second fold, overlays half + quarter highlights and labels.
 * Completes when folds.length >= 2.
 */
export function PaperFold({ value, onChange, disabled }: PaperFoldProps) {
  const [folds, setFolds] = useState<readonly FoldDirection[]>(
    () => value?.folds ?? [],
  );

  useEffect(() => {
    onChange?.({ kind: 'paper', folds });
  }, [folds, onChange]);

  const handleTap = () => {
    if (disabled) return;
    setFolds((prev) => {
      if (prev.length === 0) return ['horizontal'];
      if (prev.length === 1) return ['horizontal', 'vertical'];
      return [];
    });
  };

  const hasH = folds.includes('horizontal');
  const hasV = folds.includes('vertical');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        alignItems: 'center',
      }}
    >
      <button
        type="button"
        onClick={handleTap}
        aria-label="Fold paper"
        style={{
          border: 0,
          background: 'transparent',
          padding: 0,
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        <svg width="260" height="260" viewBox="0 0 260 260" aria-label="Paper square">
          <rect
            x="20"
            y="20"
            width="220"
            height="220"
            rx="6"
            fill="#f4ecd6"
            stroke="#c9bfa0"
            strokeWidth={1.5}
          />

          {hasH && hasV && (
            <>
              <rect
                x="20"
                y="20"
                width="220"
                height="110"
                fill="rgba(91,140,255,0.18)"
              />
              <rect
                x="20"
                y="20"
                width="110"
                height="110"
                fill="rgba(95,216,151,0.18)"
              />
              <rect
                x="130"
                y="20"
                width="110"
                height="110"
                fill="rgba(95,216,151,0.18)"
              />
              <line
                x1="130"
                y1="20"
                x2="130"
                y2="130"
                stroke="rgba(95,216,151,0.55)"
                strokeDasharray="4 4"
              />
              <line
                x1="20"
                y1="130"
                x2="240"
                y2="130"
                stroke="rgba(91,140,255,0.55)"
                strokeDasharray="4 4"
              />
            </>
          )}

          {hasH && (
            <line
              data-testid="crease"
              x1="20"
              y1="130"
              x2="240"
              y2="130"
              stroke="#7a6a3a"
              strokeWidth={2}
              strokeDasharray="6 4"
              style={{ animation: 'pop .4s ease' }}
            />
          )}
          {hasV && (
            <line
              data-testid="crease"
              x1="130"
              y1="20"
              x2="130"
              y2="240"
              stroke="#7a6a3a"
              strokeWidth={2}
              strokeDasharray="6 4"
              style={{ animation: 'pop .4s ease' }}
            />
          )}

          {hasH && hasV && (
            <>
              <text
                x="75"
                y="80"
                textAnchor="middle"
                fill="#3a4a78"
                fontFamily="var(--font-work-sans), Work Sans, sans-serif"
                fontWeight={400}
                fontSize={20}
              >
                ¼
              </text>
              <text
                x="185"
                y="80"
                textAnchor="middle"
                fill="#3a4a78"
                fontFamily="var(--font-work-sans), Work Sans, sans-serif"
                fontWeight={400}
                fontSize={20}
              >
                ¼
              </text>
              <text
                x="130"
                y="200"
                textAnchor="middle"
                fill="#3a4a78"
                fontFamily="var(--font-work-sans), Work Sans, sans-serif"
                fontWeight={400}
                fontSize={20}
              >
                ½
              </text>
            </>
          )}

          {!hasH && (
            <text
              x="130"
              y="135"
              textAnchor="middle"
              fill="#7a6a3a"
              fontFamily="var(--font-jetbrains-mono), JetBrains Mono, monospace"
              fontSize={11}
              letterSpacing={1.5}
            >
              TAP TO FOLD
            </text>
          )}
        </svg>
      </button>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <FoldChip active={hasH} label="fold 1 — half" />
        <FoldChip active={hasV} label="fold 2 — quarters" />
        <button
          type="button"
          onClick={() => !disabled && setFolds([])}
          style={{
            background: 'transparent',
            border: '1px solid var(--line-strong)',
            color: 'var(--ink-mute)',
            borderRadius: 10,
            padding: '6px 12px',
            fontSize: 11,
            fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            letterSpacing: '0.12em',
            cursor: disabled ? 'default' : 'pointer',
            textTransform: 'uppercase',
          }}
        >
          reset
        </button>
      </div>

      <Caption>
        {folds.length === 0 && 'Tap the paper to make your first fold.'}
        {folds.length === 1 &&
          'One fold marks one half. Tap again for the next fold.'}
        {folds.length === 2 &&
          'Two folds — one half holds two quarters inside it.'}
      </Caption>
    </div>
  );
}
