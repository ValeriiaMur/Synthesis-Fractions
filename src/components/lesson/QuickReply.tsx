'use client';

export type QuickReplyProps = {
  readonly label: string;
  readonly onClick: (label: string) => void;
};

/**
 * Dashed-underline preset reply chip — no background, hover turns blue.
 */
export function QuickReply({ label, onClick }: QuickReplyProps) {
  return (
    <button type="button" className="quickreply" onClick={() => onClick(label)}>
      {label}
    </button>
  );
}
