export type WholeNumberProps = {
  readonly visible: boolean;
};

/**
 * The big "1" overlay shown only at folds === 0 (and only while not
 * mid-drag). Fades + scales out the moment the first fold begins so
 * the upcoming fraction takes over without crowding.
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
      <span>1</span>
    </div>
  );
}
