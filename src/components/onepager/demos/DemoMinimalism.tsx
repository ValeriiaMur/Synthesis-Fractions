'use client';

import { useState } from 'react';
import { DemoFrame } from './DemoFrame';
import { OrderToggle } from './OrderToggle';

export function DemoMinimalism() {
  const [noisy, setNoisy] = useState(false);

  return (
    <DemoFrame label="what we strip out">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <OrderToggle
          label="our screen"
          active={!noisy}
          onClick={() => setNoisy(false)}
        />
        <OrderToggle
          label="the usual screen"
          active={noisy}
          onClick={() => setNoisy(true)}
        />
      </div>
      <div
        style={{
          padding: 22,
          background: noisy
            ? 'linear-gradient(135deg, #ff5577, #ffa500, #ffd86b)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))',
          border: '1px solid var(--line)',
          borderRadius: 14,
          minHeight: 160,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 10,
          transition: 'all .35s',
          color: noisy ? '#1a1a1a' : 'var(--ink)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {noisy && (
          <>
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 10,
                background: '#fff',
                color: '#d33',
                fontWeight: 600,
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 4,
                animation: 'wobble 1s ease-in-out infinite',
              }}
            >
              🔥 STREAK 7
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 10,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              ⭐ 250 XP &nbsp; 🏆 LEVEL 4 &nbsp; 💎 12 GEMS
            </div>
          </>
        )}
        <div
          style={{
            fontWeight: noisy ? 700 : 300,
            fontSize: noisy ? 22 : 18,
          }}
        >
          {noisy ? 'ANSWER NOW! 🚀' : 'How many quarters covered the half-space?'}
        </div>
        <div
          style={{
            fontSize: 13,
            color: noisy ? '#222' : 'var(--ink-mute)',
          }}
        >
          {noisy ? '⏱️ 00:08 — BEAT THE CLOCK!' : 'no clock. no streaks. no rush.'}
        </div>
      </div>
      <style>{`@keyframes wobble { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }`}</style>
    </DemoFrame>
  );
}
