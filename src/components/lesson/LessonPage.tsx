'use client';

import {
  createRef,
  useCallback,
  useMemo,
  useState,
  type RefObject,
} from 'react';
import type {
  Beat,
  BeatId,
  Lesson,
  LessonPhase,
  ManipulativeState,
  MCOption,
} from '@/lib/lesson/types';
import { stripMarkup } from '@/lib/lesson/stripMarkup';
import { isBeatComplete, lookupHint } from '@/lib/lesson/completes';
import { aiReplyTo } from '@/lib/lesson/aiReplyTo';
import { Stars } from '@/components/space/Stars';
import { GridBg } from '@/components/space/GridBg';
import { Doodles } from '@/components/space/Doodles';
import { TopBar, type ProgressSegmentStatus } from './TopBar';
import { ChatRail, type ChatMsg } from './ChatRail';
import { Cell } from './Cell';
import { Prose } from './Prose';
import { MCBlock, type MCStatus } from './MCBlock';
import { HintBubble } from './HintBubble';
import { CelebrationBubble } from './CelebrationBubble';
import { Intro } from './Intro';
import { Outro } from './Outro';
import { JumpButton } from './JumpButton';
import { ChocolateBar } from '@/components/manipulatives/ChocolateBar';
import { PizzaSlicer } from '@/components/manipulatives/PizzaSlicer';
import { PaperFold } from '@/components/manipulatives/PaperFold';
import { FractionBox } from '@/components/manipulatives/FractionBox';

export type LessonPageProps = {
  readonly lesson: Lesson;
  readonly studentName?: string;
};

type CellStatus = 'locked' | 'active' | 'done';

const QUICK_REPLIES = ["i'm stuck", 'show me again', 'what next?'];

function phaseLabel(p: LessonPhase): string {
  if (p === 'period_1_introduce') return 'P1 · introduce';
  if (p === 'period_2_recognize') return 'P2 · recognize';
  return 'P3 · recall';
}

type Manip = NonNullable<Beat['manipulative']>;

