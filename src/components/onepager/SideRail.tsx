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
 *
 * Hides while the visitor is still on the hero (above the principles intro)
 * — the rail is for *navigating* between principles, so showing it before
 * any are visible would be noise. Reveals once you scroll past the hero.
 */
export function SideRail({ principles }: SideRailProps) {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ids = principles.map((p) => `p-${p.num}`);

    /** The rail is hidden until the visitor reaches the FIRST principle
     *  slide — anchor on `#p-01` (or whichever id the first principle has).
     *  Falls back to "show after two viewports of scroll" if that node is
     *  missing. Threshold is set so the rail starts revealing when the
     *  first principle is roughly entering the viewport. */
    const firstId = ids[0];
    const revealY = (): number => {
      const first = firstId
        ? document.getElementById(firstId)
        : null;
      if (first) {
        return first.offsetTop - window.innerHeight * 0.5;
      }
      return window.innerHeight * 1.6;
    };

    const tick = () => {
      const y = window.scrollY + window.innerHeight * 0.5;
      let idx = 0;
      ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) idx = i;
      });
      setActive(idx);
      setVisible(window.scrollY >= revealY());
    };
    tick();
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    return () => {
      window.removeEventListener('scroll', tick);
      window.removeEventListener('resize', tick);
    };
  }, [principles]);

  return (
    <div
      className={`side-rail${visible ? '' : ' is-hidden'}`}
      aria-label="Principle navigation"
      aria-hidden={!visible}
    >
      {principles.map((p, i) => {
        const barStyle: CSSProperties =
          i === active ? { background: p.color } : {};
        return (
          <a
            key={p.num}
            href={`#p-${p.num}`}
            className={i === active ? 'active' : ''}
            tabIndex={visible ? 0 : -1}
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
