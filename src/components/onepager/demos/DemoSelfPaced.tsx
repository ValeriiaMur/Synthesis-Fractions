'use client';

import { useState } from 'react';
import { DemoFrame } from './DemoFrame';
import { FauxCell } from './FauxCell';

export function DemoSelfPaced() {
  const [done1, setDone1] = useState(false);

  return (
    <DemoFrame label="the lesson waits">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <FauxCell
          n="01"
          status={done1 ? 'done' : 'active'}
          label="manipulative — chocolate bar"
        />
        <FauxCell
          n="02"
          status={done1 ? 'active' : 'locked'}
          label="check — recall"
        />
        <FauxCell n="03" status="locked" label="manipulative — pizza" />
        <FauxCell n="…" status="locked" label="and so on" />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 14,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--ink-mute)' }}>
          {done1
            ? 'Cell 01 is done. 02 is open.'
            : 'Cell 01 is open. 02 stays closed.'}
        </span>
        <button
          type="button"
          onClick={() => setDone1((x) => !x)}
          style={{
            border: '1px solid var(--line-strong)',
            background: 'transparent',
            color: 'var(--ink)',
            padding: '8px 14px',
            borderRadius: 10,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {done1 ? 'rewind' : 'complete cell 01'}
        </button>
      </div>
    </DemoFrame>
  );
}
