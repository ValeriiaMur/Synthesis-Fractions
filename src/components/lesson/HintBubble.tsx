import type { ReactNode } from 'react';

export type HintBubbleProps = {
  readonly children: ReactNode;
};

/**
 * Yellow-tinted hint bubble shown after a wrong MC answer.
 */
export function HintBubble({ children }: HintBubbleProps) {
  return (
    <div className="hint-bubble">
      <span style={{ fontSize: 18, lineHeight: 1 }}>💡</span>
      <span>
        <strong style={{ fontWeight: 500, color: 'var(--yellow)' }}>
          Ari:
        </strong>{' '}
        {children}
      </span>
    </div>
  );
}
