import type { ReactNode } from 'react';

export type ChatMessageFrom = 'ari' | 'user' | 'system';

export type ChatMessageProps = {
  readonly from: ChatMessageFrom;
  readonly children: ReactNode;
};

/**
 * One chat row. Ari = blue-tint bubble, left-aligned with the cut bottom-left
 * corner; user = white-tint, right-aligned with cut bottom-right; system =
 * full-width caps line between hairline rules.
 */
export function ChatMessage({ from, children }: ChatMessageProps) {
  if (from === 'system') {
    return (
      <div className="chat-system">
        <span className="chat-system-line" />
        <span>{children}</span>
        <span className="chat-system-line" />
      </div>
    );
  }

  return (
    <div className={`chat-msg ${from}`}>
      {from === 'ari' && <div className="chat-msg-who">Ari</div>}
      <div>{children}</div>
    </div>
  );
}
