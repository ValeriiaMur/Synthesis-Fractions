import type { ReactNode } from 'react';

export type CelebrationBubbleProps = {
  readonly children: ReactNode;
};

/**
 * Green-tinted celebration bubble shown after a correct MC answer.
 * Observational, never effusive — matches the "description, not praise" principle.
 */
export function CelebrationBubble({ children }: CelebrationBubbleProps) {
  return (
    <div className="celebration-bubble">
      <span style={{ fontSize: 18, lineHeight: 1 }}>✦</span>
      <span>
        <strong style={{ fontWeight: 500, color: 'var(--green)' }}>
          Ari:
        </strong>{' '}
        {children}
      </span>
    </div>
  );
}
