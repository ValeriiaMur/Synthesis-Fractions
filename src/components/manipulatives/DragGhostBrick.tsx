import { FracInline } from './FracInline';
import { StudRow } from './StudRow';
import { shade } from './shade';

export type DragGhostBrickProps = {
  readonly num: number;
  readonly den: number;
  readonly color: string;
};

/**
 * Non-interactive brick used as the floating ghost during a drag. Same
 * visual as `LegoBrick`, but lays inside a fixed-position wrapper so it
 * follows the pointer.
 */
export function DragGhostBrick({ num, den, color }: DragGhostBrickProps) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <StudRow color={color} />
      <div
        style={{
          height: 'calc(100% - 14px)',
          background: `linear-gradient(180deg, ${color} 0%, ${shade(color, -0.14)} 100%)`,
          borderRadius: '3px 3px 5px 5px',
          boxShadow:
            'inset 0 -5px 0 rgba(0,0,0,0.22), inset 0 3px 0 rgba(255,255,255,0.22), inset -2px 0 0 rgba(0,0,0,0.15), inset 2px 0 0 rgba(255,255,255,0.10)',
          border: '1px solid rgba(0,0,0,0.30)',
          display: 'grid',
          placeItems: 'center',
          color: 'rgba(0,0,0,0.78)',
          fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        <FracInline n={num} d={den} />
      </div>
    </div>
  );
}
