import type { ReactNode } from 'react';

export type StudentEchoProps = {
  /** The kid's response, rendered as the right-aligned bubble content. */
  readonly children: ReactNode;
  /** Optional trailing ✓ when the response is a completion (e.g. a
   *  manipulative finished, an MC answered correctly). */
  readonly done?: boolean;
};

/**
 * Right-aligned echo of the student's action inside a cell.
 *
 * Each cell is one turn in a vertical chat:
 *   - Tutor speaks (Prose, top of cell)
 *   - Student responds (manipulative / MC, middle)
 *   - StudentEcho mirrors that response so the conversational rhythm is
 *     visible, not just inferred from a button tint
 *   - Tutor reacts (HintBubble / CelebrationBubble, bottom)
 *
 * Visual: caps "you" label, dim text, no border — quieter than the
 * tutor bubbles so it doesn't compete for attention.
 */
export function StudentEcho({ children, done = false }: StudentEchoProps) {
  return (
    <div className="student-echo">
      <span className="student-echo-label">you</span>
      <span className="student-echo-body">
        {children}
        {done ? ' ✓' : null}
      </span>
    </div>
  );
}
