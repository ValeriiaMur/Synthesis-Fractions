'use client';

import type { CSSProperties } from 'react';

export type BlockStudioStepIntroProps = {
  readonly eyebrow: string;
  readonly num: number | string;
  readonly title: string;
  readonly blurb: string;
  readonly goalText: string;
  readonly ready: boolean;
  /** Unique key — used by the parent via React `key` so a fresh mount
   *  re-runs the slide-in animation when stepIdx/questIdx changes. */
  readonly mountKey: string;
};

const card: CSSProperties = {
  position: 'relative',
  display: 'flex',
  gap: 16,
  alignItems: 'flex-start',
  padding: '16px 20px',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025))',
  border: '1px solid var(--line-strong)',
  borderRadius: 18,
  animation: 'blockStudioStepIn .4s cubic-bezier(0.3, 1.3, 0.5, 1) both',
};

const numBadge: CSSProperties = {
  flexShrink: 0,
  width: 44,
  height: 44,
  borderRadius: 14,
  display: 'grid',
  placeItems: 'center',
  background: 'linear-gradient(160deg, var(--ink), var(--ink-soft))',
  color: 'var(--bg-0)',
  fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
  fontSize: 18,
  fontWeight: 500,
};

const eyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
  fontSize: 9.5,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--ink-mute)',
  marginBottom: 6,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
  fontWeight: 500,
  fontSize: 18,
  letterSpacing: '-0.015em',
  color: 'var(--ink)',
  lineHeight: 1.25,
};

const blurbStyle: CSSProperties = {
  margin: '6px 0 10px',
  fontSize: 13,
  color: 'var(--ink-soft)',
  lineHeight: 1.55,
  fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
};

function statusPillStyle(ready: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 10px',
    borderRadius: 999,
    background: ready ? 'rgba(95,216,151,0.12)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${
      ready ? 'rgba(95,216,151,0.45)' : 'var(--line-strong)'
    }`,
    color: ready ? 'var(--green)' : 'var(--ink-mute)',
    fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
    fontSize: 10.5,
    letterSpacing: '0.04em',
  };
}

const dot: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: 999,
  background: 'currentColor',
};

export function BlockStudioStepIntro({
  eyebrow,
  num,
  title,
  blurb,
  goalText,
  ready,
  mountKey,
}: BlockStudioStepIntroProps) {
  return (
    <div key={mountKey} style={card}>
      <div style={numBadge}>{num}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={eyebrowStyle}>{eyebrow}</div>
        <h2 style={titleStyle}>{title}</h2>
        <p style={blurbStyle}>{blurb}</p>
        <div style={statusPillStyle(ready)}>
          <span style={dot} />
          <span>{goalText}</span>
        </div>
      </div>
    </div>
  );
}
