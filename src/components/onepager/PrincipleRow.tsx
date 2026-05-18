'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export type PrincipleRowProps = {
  readonly idx: number;
  readonly num: string;
  readonly color: string;
  readonly title: string;
  readonly body: ReactNode;
  readonly demo: ReactNode;
  readonly reverse?: boolean;
};

/**
 * One full-viewport principle section. Watches itself with an
 * IntersectionObserver; once visible, toggles `.in-view` which drives the
 * ghost-numeral fade-in, the text fade-up, and the demo fade-up (250ms behind
 * the text).
 */
export function PrincipleRow({
  idx,
  num,
  color,
  title,
  body,
  demo,
  reverse = false,
}: PrincipleRowProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e) setInView(e.isIntersecting);
      },
      { threshold: 0.3, rootMargin: '-12% 0px -12% 0px' },
    );
    io.observe(el);
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.6 && r.bottom > 0) setInView(true);
    const t = window.setTimeout(() => setInView(true), 1800);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  const side = reverse ? 'left' : 'right';

  return (
    <section
      id={`p-${num}`}
      ref={ref}
      className={`principle-stage snap ${reverse ? 'reverse' : ''} ${side} ${inView ? 'in-view' : ''}`}
      data-screen-label={`principle ${num}`}
    >
      <span className="principle-ghost-num" style={{ color }}>
        {num}
      </span>
      <div className="inner">
        <div className="principle-text">
          <div className="principle-num-row">
            <span className="num" style={{ color }}>
              {num}
            </span>
            <span className="meta">
              principle {String(idx + 1).padStart(2, '0')} / 08
            </span>
          </div>
          <h3>{title}</h3>
          <div className="body">{body}</div>
        </div>
        <div className="principle-demo">{demo}</div>
      </div>
    </section>
  );
}
