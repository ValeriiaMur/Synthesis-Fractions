export type WholeNumberProps = {
  readonly visible: boolean;
};

/**
 * The "1" overlay shown only at folds === 0 (and only while not
 * mid-drag). Reuses the `.paper-frac` chip — the exact white-on-blue
 * style as the ½ / ¼ labels — so the whole and the fractions share one
 * source of truth. Fades + scales out the moment the first fold begins.
 */
export function WholeNumber({ visible }: WholeNumberProps) {
  return (
    <div
      className="paper-big-num"
      aria-hidden
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.6)',
      }}
    >
      <span className="paper-frac paper-frac--whole">1</span>
    </div>
  );
}
