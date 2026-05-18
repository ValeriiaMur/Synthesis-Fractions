export type IntroProps = {
  readonly studentName: string;
};

/**
 * Header above the first cell — sets up the cosmos delivery-run story.
 * Two named characters: the student (pilot) and Ari (co-pilot AI).
 */
export function Intro({ studentName }: IntroProps) {
  return (
    <div style={{ paddingBottom: 12, paddingTop: 6 }}>
      <div
        style={{
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          fontSize: 11,
          letterSpacing: '0.14em',
          color: 'var(--ink-mute)',
          textTransform: 'uppercase',
        }}
      >
        mission · grade 3 · ~6 min
      </div>
      <h1
        style={{
          fontSize: 56,
          fontWeight: 200,
          margin: '10px 0 8px',
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}
      >
        the <span style={{ color: 'var(--red)', fontWeight: 400 }}>Skiff</span>{' '}
        run.
        <br />
        same amount,{' '}
        <span style={{ color: 'var(--blue)', fontWeight: 400 }}>
          different pieces
        </span>
        .
      </h1>
      <p
        style={{
          maxWidth: 540,
          fontSize: 18,
          color: 'var(--ink-soft)',
          fontWeight: 300,
          margin: '8px 0 0',
        }}
      >
        Hi, {studentName}. You&rsquo;re flying a small ship today — the{' '}
        <em style={{ fontStyle: 'normal', color: 'var(--ink)' }}>Skiff</em> —
        on a delivery to a moon outpost. Four stops, one trip home. At every
        stop something needs to be split fairly: a snack, a pizza, a star-map,
        a warp-drive lock. By the end, you&rsquo;ll see how{' '}
        <span style={{ color: 'var(--green)' }}>½</span> and{' '}
        <span style={{ color: 'var(--green)' }}>²⁄₄</span> are the same amount,
        told different ways.
      </p>
    </div>
  );
}
