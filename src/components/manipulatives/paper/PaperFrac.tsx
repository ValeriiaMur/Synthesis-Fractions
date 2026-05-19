export type PaperFracProps = {
  readonly n: string | number;
  readonly d: string | number;
  /** If true, renders the large hero-sized fraction (clamp 64 → 110px).
   *  Otherwise renders the small mirror size (clamp 32 → 56px). */
  readonly big?: boolean;
};

/**
 * Inline stacked fraction rendered as <span> + <span> (bar) + <span>.
 * Sized via clamp() so it scales with the workspace. Used on each
 * folded quadrant of the paper.
 */
export function PaperFrac({ n, d, big = false }: PaperFracProps) {
  const fs = big ? 'clamp(64px, 9vmin, 110px)' : 'clamp(32px, 5vmin, 56px)';
  return (
    <span
      className="paper-frac"
      style={{ fontSize: fs, color: big ? '#1a0f04' : '#2a1d0d' }}
    >
      <span>{n}</span>
      <span />
      <span>{d}</span>
    </span>
  );
}
