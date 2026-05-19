'use client';

import type { CSSProperties } from 'react';
import type { Toast } from './types';

export type BlockStudioToastProps = {
  readonly toast: Toast;
};

const wrap: CSSProperties = {
  position: 'fixed',
  left: '50%',
  bottom: 28,
  transform: 'translateX(-50%)',
  zIndex: 1100,
  pointerEvents: 'none',
};

export function BlockStudioToast({ toast }: BlockStudioToastProps) {
  const isGood = toast.kind === 'good';
  return (
    <div style={wrap}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderRadius: 999,
          background: isGood ? 'var(--green)' : 'var(--ink)',
          color: isGood ? '#082216' : 'var(--bg-0)',
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          fontSize: 11,
          letterSpacing: '0.06em',
          boxShadow: '0 12px 28px -10px rgba(0,0,0,0.6)',
          animation: 'blockStudioToastIn .25s ease-out',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {isGood && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7.5L5.5 11L12 3.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {toast.msg}
      </div>
    </div>
  );
}
