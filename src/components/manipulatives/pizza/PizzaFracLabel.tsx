/**
 * Fraction label "n / d" stamped on a pizza slice. Heavy dark glyphs
 * with a thick white outline (paint-order: stroke) so they stay readable
 * over cheese, pepperoni, and crust alike. Pointer events off — the
 * underlying slice always gets the tap.
 */
export type PizzaFracLabelProps = {
  readonly x: number;
  readonly y: number;
  readonly n: number;
  readonly d: number;
};

export function PizzaFracLabel({ x, y, n, d }: PizzaFracLabelProps) {
  const stroke = {
    stroke: 'rgba(255,255,255,0.95)',
    strokeWidth: 4,
    paintOrder: 'stroke',
    strokeLinejoin: 'round' as const,
  };
  return (
    <g transform={`translate(${x} ${y})`} style={{ pointerEvents: 'none' }}>
      <text
        textAnchor="middle"
        y="-5"
        fontFamily="Work Sans"
        fontWeight={700}
        fontSize={22}
        fill="#26120a"
        style={stroke}
      >
        {n}
      </text>
      <line
        x1={-11}
        x2={11}
        y1={0}
        y2={0}
        stroke="#26120a"
        strokeWidth={2.5}
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.9))' }}
      />
      <text
        textAnchor="middle"
        y={22}
        fontFamily="Work Sans"
        fontWeight={700}
        fontSize={22}
        fill="#26120a"
        style={stroke}
      >
        {d}
      </text>
    </g>
  );
}
