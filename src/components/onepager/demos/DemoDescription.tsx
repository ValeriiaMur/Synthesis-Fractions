'use client';

import { useState } from 'react';
import { DemoFrame } from './DemoFrame';
import { OrderToggle } from './OrderToggle';

type Mode = 'praise' | 'description';

type Response = {
  readonly tag: string;
  readonly color: string;
  readonly text: string;
  readonly note: string;
};

const RESPONSES: Readonly<Record<Mode, Response>> = {
  praise: {
    tag: 'evaluative',
    color: 'var(--red)',
    text: "Great job! 🎉 You're so smart!",
    note: 'Adult-shaped. Stops the child from thinking.',
  },
  description: {
    tag: 'observational',
    color: 'var(--green)',
    text: 'You put two quarter-pieces together. They covered the same space as one half.',
    note: 'Mirrors what the child did. Invites them to keep noticing.',
  },
};

export function DemoDescription() {
  const [mode, setMode] = useState<Mode>('description');
  const r = RESPONSES[mode];

  return (
    <DemoFrame label="how Ari responds">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <OrderToggle
          label="praise"
          active={mode === 'praise'}
          onClick={() => setMode('praise')}
        />
        <OrderToggle
          label="description"
          active={mode === 'description'}
          onClick={() => setMode('description')}
        />
      </div>
      <div
        style={{
          padding: 18,
          background: 'rgba(91,140,255,0.06)',
          border: `1px solid ${r.color}`,
          borderLeftWidth: 3,
          borderRadius: 12,
          fontSize: 17,
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
        {r.note}
      </div>
    </DemoFrame>
  );
}
