'use client';

import type { MCConfig, MCOption } from '@/lib/lesson/types';

export type MCStatus = 'idle' | 'wrong' | 'correct';

export type MCBlockProps = {
  readonly mc: MCConfig;
  readonly onAnswer: (opt: MCOption) => void;
  readonly locked?: boolean;
  readonly selectedId?: string;
  readonly status?: MCStatus;
};

/**
 * Multiple-choice block. Options live in an auto-fit grid; the selected
 * option's tint switches between blue (selected), green (correct), or red
 * (wrong) based on `status`. Disabled after a correct answer.
 */
export function MCBlock({
  mc,
  onAnswer,
  locked = false,
  selectedId,
  status = 'idle',
}: MCBlockProps) {
  const handle = (opt: MCOption) => {
    if (locked || status === 'correct') return;
    onAnswer(opt);
  };

  return (
    <div>
      <div className="mc-question">{mc.question}</div>
      <div className="mc-grid">
        {mc.options.map((o, i) => {
          const isSel = selectedId === o.id;
          const stateClass =
            isSel && status === 'correct'
              ? 'correct'
              : isSel && status === 'wrong'
                ? 'wrong'
                : isSel
                  ? 'selected'
                  : '';
          return (
            <button
              key={o.id}
              type="button"
              className={`mc-opt ${stateClass}`.trim()}
              disabled={status === 'correct'}
              onClick={() => handle(o)}
            >
              <span className="glyph">{String.fromCharCode(65 + i)}</span>
              <span>{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
