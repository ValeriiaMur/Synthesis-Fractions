'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useElementProgress } from '@/hooks/useElementProgress';

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
 * One full-viewport principle section. Two columns: text + demo. The huge
 * ghost numeral behind the content drifts as the section scrolls past —
 * `useElementProgress` returns 0..1, we drive transform + opacity from it.
 *
 * Section entry (the text + demo fade-up) is still IO-driven via `.in-view`
 * so the cubic-bezier easing stays purely declarative.
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

  const progress = useElementProgress(ref);
  /* progress is 0 at first viewport touch → 1 fully past. Map to a
     -1..1 axis so motion is symmetric around mid-section. */
  const t = (progress - 0.5) * 2;
  /* Bell-curve opacity peaks at progress=0.5, max ~0.08 — matches the handoff. */
  const ghostOpacity = 0.02 + Math.sin(progress * Math.PI) * 0.06;
  const ghostStyle: CSSProperties = {
    color,
    transform: `translateY(${(-50 + t * 18).toFixed(2)}%) translateX(${(reverse ? t * 24 : -t * 24).toFixed(2)}px)`,
    opacity: ghostOpacity,
  };

  const side = reverse ? 'left' : 'right';

  return (
    <section
      id={`p-${num}`}
      ref={ref}
      className={`principle-stage snap ${reverse ? 'reverse' : ''} ${side} ${inView ? 'in-view' : ''}`}
      data-screen-label={`principle ${num}`}
    >
      <span className="principle-ghost-num" style={ghostStyle}>
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
