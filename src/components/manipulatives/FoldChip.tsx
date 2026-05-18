export type FoldChipProps = {
  readonly active: boolean;
  readonly label: string;
};

/**
 * Checkbox + caps text used as a step indicator below the PaperFold.
 */
export function FoldChip({ active, label }: FoldChipProps) {
  return (
    <div
      style={{
        padding: '6px 0',
        color: active ? 'var(--green)' : 'var(--ink-mute)',
        fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        transition: 'color .2s',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${active ? 'var(--green)' : 'var(--line-strong)'}`,
          color: active ? 'var(--green)' : 'transparent',
          borderRadius: 3,
          fontSize: 10,
        }}
      >
        {active ? '✓' : ''}
      </span>
      {label}
    </div>
  );
}
