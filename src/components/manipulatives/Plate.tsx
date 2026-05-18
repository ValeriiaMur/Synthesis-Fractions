import type { ReactNode } from 'react';

export type PlateProps = {
  readonly children?: ReactNode;
};

/**
 * The "one whole" reference plate — a 28px-tall dashed track that the
 * FractionBox fills as bars are dropped in.
 */
export function Plate({ children }: PlateProps) {
  return (
    <div
      style={{
        position: 'relative',
        height: 28,
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid var(--line-strong)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