function renderManipulative(
  manip: Manip,
  value: ManipulativeState | undefined,
  onChange: (s: ManipulativeState) => void,
  disabled: boolean,
): React.ReactElement | null {
  if (manip.kind === 'chocolate') {
    return (
      <ChocolateBar
        value={value?.kind === 'chocolate' ? value : undefined}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
  if (manip.kind === 'pizza') {
    return (
      <PizzaSlicer
        value={value?.kind === 'pizza' ? value : undefined}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
  if (manip.kind === 'paper') {
    return (
      <PaperFold
        value={value?.kind === 'paper' ? value : undefined}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
  return (
    <FractionBox
      config={manip}
      value={value?.kind === 'fractionbox' ? value : undefined}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

/**
 * Top-level lesson screen. Holds the LessonState machine:
 *  - activeIdx + doneSet drive each Cell's status
 *  - manipulative onChange may unlock the next cell
 *  - MC onAnswer routes to either a hint or an advance
 *  - chat send + quick reply route through aiReplyTo
 */
export function LessonPage({ lesson, studentName = 'Ben' }: LessonPageProps) {
  const beats = lesson.beats;
  const beatCount = beats.length;

  const [activeIdx, setActiveIdx] = useState(0);
  const [doneSet, setDoneSet] = useState<ReadonlySet<BeatId>>(new Set());
  const [mcSel, setMcSel] = useState<Partial<Record<BeatId, string>>>({});
  const [mcStatus, setMcStatus] = useState<Partial<Record<BeatId, MCStatus>>>(
    {},
  );
  const [hintAttempts, setHintAttempts] = useState<
    Partial<Record<BeatId, number>>
  >({});
  const [manipStates, setManipStates] = useState<
    Partial<Record<BeatId, ManipulativeState>>
  >({});
  const [thinking, setThinking] = useState(false);
  const [chat, setChat] = useState<readonly ChatMsg[]>(() => [
    {
      from: 'ari',
      text: `Hi ${studentName} — Ari here, your co-pilot. Skiff's loaded and the moon outpost is waiting.`,
    },
    {
      from: 'ari',
      text: "Six short stops. Each one's a small fraction puzzle. Take your time — the ship waits for us, not the other way around.",
    },
    { from: 'ari', text: stripMarkup(beats[0].prose) },
  ]);

  /** Stable cell refs, memoized so they can be safely read during render. */
  const cellRefs = useMemo<readonly RefObject<HTMLDivElement | null>[]>(
    () => beats.map(() => createRef<HTMLDivElement | null>()),
    [beats],
  );

  const pushAri = useCallback(
    (text: string) =>
      setChat((c) => [...c, { from: 'ari', text } as const]),
    [],
  );
  const pushUser = useCallback(
    (text: string) =>
      setChat((c) => [...c, { from: 'user', text } as const]),
    [],
  );
  const pushSystem = useCallback(
    (text: string) =>
      setChat((c) => [...c, { from: 'system', text } as const]),
    [],
  );

  const statusFor = useCallback(
    (idx: number): CellStatus => {
      const beat = beats[idx];
      if (doneSet.has(beat.id)) return 'done';
      if (idx === activeIdx) return 'active';
      return 'locked';
    },
    [activeIdx, beats, doneSet],
  );

  const advanceTo = useCallback(
    (next: number) => {
      if (next >= beatCount) return;
      setActiveIdx(next);
      pushSystem(`▸ cell ${String(next + 1).padStart(2, '0')} unlocked`);
      pushAri(stripMarkup(beats[next].prose));
      window.setTimeout(() => {
        cellRefs[next]?.current?.scrollIntoView?.({
          behavior: 'smooth',
          block: 'center',
        });
      }, 250);
    },
    [beatCount, beats, cellRefs, pushAri, pushSystem],
  );

  const handleManip = useCallback(
    (idx: number, state: ManipulativeState) => {
      const beat = beats[idx];
      setManipStates((m) => ({ ...m, [beat.id]: state }));
      if (isBeatComplete(beat, state)) {
        setDoneSet((s) => {
          if (s.has(beat.id)) return s;
          const ns = new Set(s);
          ns.add(beat.id);
          // If the same beat has an MC (paper_fold_final), don't auto-advance;
          // wait for the MC answer.
          if (!beat.mc) {
            const next = idx + 1;
            if (next < beatCount) advanceTo(next);
          }
          return ns;
        });
      }
    },
    [advanceTo, beats, beatCount],
  );

  const handleMC = useCallback(
    (idx: number, opt: MCOption) => {
      const beat = beats[idx];
      if (!beat.mc) return;
      setMcSel((m) => ({ ...m, [beat.id]: opt.id }));
      if (opt.id === beat.mc.correctOptionId) {
        setMcStatus((s) => ({ ...s, [beat.id]: 'correct' }));
        pushUser(opt.label);
        pushAri("That's right — you can see it.");
        setDoneSet((s) => {
          const n = new Set(s);
          n.add(beat.id);
          return n;
        });
        const next = idx + 1;
        if (next < beatCount) {
          window.setTimeout(() => advanceTo(next), 600);
        } else {
          window.setTimeout(
            () =>
              pushAri(
                "That's the lesson. One half and two quarters are the same amount.",
              ),
            500,
          );
        }
      } else {
        setMcStatus((s) => ({ ...s, [beat.id]: 'wrong' }));
        const attempt = hintAttempts[beat.id] ?? 0;
        const hint = lookupHint(beat.mc.canonicalHints, attempt);
        setHintAttempts((h) => ({ ...h, [beat.id]: attempt + 1 }));
        pushUser(opt.label);
        if (hint) pushAri(hint);
      }
    },
    [advanceTo, beats, beatCount, hintAttempts, pushAri, pushUser],
  );

  const sendChat = useCallback(
    (text: string) => {
      pushUser(text);
      setThinking(true);
      window.setTimeout(() => {
        setThinking(false);
        pushAri(aiReplyTo(text, beats[activeIdx], studentName));
      }, 700);
    },
    [activeIdx, beats, pushAri, pushUser, studentName],
  );

  const quickReply = useCallback(
    (text: string) => {
      pushUser(text);
      setThinking(true);
      window.setTimeout(() => {
        setThinking(false);
        pushAri(aiReplyTo(text, beats[activeIdx], studentName));
      }, 600);
    },
    [activeIdx, beats, pushAri, pushUser, studentName],
  );

  const jumpToActive = useCallback(() => {
    cellRefs[activeIdx]?.current?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'center',
    });
  }, [activeIdx, cellRefs]);

  const progress = useMemo<readonly ProgressSegmentStatus[]>(
    () =>
      beats.map((b, i) => {
        if (doneSet.has(b.id)) return 'done';
        if (i === activeIdx) return 'active';
        return 'idle';
      }),
    [activeIdx, beats, doneSet],
  );

  return (
    <div className="lesson-app cosmos-bg">
      <Stars count={120} />
      <GridBg />
      <Doodles />

      <TopBar progress={progress} />

      <div className="stage">
        <ChatRail
          chat={chat}
          thinking={thinking}
          studentName={studentName}
          activeIdx={activeIdx}
          totalBeats={beatCount}
          quickReplies={QUICK_REPLIES}
          onSend={sendChat}
          onQuickReply={quickReply}
        />

        <div className="notebook">
          <div className="notebook-inner">
            <Intro studentName={studentName} />

            {beats.map((beat, idx) => {
              const status = statusFor(idx);
              const sel = mcSel[beat.id];
              const mcs: MCStatus = mcStatus[beat.id] ?? 'idle';
              const manipState = manipStates[beat.id];
              const manipDone = beat.manipulative
                ? isBeatComplete(beat, manipState)
                : false;
              const showMc =
                beat.mc &&
                (status === 'active' ||
                  status === 'done' ||
                  (beat.manipulative && manipDone));

              return (
                <Cell
                  key={beat.id}
                  index={idx + 1}
                  phaseLabel={phaseLabel(beat.phase)}
                  status={status}
                  kind={beat.kindLabel}
                  anchorRef={cellRefs[idx]}
                >
                  <Prose text={beat.prose} />

                  {beat.manipulative && (
                    <div style={{ marginTop: 24 }}>
                      {renderManipulative(
                        beat.manipulative,
                        manipState,
                        (s) => handleManip(idx, s),
                        status === 'locked',
                      )}
                    </div>
                  )}

                  {showMc && beat.mc && (
                    <div style={{ marginTop: 22 }}>
                      <MCBlock
                        mc={beat.mc}
                        onAnswer={(opt) => handleMC(idx, opt)}
                        locked={status === 'locked'}
                        selectedId={sel}
                        status={mcs}
                      />
                      {mcs === 'wrong' && (
                        <HintBubble>
                          {lookupHint(
                            beat.mc.canonicalHints,
                            Math.max(0, (hintAttempts[beat.id] ?? 1) - 1),
                          )}
                        </HintBubble>
                      )}
                      {mcs === 'correct' && (
                        <CelebrationBubble>
                          That&rsquo;s right — you can see it.
                        </CelebrationBubble>
                      )}
                    </div>
                  )}
                </Cell>
              );
            })}

            <Outro done={doneSet.size === beatCount} />
          </div>

          <JumpButton
            cellRefs={cellRefs}
            activeIdx={activeIdx}
            onJump={jumpToActive}
          />
        </div>
      </div>
    </div>
  );
}
