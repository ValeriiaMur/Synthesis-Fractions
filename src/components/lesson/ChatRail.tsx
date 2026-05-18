'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { ChatMessage, type ChatMessageFrom } from './ChatMessage';
import { TypingDots } from './TypingDots';
import { QuickReply } from './QuickReply';
import { IconSend } from './IconSend';

export type ChatMsg = {
  readonly from: ChatMessageFrom;
  readonly text: string;
};

export type ChatRailProps = {
  readonly chat: readonly ChatMsg[];
  readonly thinking: boolean;
  readonly studentName: string;
  readonly activeIdx: number;
  readonly totalBeats: number;
  readonly quickReplies: readonly string[];
  readonly onSend: (text: string) => void;
  readonly onQuickReply: (text: string) => void;
};

/**
 * Left-side chat rail. Holds Ari's header, the scrolling log, the dashed
 * preset replies, and the input row.
 */
export function ChatRail({
  chat,
  thinking,
  studentName,
  activeIdx,
  totalBeats,
  quickReplies,
  onSend,
  onQuickReply,
}: ChatRailProps) {
  const [draft, setDraft] = useState('');
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.length, thinking]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  const handleKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <aside className="chat">
      <div className="chat-head">
        <div className="ari-avatar" aria-hidden>
          <span className="ari-glyph">✦</span>
        </div>
        <div style={{ flex: 1 }}>
          <div className="title">Ari</div>
          <div className="sub">here to think with you</div>
        </div>
        <div className="chat-step" aria-label="Step counter">
          <span className="chat-step-num">
            {String(activeIdx + 1).padStart(2, '0')}
          </span>
          <span className="chat-step-of">
            /{String(totalBeats).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="chat-log" ref={logRef}>
        {chat.map((m, i) => (
          <ChatMessage key={i} from={m.from}>
            {m.text}
          </ChatMessage>
        ))}
        {thinking && (
          <div className="chat-msg ari">
            <div className="chat-msg-who">Ari</div>
            <TypingDots />
          </div>
        )}
      </div>

      <div className="chat-quickreplies">
        {quickReplies.map((q) => (
          <QuickReply key={q} label={q} onClick={onQuickReply} />
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder={`type a thought, ${studentName.toLowerCase()}…`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          aria-label="Send a message to Ari"
        />
        <button
          type="button"
          className="send-btn"
          onClick={handleSend}
          aria-label="Send"
        >
          <IconSend />
        </button>
      </div>
    </aside>
  );
}
