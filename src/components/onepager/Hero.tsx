import Link from 'next/link';
import { HeroPreview } from './HeroPreview';
import { ScrollDownInvite } from './ScrollDownInvite';

/**
 * Full-viewport hero — title, supporting copy, primary + secondary actions,
 * the live mini chocolate-bar preview, and a pulsing scroll affordance
 * pinned at the bottom that invites the visitor down.
 */
export function Hero() {
  return (
    <section className="hero snap">
      <div className="hero-row">
        <div>
          <h1>
            We don&rsquo;t <span className="acc-r">teach</span> fractions.
            <br />
            We let the <span className="acc-b">material</span> teach.
          </h1>
          <p>
            A short lesson on equivalent fractions, taught the Montessori way.
            The child handles a chocolate bar, a pizza, and a piece of paper —
            and sees <span style={{ color: 'var(--green)' }}>½</span> and{' '}
            <span style={{ color: 'var(--green)' }}>²⁄₄</span> are the same
            amount, before anyone uses those words.
          </p>
          <div className="hero-actions">
            <Link className="btn-primary" href="/lesson">
              Open the lesson
              <span className="btn-arrow" aria-hidden>
                →
              </span>
            </Link>
            <a className="btn-secondary" href="#principles">
              read the eight principles
            </a>
          </div>
        </div>
        <HeroPreview />
      </div>
      <ScrollDownInvite href="#principles" />
    </section>
  );
}
