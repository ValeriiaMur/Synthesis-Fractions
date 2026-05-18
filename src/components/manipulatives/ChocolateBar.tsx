'use client';

import { useEffect, useState } from 'react';
import type { ChocolateState } from '@/lib/lesson/types';
import { Caption } from './Caption';
import { Fraction } from './Fraction';

type PieceLocation = 'bar' | 'ref';

export type ChocolateBarProps = {
  readonly value?: ChocolateState;
  readonly onChange?: (state: ChocolateState) => void;
  readonly disabled?: boolean;
};

const PIECE_COUNT = 4;

function initialLocations(seedRef: number): readonly PieceLocation[] {
  return Array.from({ length: PIECE_COUNT }, (_, i) =>
    i < seedRef ? 'ref' : 'bar',
  );
}

/**
 * ChocolateBar — four quarter-pieces in a tray + a half-space drop target.
 * Tap a piece to toggle its location. Completes when exactly 2 pieces sit
 * on the half-space.
 */
export function ChocolateBar({ value, onChange, disabled }: ChocolateBarProps) {
  const seed = value?.piecesOnReference ?? 0;
  const [locs, setLocs] = useState<readonly PieceLocation[]>(() =>
    initialLocations(seed),
  );

  useEffect(() => {
    const piecesOnReference = locs.filter((l) => l === 'ref').length;
    onChange?.({ kind: 'chocolate', piecesOnReference });
  }, [locs, onChange]);

  const toggle = (i: number) => {
    if (disabled) return;
    setLocs((prev) =>
      prev.map((l, j) =>
        j === i ? (l === 'bar' ? 'ref' : 'bar') : l,
      ),
    );
  };

  const barPieces = locs
    .map((l, i) => (l === 'bar' ? i : null))
    .filter((x): x is number => x !== null);
  const refPieces = locs
    .map((l, i) => (l === 'ref' ? i : null))
    .filter((x): x is number => x !== null);
  const correct = refPieces.length === 2;

  const Piece = ({ idx, location }: { idx: number; location: PieceLocation }) => (
    <button
      type="button"
      onClick={() => toggle(idx)}
      aria-label={`Quarter piece ${idx + 1}`}
      style={{
        width: 84,
        height: 84,
        borderRadius: 14,
        border: 0,
        background:
          'linear-gradient(135deg, #6e3a1c 0%, #8a4622 30%, #5d2f17 100%)',
        position: 'relative',
        cursor: disabled ? 'default' : 'pointer',
        boxShadow:
          location === 'ref'
            ? '0 0 0 2px rgba(95,216,151,0.45), 0 12px 24px -8px rgba(0,0,0,0.6)'
            : 'inset 0 2px 0 rgba(255,255,255,0.10), inset 0 -2px 0 rgba(0,0,0,0.35), 0 10px 20px -8px rgba(0,0,0,0.5)',
        transition:
          'transform .25s cubic-bezier(.4,1.4,.55,1), box-shadow .2s',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 84 84"
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden
      >
        <path
          d="M0 28 L84 28 M0 56 L84 56 M28 0 L28 84 M56 0 L56 84"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="1.2"
          fill="none"
        />
        <path
          d="M0 28 L84 28 M0 56 L84 56 M28 0 L28 84 M56 0 L56 84"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
          fill="none"
          transform="translate(1 1)"
        />
      </svg>
    </button>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.14em',
            color: 'var(--ink-mute)',
            textTransform: 'uppercase',
          }}
        >
          the bar — four quarters
        </div>
        <div
          data-testid="chocolate-bar"
          aria-label="Chocolate bar"
          style={{
            padding: 12,
            background: 'rgba(110,58,28,0.10)',
            border: '1px dashed rgba(255,255,255,0.10)',
            borderRadius: 18,
            display: 'flex',
            gap: 6,
            minHeight: 108,
            alignItems: 'center',
          }}
        >
          {barPieces.length === 0 ? (
            <span
              style={{
                color: 'var(--ink-faint)',
                fontSize: 13,
                padding: '0 24px',
              }}
            >
              (empty)
            </span>
          ) : (
            barPieces.map((i) => <Piece key={i} idx={i} location="bar" />)
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Fraction n="1" d="2" />
        <span
          style={{
            color: 'var(--ink-mute)',
            fontSize: 13,
            fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            letterSpacing: '0.12em',
          }}
        >
          ↓ &nbsp;HALF-SPACE BELOW
        </span>
      </div>

      <div
        data-testid="half-space"
        aria-label="Half-bar reference area"
        style={{
          padding: 12,
          background: correct
            ? 'rgba(95,216,151,0.08)'
            : 'rgba(91,140,255,0.04)',
          border: `2px dashed ${
            correct ? 'rgba(95,216,151,0.5)' : 'rgba(91,140,255,0.35)'
          }`,
          borderRadius: 18,
          minWidth: 200,
          minHeight: 108,
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all .3s ease',
        }}
      >
        {refPieces.length === 0 ? (
          <span
            style={{
              color: 'var(--ink-faint)',
              fontSize: 13,
              fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              letterSpacing: '0.1em',
            }}
          >
            TAP A PIECE ABOVE
          </span>
        ) : (
          refPieces.map((i) => <Piece key={i} idx={i} location="ref" />)
        )}
      </div>

      <Caption>
        {refPieces.length === 0 && 'Tap a quarter to place it on the half-space.'}
        {refPieces.length === 1 && 'One quarter sits there. Try another.'}
        {refPieces.length === 2 && 'Two quarters fit perfectly across the half-space.'}
        {refPieces.length === 3 && "That's more than a half — one piece is hanging over."}
        {refPieces.length === 4 && 'Four quarters cover the whole bar, not just a half.'}
      </Caption>
    </div>
  );
}
