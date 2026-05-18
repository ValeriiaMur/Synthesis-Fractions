'use client';

import { useState } from 'react';
import { DemoFrame } from './DemoFrame';
import { OrderToggle } from './OrderToggle';
import { TrayItem, type TrayItemKind } from './TrayItem';

const TRAYS: Readonly<Record<1 | 2 | 3, readonly TrayItemKind[]>> = {
  1: ['½'],
  2: ['½', '¼', '¼', '¼', '¼'],
  3: ['½', '¼', '¼', '¼', '¼', 'pizza', 'paper'],
};

export function DemoPreparedEnvironment() {
  const [beat, setBeat] = useState<1 | 2 | 3>(1);

  return (
    <DemoFrame label="the tray, per beat">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[1, 2, 3].map((b) => (
          <OrderToggle
            key={b}
            label={`beat ${b}`}
            active={beat === b}
            onClick={() => setBeat(b as 1 | 2 | 3)}
          />
        ))}
      </div>
      <div
        style={{
          position: 'relative',
          padding: '22px 22px 18px',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
          border: '1px solid var(--line-strong)',
          borderRadius: 12,
          minHeight: 110,
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {TRAYS[beat].map((item, i) => (
          <TrayItem key={`${beat}-${i}-${item}`} item={item} delay={i * 60} />
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-mute)' }}>
        Only what the child needs right now sits on the tray.
      </div>
    </DemoFrame>
  );
}
