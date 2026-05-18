export type OutroProps = {
  readonly done: boolean;
};

/**
 * Closing card. While the trip is in progress, a quiet caption nudges the
 * pilot forward. When all six cells are done, the warp-drive lights up and
 * we celebrate ½ = ²⁄₄ — same amount, told four different ways.
 */
export function Outro({ done }: OutroProps) {
  if (!done) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px 0 20px',
          color: 'var(--ink-faint)',
          fontSize: 13,
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        — finish the stops above —
      </div>
    );
  }
  return (
    <div
      style={{
        marginTop: 8,
        padding: '32px 30px',
        borderRadius: 22,
        background:
          'linear-gradient(135deg, rgba(95,216,151,0.10), rgba(91,140,255,0.10))',
        border: '1px solid rgba(95,216,151,0.3)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          fontSize: 11,
          letterSpacing: '0.14em',
          color: 'var(--green)',
          textTransform: 'uppercase',
        }}
      >
        ✦ warp-drive online · skiff homeward
      </div>
      <div style={{ fontSize: 32, fontWeight: 300, margin: '10px 0 6px' }}>
        <span style={{ color: 'var(--red)' }}>½</span>
        <span style={{ margin: '0 14px', color: 'var(--ink-mute)' }}>=</span>
        <span style={{ color: 'var(--blue)' }}>²⁄₄</span>
      </div>
      <div
        style={{
          color: 'var(--ink-soft)',
          fontSize: 16,
          fontWeight: 300,
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        Same amount — told four different ways: a ration bar, a moon-pizza, a
        folded star-map, a row of bricks. The lock knew them all. Equivalent
        fractions are just one amount with more than one name.
      </div>
    </div>
  );
}
