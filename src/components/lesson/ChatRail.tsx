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
  /** True while Ari is generating a reply (covers SSE warm-up + streaming). */
  readonly thinking: boolean;
  /** Live token-accumulating text for the in-flight Ari bubble, or null
   *  when no reply is streaming. Empty string is shown as TypingDots. */
  readonly streamingText: string | null;
  readonly studentName: string;
  readonly activeIdx: number;
  readonly totalBeats: number;
  readonly quickReplies: readonly string[];
  readonly onSend: (text: string) => void;
  readonly onQuickReply: (text: string) => void;
};

/**
 * Left-side chat rail. Holds Ari's header, the scrolling log, the dashed
 * preset replies, and the input row. When `streamingText` is non-null, a
 * live ari bubble appends the streamed tokens; when it's '' we show the
 * typing-dots (waiting on the first token).
 */
export function ChatRail({
  chat,
  thinking,
  streamingText,
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
  }, [chat.length, thinking, streamingText]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  const handleKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  const showStreamingDots =
    thinking && (streamingText === null || streamingText.length === 0);
  const showStreamingBubble =
    streamingText !== null && streamingText.length > 0;

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
        {showStreamingBubble && (
          <ChatMessage from="ari">{streamingText}</ChatMessage>
        )}
        {showStreamingDots && (
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
          placeholder={`type a thought, ${studentName}…`}
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
