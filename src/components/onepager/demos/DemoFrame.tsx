import type { ReactNode } from 'react';

export type DemoFrameProps = {
  readonly label: string;
  readonly children: ReactNode;
};

/**
 * Shared card frame used by every principle demo. Subtle bg gradient, line
 * border, drop shadow, and a small tab-style monospace label clipped onto
 * the top-left corner.
 */
export function DemoFrame({ label, children }: DemoFrameProps) {
  return (
    <div
      style={{
        position: 'relative',
        padding: '26px 26px 22px',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.030), rgba(255,255,255,0.005))',
        border: '1px solid var(--line)',
        borderRadius: 22,
        boxShadow: '0 30px 80px -30px rgba(0,0,0,0.6)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -10,
          left: 22,
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          fontSize: 10,
          background: 'var(--bg-1)',
          padding: '2px 10px',
          letterSpacing: '0.14em',
          color: 'var(--ink-mute)',
          textTransform: 'uppercase',
          border: '1px solid var(--line)',
          borderRadius: 4,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
