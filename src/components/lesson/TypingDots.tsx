/**
 * Three animated dots, staggered, shown inside an Ari chat bubble while Ari
 * is "thinking".
 */
export function TypingDots() {
  return (
    <div className="typing-dots" aria-label="Ari is typing">
      <span />
      <span />
      <span />
    </div>
  );
}
