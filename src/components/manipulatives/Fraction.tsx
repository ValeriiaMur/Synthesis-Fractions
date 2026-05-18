export type FractionProps = {
  readonly n: string;
  readonly d: string;
  readonly color?: string;
  readonly size?: number;
};

/**
 * Inline n/d fraction renderer with a typeset numerator + denominator stack.
 */
export function Fraction({
  n,
  d,
  color = 'var(--ink)',
  size = 40,
}: FractionProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        lineHeight: 1,
        color,
        fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
        fontWeight: 400,
        fontSize: size,
      }}
    >
      <span>{n}</span>
      <span
        style={{ width: '1.2em', height: 2, background: color, margin: '2px 0' }}
      />
      <span>{d}</span>
    </span>
  );
}
