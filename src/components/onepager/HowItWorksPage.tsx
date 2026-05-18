'use client';

import { useEffect, type ReactNode } from 'react';
import { Stars } from '@/components/space/Stars';
import { GridBg } from '@/components/space/GridBg';
import { Doodles } from '@/components/space/Doodles';
import { useParallaxDoodles } from '@/hooks/useParallaxDoodles';
import { Hero } from './Hero';
import { ScrollProgress } from './ScrollProgress';
import { SideRail, type PrincipleNav } from './SideRail';
import { PrincipleRow } from './PrincipleRow';
import { FinalCTA } from './FinalCTA';
import { DemoConcrete } from './demos/DemoConcrete';
import { DemoControlOfError } from './demos/DemoControlOfError';
import { DemoThreePeriod } from './demos/DemoThreePeriod';
import { DemoDescription } from './demos/DemoDescription';
import { DemoPreparedEnvironment } from './demos/DemoPreparedEnvironment';
import { DemoSelfPaced } from './demos/DemoSelfPaced';
import { DemoMinimalism } from './demos/DemoMinimalism';
import { DemoRedirect } from './demos/DemoRedirect';

type Principle = PrincipleNav & {
  readonly body: ReactNode;
  readonly demo: ReactNode;
  readonly reverse: boolean;
};

const PRINCIPLES: readonly Principle[] = [
  {
    num: '01',
    color: 'var(--red)',
    title: 'Concrete before abstract.',
    body: 'The child handles the blocks before any prose names ½ or ²⁄₄. The narrator names what the student already made — not the other way around.',
    demo: <DemoConcrete />,
    reverse: false,
  },
  {
    num: '02',
    color: 'var(--blue)',
    title: 'Control of error lives in the material.',
    body: 'Two quarter-pieces visibly cover the same area as one half. Wrong attempts don’t fit. The material teaches; the adult doesn’t.',
    demo: <DemoControlOfError />,
    reverse: true,
  },
  {
    num: '03',
    color: 'var(--green)',
    title: 'The three-period lesson.',
    body: 'Introduce → recognize → recall. A canonical Montessori sequence that maps cleanly onto our five beats. The MC checks are Period 3.',
    demo: <DemoThreePeriod />,
    reverse: false,
  },
  {
    num: '04',
    color: 'var(--yellow)',
    title: 'Description, not praise.',
    body: '“Great job!” stops thought. We say: “You put two quarter-pieces together — they covered the same space as one half.” Observational language keeps the child noticing.',
    demo: <DemoDescription />,
    reverse: true,
  },
  {
    num: '05',
    color: 'var(--pink)',
    title: 'The prepared environment.',
    body: 'Beat 1: only halves. Beat 2: introduce quarters. Beat 3: combine. The tray reshapes per beat. Less load, more focus.',
    demo: <DemoPreparedEnvironment />,
    reverse: false,
  },
  {
    num: '06',
    color: 'var(--purple)',
    title: 'Self-paced reveal.',
    body: 'The notebook never advances on a timer. The guide is observing — it opens the next cell when the child is ready, never before.',
    demo: <DemoSelfPaced />,
    reverse: true,
  },
  {
    num: '07',
    color: 'var(--orange)',
    title: 'Aesthetic minimalism.',
    body: 'No badges, no streaks, no confetti. Calm type, generous whitespace, a soft palette. Everything competing for attention is removed.',
    demo: <DemoMinimalism />,
    reverse: false,
  },
  {
    num: '08',
    color: 'var(--green)',
    title: 'Redirect, never reprimand.',
    body: 'When the child picks wrong, every hint points back to the material. Never “you’re wrong” — always “let’s look at the blocks”.',
    demo: <DemoRedirect />,
    reverse: true,
  },
];

/**
 * Scrollytelling marketing / pedagogy page at `/`. Eight principles, each
 * with a live demo. Closes with a CTA into `/lesson`.
 */
export function HowItWorksPage() {
  useParallaxDoodles();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('snap-scroll');
    return () => {
      root.classList.remove('snap-scroll');
    };
  }, []);

  return (
    <div className="page cosmos-bg">
      <Stars count={120} />
      <GridBg large />
      <Doodles />

      <ScrollProgress />

      <Hero />

      <SideRail principles={PRINCIPLES} />

      <section id="principles" className="section snap">
        <div className="section-title">
          eight principles · borrowed from maria montessori
        </div>
        <h2>
          We didn&rsquo;t invent these.{' '}
          <span style={{ color: 'var(--ink-mute)' }}>
            A child does the work; the material teaches; the adult observes.
          </span>
        </h2>
        <p className="lede">
          Each principle below is interactive — toggle, drag, or scroll to see
          how it lands in our lesson.
        </p>
      </section>

      {PRINCIPLES.map((p, i) => (
        <PrincipleRow
          key={p.num}
          idx={i}
          num={p.num}
          color={p.color}
          title={p.title}
          body={p.body}
          demo={p.demo}
          reverse={p.reverse}
        />
      ))}

      <FinalCTA />
    </div>
  );
}
