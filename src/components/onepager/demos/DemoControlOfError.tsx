'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import { DemoFrame } from './DemoFrame';

const stepBtn: CSSProperties = {
  width: 34,
  height: 34,
  border: '1px solid var(--line-strong)',
  background: 'transparent',
  color: 'var(--ink)',
  borderRadius: 8,
  fontSize: 18,
  cursor: 'pointer',
};

export function DemoControlOfError() {
  const [n, setN] = useState(2);
  const verdict =
    n === 2 ? 'fits' : n < 2 ? 'less than half' : 'more than half';
  const color = n === 2 ? 'var(--green)' : 'var(--red)';
  const boundaryHidden = n === 3 || n === 4;

  return (
    <DemoFrame label="self-correcting material">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setN((x) => Math.max(0, x - 1))}
            style={stepBtn}
            aria-label="Remove a quarter"
          >
            −
          </button>
          <span
            style={{
              fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              fontSize: 11,
              color: 'var(--ink-mute)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            place {n} quarter{n === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={() => setN((x) => Math.min(4, x + 1))}
            style={stepBtn}
            aria-label="Add a quarter"
          >
            +
          </button>
        </div>
        <div
          style={{
            padding: 10,
            background:
              n === 2 ? 'rgba(95,216,151,0.10)' : 'rgba(255,255,255,0.03)',
            border: `2px dashed ${
              n === 2 ? 'rgba(95,216,151,0.5)' : 'rgba(91,140,255,0.35)'
            }`,
            borderRadius: 12,
            minWidth: 220,
            minHeight: 70,
            display: 'flex',
            gap: 4,
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all .3s',
            position: 'relative',
          }}
        >
          {Array.from({ length: n }, (_, i) => (
            <div
              key={i}
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background:
                  'linear-gradient(135deg, #6e3a1c 0%, #8a4622 30%, #5d2f17 100%)',
                boxShadow:
                  'inset 0 2px 0 rgba(255,255,255,0.06), inset 0 -2px 0 rgba(0,0,0,0.35)',
                animation: 'popin .3s ease',
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              top: -1,
              bottom: -1,
              left: '50%',
              width: 1,
              background: 'rgba(91,140,255,0.4)',
              display: boundaryHidden ? 'none' : 'block',
            }}
          />
        </div>
        <div
          style={{
            fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            fontSize: 11,
            letterSpacing: '0.14em',
            color,
            textTransform: 'uppercase',
          }}
        >
          ↳ {verdict}
        </div>
        <div
          style={{
            fontSize: 13,
            fontStyle: 'italic',
            color: 'var(--ink-mute)',
            textAlign: 'center',
            maxWidth: 320,
          }}
        >
          The material itself shows when it&rsquo;s right. No adult has to say so.
        </div>
      </div>
    </DemoFrame>
  );
}
