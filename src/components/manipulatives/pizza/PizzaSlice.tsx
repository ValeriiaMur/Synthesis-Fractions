import type { Toppings } from './toppings';
import { PizzaFracLabel } from './PizzaFracLabel';

export type PizzaSliceProps = {
  readonly index: number;
  readonly total: number;
  readonly extended: boolean;
  readonly toppings: Toppings;
  readonly onTap: () => void;
  readonly disabled?: boolean;
};

/**
 * One pizza wedge — wedge fill + crust ring + clipped toppings + a
 * fraction label, all wrapped in a <g> that translates outward along
 * the wedge's midpoint angle when `extended` is true (CSS transition).
 *
 * Toppings are filtered to those whose centers fall inside this wedge
 * (`inWedge`) so they ride along when the slice is pulled out.
 */
export function PizzaSlice({
  index,
  total,
  extended,
  toppings,
  onTap,
  disabled = false,
}: PizzaSliceProps) {
  const angle = (Math.PI * 2) / total;
  const start = -Math.PI / 2 + angle * index - angle / 2;
  const end = start + angle;

  const cx = 250;
  const cy = 250;
  const rOuter = 230;
  const rCrustInner = 200;
  const labelR = total >= 8 ? 160 : 150;

  const p0x = cx;
  const p0y = cy;
  const p1x = cx + Math.cos(start) * rOuter;
  const p1y = cy + Math.sin(start) * rOuter;
  const p2x = cx + Math.cos(end) * rOuter;
  const p2y = cy + Math.sin(end) * rOuter;
  const largeArc = angle > Math.PI ? 1 : 0;
  const wedgePath =
    `M ${p0x} ${p0y} L ${p1x} ${p1y} ` +
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2x} ${p2y} Z`;

  const ci1x = cx + Math.cos(start) * rCrustInner;
  const ci1y = cy + Math.sin(start) * rCrustInner;
  const ci2x = cx + Math.cos(end) * rCrustInner;
  const ci2y = cy + Math.sin(end) * rCrustInner;
  const crustPath =
    `M ${p1x} ${p1y} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2x} ${p2y} ` +
    `L ${ci2x} ${ci2y} A ${rCrustInner} ${rCrustInner} 0 ${largeArc} 0 ${ci1x} ${ci1y} Z`;

  const mid = (start + end) / 2;
  const dist = extended ? 60 : 0;
  const dx = Math.cos(mid) * dist;
  const dy = Math.sin(mid) * dist;
  const sliceId = `slice-clip-${index}-${total}`;

  const TAU = Math.PI * 2;
  const inWedge = (px: number, py: number): boolean => {
    const a = Math.atan2(py - cy, px - cx);
    const s = ((start % TAU) + TAU * 2) % TAU;
    const aa = ((a % TAU) + TAU * 2) % TAU;
    let diff = aa - s;
    if (diff < 0) diff += TAU;
    return diff < angle;
  };

  const peppHere = toppings.pepperoni.filter((t) => inWedge(t.x, t.y));
  const basilHere = toppings.basil.filter((t) => inWedge(t.x, t.y));
  const charHere = toppings.charSpots.filter((t) => inWedge(t.x, t.y));
  const cheeseHere = toppings.cheeseBlobs.filter((t) => inWedge(t.x, t.y));

  const fx = cx + Math.cos(mid) * labelR;
  const fy = cy + Math.sin(mid) * labelR;

  return (
    <g
      className="pizza-slice-group"
      style={{ transform: `translate(${dx}px, ${dy}px)` }}
      onClick={disabled ? undefined : onTap}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Slice ${index + 1} of ${total} — ${extended ? 'tap to push back' : 'tap to pull out'}`}
      aria-pressed={extended}
      onKeyDown={
        disabled
          ? undefined
          : (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTap();
              }
            }
      }
    >
      <defs>
        <clipPath id={sliceId}>
          <path d={wedgePath} />
        </clipPath>
      </defs>

      <path
        className="pizza-slice-shadow"
        d={wedgePath}
        fill="rgba(0,0,0,0.35)"
        transform="translate(2, 6)"
        style={{
          opacity: extended ? 1 : 0,
          transition: 'opacity .3s',
          pointerEvents: 'none',
        }}
      />

      <path d={wedgePath} fill="url(#pizza-cheese-base)" />
      <path d={wedgePath} fill="url(#pizza-sauce-tint)" opacity="0.55" />

      <g clipPath={`url(#${sliceId})`}>
        {cheeseHere.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={c.size}
            fill="url(#pizza-cheese-blob)"
            opacity={c.opacity}
          />
        ))}
      </g>

      <path d={crustPath} fill="url(#pizza-crust)" />
      <path d={crustPath} fill="url(#pizza-crust-shade)" opacity="0.65" />

      <g clipPath={`url(#${sliceId})`}>
        {charHere.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={c.size}
            fill={c.dark ? '#3a1e0d' : '#7b4a1f'}
            opacity={c.dark ? 0.75 : 0.45}
          />
        ))}
      </g>

      <g clipPath={`url(#${sliceId})`}>
        {peppHere.map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.rot})`}>
            <circle r={p.size} fill="url(#pizza-pep-base)" />
            <circle r={p.size * 0.85} fill="url(#pizza-pep-curl)" opacity="0.55" />
            <circle
              cx={p.size * 0.3}
              cy={-p.size * 0.2}
              r={p.size * 0.12}
              fill="#5a1a0f"
              opacity="0.85"
            />
            <circle
              cx={-p.size * 0.25}
              cy={p.size * 0.3}
              r={p.size * 0.1}
              fill="#5a1a0f"
              opacity="0.85"
            />
            <circle
              cx={p.size * 0.05}
              cy={p.size * 0.35}
              r={p.size * 0.08}
              fill="#5a1a0f"
              opacity="0.75"
            />
          </g>
        ))}
      </g>

      <g clipPath={`url(#${sliceId})`}>
        {basilHere.map((b, i) => (
          <g key={i} transform={`translate(${b.x} ${b.y}) rotate(${b.rot})`}>
            <path d="M0 -8 Q5 -2 0 8 Q-5 -2 0 -8 Z" fill="#2e6b29" />
            <path d="M0 -8 L0 8" stroke="#1e4a1c" strokeWidth={0.5} />
          </g>
        ))}
      </g>

      <path
        d={wedgePath}
        fill="url(#pizza-gloss)"
        opacity="0.5"
        style={{ mixBlendMode: 'screen' }}
      />

      <path
        d={`M ${p0x} ${p0y} L ${p1x} ${p1y}`}
        stroke="rgba(0,0,0,0.18)"
        strokeWidth={1.5}
        fill="none"
        opacity={extended ? 0 : 0.6}
        style={{ transition: 'opacity .3s' }}
      />

      <PizzaFracLabel x={fx} y={fy} n={1} d={total} />
    </g>
  );
}
