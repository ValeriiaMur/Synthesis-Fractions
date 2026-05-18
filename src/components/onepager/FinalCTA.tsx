'use client';

import Link from 'next/link';
import { useReveal } from '@/lib/lesson/useReveal';

/**
 * Snap-section CTA at the bottom of the page. Fades up on first scroll-in,
 * with a fallback so static captures aren't blank.
 */
export function FinalCTA() {
  const [ref, shown] = useReveal();

  return (
    <section
      ref={ref}
      className="cta-final snap"
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(16px)',
        transition:
          'opacity 0.7s ease, transform 0.7s cubic-bezier(.2,.7,.3,1)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
          fontSize: 11,
          letterSpacing: '0.18em',
          color: 'var(--ink-mute)',
          textTransform: 'uppercase',
          marginBottom: 18,
        }}
      >
        now you
      </div>
      <div className="cta-equals">
        <span style={{ color: 'var(--red)' }}>½</span>
        <span style={{ color: 'var(--ink-mute)' }}>=</span>
        <span style={{ color: 'var(--blue)' }}>²⁄₄</span>
      </div>
      <h3>
        Six minutes. Three things to handle.
        <br />
        One idea you&rsquo;ll see, not be told.
      </h3>
      <p>Best opened on an iPad. Works with a mouse and keyboard too.</p>
      <Link className="btn-primary" href="/lesson">
        Open the lesson
        <span className="btn-arrow" aria-hidden>
          →
        </span>
      </Link>
    </section>
  );
}
