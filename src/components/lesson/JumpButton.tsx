'use client';

import { useEffect, useState, type RefObject } from 'react';
import { IconArrowDown } from './IconArrowDown';

export type JumpButtonProps = {
  /** Refs into each cell in the notebook. */
  readonly cellRefs: readonly RefObject<HTMLDivElement | null>[];
  readonly activeIdx: number;
  readonly onJump: () => void;
};

/**
 * Floating "scroll to active cell" button. Listens to the notebook scroll
 * container and toggles visibility based on whether the active cell is in
 * view.
 */
export function JumpButton({ cellRefs, activeIdx, onJump }: JumpButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = cellRefs[activeIdx]?.current;
    if (!el) return;
    const notebook = el.closest('.notebook');
    if (!notebook) return;

    const check = () => {
      const r = el.getBoundingClientRect();
      const nr = notebook.getBoundingClientRect();
      const inView = r.top < nr.bottom - 60 && r.bottom > nr.top + 60;
      setVisible(!inView);
    };

    check();
    notebook.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      notebook.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [activeIdx, cellRefs]);

  return (
    <button
      type="button"
      className={`jump-btn${visible ? '' : ' hidden'}`}
      onClick={onJump}
      aria-label="Jump to active cell"
    >
      <IconArrowDown />
    </button>
  );
}
