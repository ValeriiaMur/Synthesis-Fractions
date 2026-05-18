import type { ReactNode } from 'react';

export type CaptionProps = {
  readonly children: ReactNode;
};

/**
 * Small italic caption shared by all three manipulatives.
 */
export function Caption({ children }: CaptionProps) {
  return (
    <div
      style={{
        maxWidth: 360,
        textAlign: 'center',
        fontSize: 14,
        color: 'var(--ink-mute)',
        lineHeight: 1.5,
        fontStyle: 'italic',
        fontWeight: 300,
        minHeight: 22,
      }}
    >
      {children}
    </div>
  );
}
