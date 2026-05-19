'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Floating "back to top" affordance pinned to the bottom-right of the
 * scrollytelling page. Stays hidden while the learner is still in the
 * hero — appears once they scroll past one viewport height so the page
 * doesn't feel cluttered up front. Smooth-scrolls to the top on click.
 *
 * Visibility is driven by window.scrollY rather than IntersectionObserver
 * so it matches `useScrollProgress`'s existing model (one source of truth
 * for scroll listening would be nice; not worth the abstraction yet).
 */
export function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <button
      type="button"
      className={`scroll-top${visible ? ' is-visible' : ''}`}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={onClick}
    >
      <span className="scroll-top-chevron" aria-hidden>
        <Chevron />
      </span>
      <span className="scroll-top-label">top</span>
    </button>
  );
}

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9 L7 4 L11 9" />
    </svg>
  );
}
