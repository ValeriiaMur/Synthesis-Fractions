'use client';

import { useEffect, useState, type CSSProperties } from 'react';

export type TrayItemKind = '½' | '¼' | 'pizza' | 'paper';

export type TrayItemProps = {
  readonly item: TrayItemKind;
  readonly delay: number;
};

/**
 * One staggered-pop-in item on the prepared environment tray.
 */
export function TrayItem({ item, delay }: TrayItemProps) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(true), delay);
    return () => window.clearTimeout(t);
  }, [delay]);

  const base: CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? 'scale(1)' : 'scale(0.6)',
    transition: 'all .4s cubic-bezier(.2,1.5,.4,1)',
    borderRadius: 8,
    display: 'grid',
    placeItems: 'center',
    fontSize: 18,
    fontWeight: 300,
  };

  if (item === '½' || item === '¼') {
    return (
      <div
        style={{
          ...base,
          width: item === '½' ? 96 : 44,
          height: 44,
          background: 'linear-gradient(135deg, #6e3a1c, #8a4622, #5d2f17)',
          color: 'rgba(255,255,255,0.85)',
          fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
          fontWeight: 400,
        }}
      >
        {item}
      </div>
    );
  }

  if (item === 'pizza') {
    return (
      <div
        style={{
          ...base,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, #ffd86b 0 60%, #d8a86a 60% 90%, #5a3a1f 90% 100%)',
        }}
      />
    );
  }

  return (
    <div
      style={{
        ...base,
        width: 44,
        height: 44,
        background: '#f4ecd6',
        borderRadius: 4,
      }}
    />
  );
}
