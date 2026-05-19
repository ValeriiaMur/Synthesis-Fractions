import { useToppings } from './toppings';
import { PizzaSlice } from './PizzaSlice';

export type PizzaProps = {
  readonly count: number;
  readonly extendedSet: ReadonlySet<number>;
  readonly onTapSlice: (index: number) => void;
  readonly disabled?: boolean;
};

/**
 * The pizza SVG. Renders shared <defs> (cheese, sauce, crust, pepperoni,
 * gloss gradients) once and then maps `count` slices over them. Slice
 * geometry + topping placement lives in {@link PizzaSlice} and
 * {@link useToppings}.
 */
export function Pizza({
  count,
  extendedSet,
  onTapSlice,
  disabled = false,
}: PizzaProps) {
  const toppings = useToppings(count);
  return (
    <svg
      role="img"
      aria-label="Pizza"
      viewBox="0 0 500 500"
      className="pizza-svg"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="pizza-cheese-base" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#fde0a3" />
          <stop offset="55%" stopColor="#f1c87a" />
          <stop offset="100%" stopColor="#c98c46" />
        </radialGradient>
        <radialGradient id="pizza-cheese-blob" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#ffeac0" />
          <stop offset="100%" stopColor="#f3c577" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="pizza-sauce-tint" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#b53a2c" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7d2316" stopOpacity="0.15" />
        </radialGradient>

        <radialGradient id="pizza-crust" cx="50%" cy="50%" r="55%">
          <stop offset="80%" stopColor="#d8a05c" />
          <stop offset="92%" stopColor="#bf7d34" />
          <stop offset="100%" stopColor="#7a4818" />
        </radialGradient>
        <radialGradient id="pizza-crust-shade" cx="50%" cy="50%" r="55%">
          <stop offset="85%" stopColor="transparent" />
          <stop offset="100%" stopColor="#4a2a0e" />
        </radialGradient>

        <radialGradient id="pizza-pep-base" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#d65148" />
          <stop offset="60%" stopColor="#b1342c" />
          <stop offset="100%" stopColor="#7a1f18" />
        </radialGradient>
        <radialGradient id="pizza-pep-curl" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="transparent" />
          <stop offset="100%" stopColor="#4a1009" />
        </radialGradient>

        <radialGradient id="pizza-gloss" cx="40%" cy="30%" r="35%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {Array.from({ length: count }, (_, i) => (
        <PizzaSlice
          key={i}
          index={i}
          total={count}
          extended={extendedSet.has(i)}
          toppings={toppings}
          onTap={() => onTapSlice(i)}
          disabled={disabled}
        />
      ))}
    </svg>
  );
}
