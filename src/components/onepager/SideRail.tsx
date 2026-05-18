'use client';

import { useEffect, useState, type CSSProperties } from 'react';

export type PrincipleNav = {
  readonly num: string;
  readonly color: string;
  readonly title: string;
};

export type SideRailProps = {
  readonly principles: readonly PrincipleNav[];
};

/**
 * Fixed-right principle navigator. Tracks which section the page is currently
 * centered on and grows + tints that section's bar.
 */
export function SideRail({ principles }: SideRailProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ids = principles.map((p) => `p-${p.num}`);
    const tick = () => {
      const y = window.scrollY + window.innerHeight * 0.5;
      let idx = 0;
      ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) idx = i;
      });
      setActive(idx);
    };
    tick();
    window.addEventListener('scroll', tick, { passive: true });
    return () => window.removeEventListener('scroll', tick);
  }, [principles]);

  return (
    <div className="side-rail" aria-label="Principle navigation">
      {principles.map((p, i) => {
        const barStyle: CSSProperties =
          i === active ? { background: p.color } : {};
        return (
          <a
            key={p.num}
            href={`#p-${p.num}`}
            className={i === active ? 'active' : ''}
            aria-label={`Jump to principle ${p.num} — ${p.title}`}
          >
            <span className="lbl">
              {p.num} · {p.title.replace(/\.$/, '')}
            </span>
            <span className="bar" style={barStyle} />
          </a>
        );
      })}
    </div>
  );
}
