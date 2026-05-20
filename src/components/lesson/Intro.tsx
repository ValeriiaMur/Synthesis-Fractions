/**
 * Minimal header above the first cell. Phase 1 of the Montessori rebuild
 * strips the cosmos delivery narrative — the prompt does the work.
 */
export function Intro() {
  return (
    <div style={{ paddingBottom: 12, paddingTop: 6 }}>
      <h1
        style={{
          fontSize: 'clamp(34px, 5.2vw, 56px)',
          fontWeight: 200,
          margin: '10px 0 8px',
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}
      >
        fractions
      </h1>
    </div>
  );
}
