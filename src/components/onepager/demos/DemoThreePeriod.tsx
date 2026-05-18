'use client';

import { useState } from 'react';
import { DemoFrame } from './DemoFrame';

type Period = {
  readonly n: 1 | 2 | 3;
  readonly label: string;
  readonly quote: string;
  readonly color: string;
};

const PERIODS: readonly Period[] = [
  {
    n: 1,
    label: 'introduce',
    quote: '"This is one half."',
    color: 'var(--red)',
  },
  {
    n: 2,
    label: 'recognize',
    quote: '"Can you show me one half?"',
    color: 'var(--blue)',
  },
  {
    n: 3,
    label: 'recall',
    quote: '"What did you just make?"',
    color: 'var(--green)',
  },
];

export function DemoThreePeriod() {
  const [p, setP] = useState<1 | 2 | 3>(1);
  const active = PERIODS.find((pp) => pp.n === p) ?? PERIODS[0];

  return (
    <DemoFrame label="three-period lesson">
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        {PERIODS.map((pp) => (
          <button
            key={pp.n}
            type="button"
            onClick={() => setP(pp.n)}
            style={{
              flex: 1,
              padding: '14px 12px',
              background:
                p === pp.n ? 'rgba(255,255,255,0.04)' : 'transparent',
              border: `1px solid ${
                p === pp.n ? 'var(--line-strong)' : 'var(--line)'
              }`,
              borderTop: `2px solid ${p === pp.n ? pp.color : 'var(--line)'}`,
              borderRadius: 10,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all .2s',
            }}
          >
            <div
              style={{
                fontFamily:
                  'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                fontSize: 11,
                color: pp.color,
                letterSpacing: '0.1em',
              }}
            >
              P{pp.n}
            </div>
            <div
              style={{
                fontSize: 14,
                color: p === pp.n ? 'var(--ink)' : 'var(--ink-mute)',
                marginTop: 4,
              }}
            >
              {pp.label}
            </div>
          </button>
        ))}
      </div>
      <div
        style={{
          padding: '18px 20px',
          background: 'rgba(91,140,255,0.06)',
          border: '1px solid rgba(91,140,255,0.18)',
          borderRadius: 12,
          fontSize: 17,
          color: 'var(--ink)',
          fontStyle: 'italic',
          minHeight: 60,
        }}
      >
        {active.quote}
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: 13,
          color: 'var(--ink-mute)',
          textAlign: 'center',
        }}
      >
        Period 3 is your MC. Periods 1 + 2 are the manipulatives that come before it.
      </div>
    </DemoFrame>
  );
}
