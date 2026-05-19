'use client';

import { useState } from 'react';
import { ChocolatePiece } from '@/components/manipulatives/ChocolatePiece';

type QuarterProps = {
  readonly onTap: () => void;
  readonly location: 'bar' | 'ref';
};

function Quarter({ onTap, location }: QuarterProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label="Quarter piece"
      style={{
        width: 56,
        height: 56,
        border: 0,
        padding: 0,
        background: 'transparent',
        cursor: 'pointer',
        transition: 'transform .25s cubic-bezier(.4,1.4,.55,1)',
      }}
    >
      {/* alt="" — accessible name comes from the button's aria-label. */}
      <ChocolatePiece size={56} placed={location === 'ref'} alt="" />
    </button>
  );
}

/**
 * Mini chocolate-bar interactive shown next to the hero copy. Tap a piece
 * to add it to the half-space; tap a placed piece to remove it.
 */
export function HeroPreview() {
  const [placed, setPlaced] = useState(0);
  const remaining = 4 - placed;

  return (
    <div className="hero-preview">
      <div className="hero-preview-label">
        <span>live · try it</span>
        <span className="ln" />
        <span
          style={{
            color: placed === 2 ? 'var(--green)' : 'var(--ink-mute)',
          }}
        >
          {placed === 2 ? 'perfect fit' : `${placed}/4 placed`}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            padding: 8,
            display: 'flex',
            gap: 4,
            background: 'rgba(110,58,28,0.10)',
            border: '1px dashed var(--line-strong)',
            borderRadius: 12,
            minHeight: 72,
            alignItems: 'center',
          }}
        >
          {Array.from({ length: remaining }, (_, i) => (
            <Quarter
              key={i}
              onTap={() => setPlaced((p) => Math.min(4, p + 1))}
              location="bar"
            />
          ))}
          {remaining === 0 && (
            <span
              style={{
                color: 'var(--ink-faint)',
                fontSize: 12,
                padding: '0 16px',
              }}
            >
              (empty)
            </span>
          )}
        </div>

        <div
          style={{
            color: 'var(--ink-mute)',
            fontSize: 13,
            fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            letterSpacing: '0.12em',
          }}
        >
          HALF-SPACE ↓
        </div>

        <div
          style={{
            padding: 8,
            display: 'flex',
            gap: 4,
            background:
              placed === 2
                ? 'rgba(95,216,151,0.10)'
                : 'rgba(91,140,255,0.05)',
            border: `2px dashed ${
              placed === 2 ? 'rgba(95,216,151,0.5)' : 'rgba(91,140,255,0.35)'
            }`,
            borderRadius: 12,
            minWidth: 144,
            minHeight: 72,
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all .3s',
          }}
        >
          {placed === 0 && (
            <span
              style={{
                color: 'var(--ink-faint)',
                fontSize: 12,
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                letterSpacing: '0.1em',
              }}
            >
              TAP A PIECE ↑
            </span>
          )}
          {Array.from({ length: placed }, (_, i) => (
            <Quarter
              key={i}
              onTap={() => setPlaced((p) => Math.max(0, p - 1))}
              location="ref"
            />
          ))}
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 300,
            color: 'var(--ink-mute)',
            fontStyle: 'italic',
            textAlign: 'center',
            maxWidth: 280,
          }}
        >
          {placed === 0 && 'Tap a quarter to place it on the half-space.'}
          {placed === 1 && 'One quarter on the space. Try another.'}
          {placed === 2 && 'Two quarters cover exactly one half.'}
          {placed === 3 && 'Three is more than a half. One is hanging over.'}
          {placed === 4 && 'Four quarters covers the whole bar.'}
        </div>
      </div>
    </div>
  );
}
