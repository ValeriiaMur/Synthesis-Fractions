'use client';

import { useMemo, type CSSProperties, type ReactNode } from 'react';
import type { BlockStudioStepId } from '@/lib/lesson/types';
import { fracSum, isOne } from '@/lib/lesson/fractions';
import { FracInline } from '../FracInline';
import { findEquivalenceGroups } from './blockStudioLogic';
import type { QuestDescriptor, Rail } from './types';

export type BlockStudioInspectorProps = {
  readonly rails: readonly Rail[];
  readonly stepId: BlockStudioStepId;
  readonly questIdx: number;
  readonly questsTotal: number;
  readonly currentQuest: QuestDescriptor | null;
};

const sectionLabel: CSSProperties = {
  fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
  fontSize: 10,
  letterSpacing: '0.18em',
  color: 'var(--ink-mute)',
  textTransform: 'uppercase',
  marginBottom: 8,
};

const cardBase: CSSProperties = {
  padding: '14px 16px',
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid var(--line)',
  borderRadius: 14,
};

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 0',
  borderBottom: '1px solid var(--line)',
};

const rowKey: CSSProperties = {
  fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
  fontSize: 11,
  letterSpacing: '0.06em',
  color: 'var(--ink-mute)',
};

const rowVal: CSSProperties = {
  fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
  fontSize: 16,
  fontWeight: 500,
};

const COPY: Readonly<
  Record<
    BlockStudioStepId,
    { readonly eyebrow: string; readonly title: string; readonly body: ReactNode }
  >
> = {
  play: {
    eyebrow: "What you're doing",
    title: 'Get a feel for the bricks',
    body: (
      <>
        Each <strong style={{ color: 'var(--ink)' }}>rail</strong> is one whole.
        The wider a brick, the bigger its fraction. Try a 1/2 first — see how it
        covers half the rail.
      </>
    ),
  },
  compare: {
    eyebrow: "What you're looking for",
    title: 'Equivalence',
    body: (
      <>
        Fill two rails to{' '}
        <strong style={{ color: 'var(--ink)' }}>1 whole</strong> using different
        bricks. When the bricks line up the same way, those fractions are{' '}
        <em>equivalent</em>.
      </>
    ),
  },
  quest: {
    eyebrow: 'Current quest',
    title: 'Quest',
    body: null,
  },
};

export function BlockStudioInspector({
  rails,
  stepId,
  questIdx,
  questsTotal,
  currentQuest,
}: BlockStudioInspectorProps) {
  const totalBricks = rails.reduce((s, r) => s + r.bars.length, 0);

  const fullRails = useMemo(
    () =>
      rails.filter(
        (r) => r.bars.length > 0 && isOne(fracSum(r.bars)),
      ).length,
    [rails],
  );

  const equivs = useMemo(() => findEquivalenceGroups(rails), [rails]);

  const copy = COPY[stepId];
  const title =
    stepId === 'quest' && currentQuest
      ? `Quest ${questIdx + 1} of ${questsTotal}`
      : copy.title;
  const body =
    stepId === 'quest' && currentQuest ? <>{currentQuest.task}</> : copy.body;

  return (
    <aside
      style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
      aria-label="Inspector"
    >
      <div>
        <div style={sectionLabel}>{copy.eyebrow}</div>
        <div style={cardBase}>
          <div
            style={{
              ...sectionLabel,
              color: 'var(--blue)',
              marginBottom: 6,
            }}
          >
            {title}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.55,
              color: 'var(--ink-soft)',
              fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
            }}
          >
            {body}
          </p>
        </div>
      </div>

      <div>
        <div style={sectionLabel}>Live readout</div>
        <div style={cardBase}>
          <div style={rowStyle}>
            <span style={rowKey}>RAILS</span>
            <span style={rowVal}>{rails.length}</span>
          </div>
          <div style={rowStyle}>
            <span style={rowKey}>BRICKS PLACED</span>
            <span style={rowVal}>{totalBricks}</span>
          </div>
          <div style={rowStyle}>
            <span style={rowKey}>WHOLES COMPLETED</span>
            <span
              style={{
                ...rowVal,
                color: fullRails > 0 ? 'var(--green)' : 'var(--ink)',
              }}
            >
              {fullRails}
            </span>
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <span style={rowKey}>EQUIVALENCES FOUND</span>
            <span
              style={{
                ...rowVal,
                color: equivs.length > 0 ? 'var(--blue)' : 'var(--ink)',
              }}
            >
              {equivs.length}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div style={sectionLabel}>Equivalent rows</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {equivs.length === 0 && (
            <div
              style={{
                ...cardBase,
                color: 'var(--ink-faint)',
                fontSize: 13,
                lineHeight: 1.5,
                fontStyle: 'italic',
                fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
              }}
            >
              Build the same total on two rails using different bricks — they
              will appear here.
            </div>
          )}
          {equivs.map((g) => {
            const matching = rails.filter((r) => g.railIds.includes(r.id));
            return (
              <div
                key={g.sumKey}
                style={{
                  ...cardBase,
                  background: 'rgba(91,140,255,0.06)',
                  border: '1px solid rgba(91,140,255,0.35)',
                  animation:
                    'blockStudioStepIn .4s cubic-bezier(0.3, 1.3, 0.5, 1) both',
                }}
              >
                <div
                  style={{
                    ...sectionLabel,
                    color: 'var(--blue)',
                    marginBottom: 8,
                  }}
                >
                  same whole · different bricks
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {matching.map((r, i) => (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                        fontSize: 14,
                      }}
                    >
                      {i > 0 && (
                        <span style={{ color: 'var(--ink-mute)' }}>=</span>
                      )}
                      {r.bars.map((b, k) => (
                        <span
                          key={b.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {k > 0 && (
                            <span style={{ color: 'var(--ink-mute)' }}>+</span>
                          )}
                          <span style={{ color: b.color, fontWeight: 600 }}>
                            <FracInline n={b.num} d={b.den} />
                          </span>
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {stepId === 'quest' && (
        <div>
          <div style={sectionLabel}>Quest progress</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: questsTotal }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 999,
                  background:
                    i < questIdx
                      ? 'var(--green)'
                      : i === questIdx
                        ? 'var(--blue)'
                        : 'rgba(255,255,255,0.08)',
                }}
              />
            ))}
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
              fontSize: 10,
              letterSpacing: '0.18em',
              color: 'var(--ink-mute)',
              textTransform: 'uppercase',
            }}
          >
            {questIdx + 1} / {questsTotal}
          </div>
        </div>
      )}

      <div>
        <div style={sectionLabel}>Tips</div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--ink-mute)',
            lineHeight: 1.6,
            fontFamily: 'var(--font-work-sans), Work Sans, sans-serif',
          }}
        >
          <p style={{ margin: '0 0 8px' }}>
            <strong style={{ color: 'var(--ink-soft)' }}>drag</strong> from the
            tray onto a rail.
          </p>
          <p style={{ margin: '0 0 8px' }}>
            <strong style={{ color: 'var(--ink-soft)' }}>drop off</strong> the
            rail to remove a brick.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: 'var(--ink-soft)' }}>+ Add rail</strong> for
            more side-by-side comparisons.
          </p>
        </div>
      </div>
    </aside>
  );
}
