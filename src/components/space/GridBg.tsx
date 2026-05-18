export type GridBgProps = {
  /** When true, uses the 56px grid (one-pager). Default is 48px (lesson). */
  readonly large?: boolean;
};

/**
 * Masked grid background — two crossed line gradients faded with a radial mask.
 * Sized via CSS class so the spacing is consistent across the app.
 */
export function GridBg({ large = false }: GridBgProps) {
  return <div className={`grid-bg${large ? ' lg' : ''}`} aria-hidden />;
}
