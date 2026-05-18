import { shade } from './shade';

export type StudRowProps = {
  readonly color: string;
};

/**
 * Lego-style stud strip. Drawn with a radial gradient tile that repeats
 * horizontally, so a wider brick naturally gets more studs.
 */
export function StudRow({ color }: StudRowProps) {
  return (
    <div
      aria-hidden
      style={{
        height: 12,
        marginBottom: 2,
        backgroundImage: `radial-gradient(circle at 50% 60%, ${shade(color, 0.18)} 4.5px, ${shade(color, -0.15)} 5px, transparent 5.2px)`,
        backgroundSize: '16px 12px',
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'center top',
      }}
    />
  );
}
