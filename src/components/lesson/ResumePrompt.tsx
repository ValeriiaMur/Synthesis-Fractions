'use client';

export type ResumePromptProps = {
  readonly studentName: string;
  readonly activeBeatNumber: number;
  readonly totalBeats: number;
  readonly onResume: () => void;
  readonly onStartOver: () => void;
};

/**
 * Centered card shown when a returning learner has a saved Spirit run.
 * One pair of buttons — Resume vs Start Over. Matches the cosmos palette
 * and the NamePrompt's geometry so the two reads as the same family.
 */
export function ResumePrompt({
  studentName,
  activeBeatNumber,
  totalBeats,
  onResume,
  onStartOver,
}: ResumePromptProps) {
  const padded = String(activeBeatNumber).padStart(2, '0');
  const total = String(totalBeats).padStart(2, '0');

  return (
    <div
      className="cosmos-bg"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '40px 24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          padding: '36px 32px 32px',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.030), rgba(255,255,255,0.005))',
          border: '1px solid var(--line)',
          borderRadius: 'var(--rad-card)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
            fontSize: 11,
            letterSpacing: '0.18em',
            color: 'var(--ink-mute)',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          ✦ spirit run in progress
        </div>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 200,
            margin: '0 0 12px',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          Welcome back,{' '}
          <span style={{ color: 'var(--blue)', fontWeight: 400 }}>
            {studentName}
          </span>
          .
        </h2>
        <p
          style={{
            color: 'var(--ink-soft)',
            fontSize: 16,
            margin: '0 0 28px',
            lineHeight: 1.55,
          }}
        >
          The Spirit is sitting where you left it — at stop{' '}
          <span style={{ color: 'var(--ink)' }}>{padded}</span> of{' '}
          <span style={{ color: 'var(--ink-mute)' }}>{total}</span>. Pick up
          the run, or wipe it and start a fresh trip.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={onResume}
            style={{
              height: 50,
              padding: '0 22px',
              background: 'var(--cta)',
              color: 'var(--cta-ink)',
              border: 0,
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 12px 32px -10px rgba(61,109,255,0.6)',
            }}
          >
            Resume the run →
          </button>
          <button
            type="button"
            onClick={onStartOver}
            style={{
              background: 'transparent',
              border: 0,
              color: 'var(--ink-mute)',
              fontFamily:
                'var(--font-work-sans), Work Sans, sans-serif',
              fontSize: 14,
              fontWeight: 300,
              cursor: 'pointer',
              borderBottom: '1px dashed var(--line-strong)',
              padding: '4px 0',
            }}
          >
            start over
          </button>
        </div>
      </div>
    </div>
  );
}
