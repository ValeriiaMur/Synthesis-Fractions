export type FracInlineProps = {
  readonly n: number;
  readonly d: number;
};

/**
 * Compact inline n/d fraction — two stacked numerals with a thin bar.
 * Inherits `color` from the brick body so it tints automatically.
 */
export function FracInline({ n, d }: FracInlineProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        lineHeight: 0.95,
        fontVariantNumeric: 'tabular-nums',
      }}
      aria-label={`${n}/${d}`}
    >
      <span style={{ fontSize: '0.8em' }}>{n}</span>
      <span
        style={{
          width: '1em',
          height: 1.5,
          background: 'currentColor',
          margin: '1px 0',
        }}
      />
      <span style={{ fontSize: '0.8em' }}>{d}</span>
    </span>
  );
}
