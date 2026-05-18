'use client';

export type OrderToggleProps = {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
};

/**
 * Dashed-underline toggle button shared across most demos. The active variant
 * gets a solid blue underline and brighter text.
 */
export function OrderToggle({ label, active, onClick }: OrderToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 0,
        borderBottom: `1.5px solid ${active ? 'var(--blue)' : 'var(--line-strong)'}`,
        padding: '6px 12px',
        color: active ? 'var(--ink)' : 'var(--ink-mute)',
        fontSize: 13,
        fontWeight: 400,
        fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'all .2s',
      }}
    >
      {label}
    </button>
  );
}
