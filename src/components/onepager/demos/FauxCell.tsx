export type FauxCellStatus = 'done' | 'active' | 'locked';

export type FauxCellProps = {
  readonly n: string;
  readonly status: FauxCellStatus;
  readonly label: string;
};

/**
 * Stripped-down lesson cell — gutter number, label, status pill — used inside
 * the Self-Paced principle demo.
 */
export function FauxCell({ n, status, label }: FauxCellProps) {
  const color =
    status === 'done'
      ? 'var(--green)'
      : status === 'active'
        ? 'var(--blue)'
        : 'var(--ink-faint)';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr auto',
        gap: 14,
        alignItems: 'center',
        padding: '10px 14px',
        background:
          status === 'locked' ? 'transparent' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${status === 'locked' ? 'var(--line)' : 'var(--line-strong)'}`,
        borderRadius: 10,
        opacity: status === 'locked' ? 0.55 : 1,
        transition: 'all .3s',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
          fontWeight: 200,
          fontSize: 20,
          color,
        }}
      >
        {n}
      </span>
      <span
        style={{
          fontSize: 13.5,
          color: status === 'locked' ? 'var(--ink-mute)' : 'var(--ink)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          fontSize: 10,
          color,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {status}
      </span>
    </div>
  );
}
