export type OutroProps = {
  readonly done: boolean;
};

/**
 * Closing block. Phase 1 stub — Phase 2 will add the real off-ramp card
 * ("find something at home you can split in half"). For now, a quiet
 * placeholder so the lesson has a visible "you finished" cue without any
 * praise or badges (Montessori principle: description, not reward).
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
        — keep tapping above —
      </div>
    );
  }
  return (
    <div
      style={{
        marginTop: 48,
        padding: '8px 30px 56px',
        textAlign: 'center',
        color: 'var(--ink-soft)',
        fontSize: 16,
        fontWeight: 300,
      }}
    >
      Done.
    </div>
  );
}
