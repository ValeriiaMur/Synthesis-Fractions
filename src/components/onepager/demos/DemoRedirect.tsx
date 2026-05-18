'use client';

import { useState } from 'react';
import { DemoFrame } from './DemoFrame';
import { OrderToggle } from './OrderToggle';

type Mode = 'reprimand' | 'redirect';

type Response = {
  readonly tag: string;
  readonly color: string;
  readonly text: string;
};

const RESPONSES: Readonly<Record<Mode, Response>> = {
  reprimand: {
    tag: 'wrong',
    color: 'var(--red)',
    text: "That's not right. Try again.",
  },
  redirect: {
    tag: 'redirect',
    color: 'var(--green)',
    text: "Let's look at the blocks. What if you stack two quarters on the half-space?",
  },
};

export function DemoRedirect() {
  const [mode, setMode] = useState<Mode>('redirect');
  const r = RESPONSES[mode];

  return (
    <DemoFrame label="when a child picks wrong">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <OrderToggle
          label="reprimand"
          active={mode === 'reprimand'}
          onClick={() => setMode('reprimand')}
        />
        <OrderToggle
          label="redirect"
          active={mode === 'redirect'}
          onClick={() => setMode('redirect')}
        />
      </div>
      <div
        style={{
          padding: 18,
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${r.color}`,
          borderLeftWidth: 3,
          borderRadius: 12,
          fontSize: 16,
          lineHeight: 1.5,
          color: 'var(--ink)',
          transition: 'border-color .25s',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.14em',
            color: r.color,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          ↳ {r.tag}
        </div>
        <div>{r.text}</div>
      </div>
      <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-mute)' }}>
        Every hint points back to the material — never away from it.
      </div>
    </DemoFrame>
  );
}
