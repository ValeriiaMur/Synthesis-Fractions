'use client';

import { useState, type CSSProperties } from 'react';

export type BlockStudioCelebrationProps = {
  readonly onReplay: () => void;
  readonly onClose: () => void;
};

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1200,
  pointerEvents: 'none',
  background:
    'radial-gradient(900px 600px at 50% 35%, rgba(91,140,255,0.10), transparent 65%)',
  backdropFilter: 'blur(2px)',
};

const card: CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 1300,
  maxWidth: 460,
  width: 'calc(100% - 32px)',
  padding: '32px 28px 26px',
  background:
    'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))',
  border: '1px solid var(--line-strong)',
  borderRadius: 22,
  boxShadow: '0 24px 60px -20px rgba(0,0,0,0.65)',
  animation: 'blockStudioCompletePop .55s cubic-bezier(0.3, 1.4, 0.5, 1) both',
  textAlign: 'center',
};

const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
  fontSize: 11,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--orange)',
  marginBottom: 12,
};

const title: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
  fontSize: 32,
  fontWeight: 500,
  letterSpacing: '-0.02em',
  color: 'var(--ink)',
  lineHeight: 1.1,
};

const body: CSSProperties = {
  marginTop: 14,
  fontSize: 14.5,
  color: 'var(--ink-soft)',
  lineHeight: 1.55,
  fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
};

const actions: CSSProperties = {
  marginTop: 22,
  display: 'flex',
  gap: 10,
  justifyContent: 'center',
  flexWrap: 'wrap',
};

function btnStyle(primary: boolean): CSSProperties {
  return {
    padding: '10px 18px',
    borderRadius: 10,
    fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
    fontSize: 11.5,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    background: primary ? 'var(--cta)' : 'rgba(255,255,255,0.05)',
    color: primary ? 'var(--cta-ink)' : 'var(--ink-soft)',
    border: primary ? '1px solid var(--cta)' : '1px solid var(--line-strong)',
  };
}

const confettiColors = [
  'var(--red)',
  'var(--orange)',
  'var(--blue)',
  'var(--green)',
  'var(--purple)',
  'var(--yellow)',
];

type ConfettiPiece = {
  readonly left: number;
  readonly dur: number;
  readonly delay: number;
  readonly color: string;
  readonly rot: number;
  readonly size: number;
};

function generateConfetti(): readonly ConfettiPiece[] {
  const out: ConfettiPiece[] = [];
  for (let i = 0; i < 80; i++) {
    out.push({
      left: Math.random() * 100,
      dur: 1.8 + Math.random() * 2.6,
      delay: Math.random() * 0.6,
      color: confettiColors[i % confettiColors.length],
      rot: Math.random() * 360,
      size: 8 + Math.random() * 10,
    });
  }
  return out;
}

export function BlockStudioCelebration({
  onReplay,
  onClose,
}: BlockStudioCelebrationProps) {
  // Pieces are generated once at mount via the lazy state initializer.
  // `useMemo([])` would be hit by `react-hooks/purity` because Math.random
  // is impure at render time; lazy initializers are exempt.
  const [pieces] = useState<readonly ConfettiPiece[]>(generateConfetti);

  return (
    <>
      <div style={overlay} aria-hidden="true">
        {pieces.map((p, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${p.left}%`,
              top: -20,
              width: p.size,
              height: p.size * 1.4,
              background: p.color,
              borderRadius: 2,
              transform: `rotate(${p.rot}deg)`,
              animation: `blockStudioConfettiFall ${p.dur}s cubic-bezier(0.2, 0.8, 0.4, 1) ${p.delay}s forwards`,
              opacity: 0.9,
            }}
          />
        ))}
      </div>
      <div style={card} role="dialog" aria-label="Lesson complete">
        <div style={eyebrow}>Lesson complete</div>
        <h1 style={title}>You built fractions.</h1>
        <p style={body}>
          You played with bricks, discovered{' '}
          <strong style={{ color: 'var(--ink)' }}>equivalence</strong> (same
          whole, different bricks), and solved three quests. The block studio is
          yours to keep exploring.
        </p>
        <div style={actions}>
          <button type="button" onClick={onClose} style={btnStyle(false)}>
            Keep playing
          </button>
          <button type="button" onClick={onReplay} style={btnStyle(true)}>
            Restart lesson
          </button>
        </div>
      </div>
    </>
  );
}
