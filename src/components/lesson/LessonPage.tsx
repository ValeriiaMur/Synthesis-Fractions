'use client';

import {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import type {
  Beat,
  BeatId,
  Lesson,
  LessonPhase,
  ManipulativeState,
  MCConfig,
  MCOption,
} from '@/lib/lesson/types';
import { stripMarkup } from '@/lib/lesson/stripMarkup';
import { isBeatComplete, lookupHint } from '@/lib/lesson/completes';
import { aiReplyTo } from '@/lib/lesson/aiReplyTo';
import { fetchHint } from '@/lib/agent/hintClient';
import { fetchParaphrase } from '@/lib/agent/paraphraseClient';
import { fetchAdvanceLine } from '@/lib/agent/advanceClient';
import { fetchScaffoldedMC } from '@/lib/agent/scaffoldMCClient';
import { streamChat } from '@/lib/agent/chatClient';
import type { ManipulativeKind } from '@/lib/agent/lessonAgent';
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
const SCAFFOLD_THRESHOLD = 3;
/** Limit recent-chat context fed to the chat LLM so prompts stay short. */
const CHAT_CONTEXT_TURNS = 8;

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

function manipulativeKind(beat: Beat): ManipulativeKind | null {
  return beat.manipulative?.kind ?? null;
}

/**
 * Top-level lesson screen + state machine + agent wiring.
 *
 * Canonical-first contract: every authored line (hints, prose, MC) renders
 * immediately. The LLM (Haiku 4.5, via the lesson agent) fires in the
 * background and *swaps* the displayed text only when it resolves under
 * budget. If the network or the model fails, the canonical copy stays put.
 */
export function LessonPage({ lesson, studentName = 'Ben' }: LessonPageProps) {
  const beats = lesson.beats;
  const beatCount = beats.length;

  // ---- core lesson state ----
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

  // ---- LLM-driven overrides (canonical-first, swap on resolve) ----
  /** Live hint text per beat — overrides the canonical hint when set. */
  const [liveHints, setLiveHints] = useState<
    Partial<Record<BeatId, string>>
  >({});
  /** Scaffolded MC per beat — overrides `beat.mc` once the learner has hit
   *  SCAFFOLD_THRESHOLD wrong answers on the same beat. */
  const [scaffoldedMC, setScaffoldedMC] = useState<
    Partial<Record<BeatId, MCConfig>>
  >({});

  // ---- chat state ----
  const [thinking, setThinking] = useState(false);
  /** While Ari is streaming, this holds the accumulating text. Cleared on
   *  stream end, at which point the final text is pushed to `chat`. */
  const [streamingText, setStreamingText] = useState<string | null>(null);
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

  /** Most recent chat (for chat agent context). Kept in a ref so callbacks
   *  see the latest value without retriggering. */
  const chatRef = useRef(chat);
  useEffect(() => {
    chatRef.current = chat;
  });

  // Per-request guards so a stale LLM response can't clobber a newer one.
  const hintReqRef = useRef<Partial<Record<BeatId, number>>>({});
  const scaffoldReqRef = useRef<Partial<Record<BeatId, number>>>({});
  const paraphraseReqRef = useRef<Partial<Record<BeatId, number>>>({});
  const chatReqRef = useRef(0);

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

  /** Move to beat `next`. Pushes canonical system + prose immediately; then
   *  fires fetchAdvanceLine + fetchParaphrase in the background and swaps
   *  text in place when they resolve. */
  const advanceTo = useCallback(
    (next: number, fromBeatId: BeatId | null) => {
      if (next >= beatCount) return;
      const nextBeat = beats[next];
      setActiveIdx(next);
      pushSystem(`▸ cell ${String(next + 1).padStart(2, '0')} unlocked`);

      const canonicalProse = stripMarkup(nextBeat.prose);
      // Insert a placeholder ari message for the prose; track its index so
      // fetchParaphrase can swap text in place.
      let proseIndex = -1;
      setChat((c) => {
        proseIndex = c.length;
        return [...c, { from: 'ari', text: canonicalProse } as const];
      });

      // In-world acknowledgement line (best-effort).
      void (async () => {
        const line = await fetchAdvanceLine({
          fromBeatId,
          toBeatId: nextBeat.id,
          toBeatKindLabel: nextBeat.kindLabel,
          studentName,
        });
        if (line) {
          // Splice the advance line BEFORE the canonical prose.
          setChat((c) => {
            if (proseIndex < 0 || proseIndex >= c.length) {
              return [...c, { from: 'ari', text: line } as const];
            }
            const before = c.slice(0, proseIndex);
            const after = c.slice(proseIndex);
            return [...before, { from: 'ari', text: line } as const, ...after];
          });
          proseIndex += 1;
        }
      })();

      // Background paraphrase swap. Guard against stale requests per beat.
      const reqId = (paraphraseReqRef.current[nextBeat.id] ?? 0) + 1;
      paraphraseReqRef.current[nextBeat.id] = reqId;
      void (async () => {
        const paraphrased = await fetchParaphrase({
          beatId: nextBeat.id,
          originalProse: nextBeat.prose,
        });
        if (!paraphrased) return;
        if (paraphraseReqRef.current[nextBeat.id] !== reqId) return;
        setChat((c) => {
          if (proseIndex < 0 || proseIndex >= c.length) return c;
          const target = c[proseIndex];
          if (target.from !== 'ari') return c;
          const next = [...c];
          next[proseIndex] = { from: 'ari', text: paraphrased };
          return next;
        });
      })();

      window.setTimeout(() => {
        cellRefs[next]?.current?.scrollIntoView?.({
          behavior: 'smooth',
          block: 'center',
        });
      }, 250);
    },
    [beatCount, beats, cellRefs, pushSystem, studentName],
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
            if (next < beatCount) advanceTo(next, beat.id);
          }
          return ns;
        });
      }
    },
    [advanceTo, beats, beatCount],
  );

  /** Returns the MC the learner currently sees — scaffolded if present,
   *  otherwise the authored MC. */
  const liveMCFor = useCallback(
    (beat: Beat): MCConfig | undefined => {
      const override = scaffoldedMC[beat.id];
      return override ?? beat.mc;
    },
    [scaffoldedMC],
  );

  const handleMC = useCallback(
    (idx: number, opt: MCOption) => {
      const beat = beats[idx];
      const mc = liveMCFor(beat);
      if (!mc) return;
      setMcSel((m) => ({ ...m, [beat.id]: opt.id }));

      if (opt.id === mc.correctOptionId) {
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
          window.setTimeout(() => advanceTo(next, beat.id), 600);
        } else {
          window.setTimeout(
            () =>
              pushAri(
                "That's the lesson. One half and two quarters are the same amount — same delivery, different packing.",
              ),
            500,
          );
        }
        return;
      }

      // Wrong answer path.
      setMcStatus((s) => ({ ...s, [beat.id]: 'wrong' }));
      const attempt = hintAttempts[beat.id] ?? 0;
      const canonical = lookupHint(mc.canonicalHints, attempt);
      const nextAttemptCount = attempt + 1;
      setHintAttempts((h) => ({ ...h, [beat.id]: nextAttemptCount }));
      pushUser(opt.label);
      if (canonical) pushAri(canonical);

      const kind = manipulativeKind(beat);
      const correctOption = mc.options.find(
        (o) => o.id === mc.correctOptionId,
      );

      // Background LLM hint swap.
      if (kind && correctOption) {
        const reqId = (hintReqRef.current[beat.id] ?? 0) + 1;
        hintReqRef.current[beat.id] = reqId;
        void (async () => {
          const llmHint = await fetchHint({
            manipulativeKind: kind,
            question: mc.question,
            correctOptionLabel: correctOption.label,
            selectedOptionLabel: opt.label,
            attemptCount: nextAttemptCount,
          });
          if (!llmHint) return;
          if (hintReqRef.current[beat.id] !== reqId) return;
          setLiveHints((m) => ({ ...m, [beat.id]: llmHint }));
        })();
      }

      // Once at SCAFFOLD_THRESHOLD wrong attempts, fire scaffold_mc.
      if (
        nextAttemptCount >= SCAFFOLD_THRESHOLD &&
        kind &&
        !scaffoldedMC[beat.id]
      ) {
        const reqId = (scaffoldReqRef.current[beat.id] ?? 0) + 1;
        scaffoldReqRef.current[beat.id] = reqId;
        void (async () => {
          const result = await fetchScaffoldedMC({
            beatId: beat.id,
            manipulativeKind: kind,
            question: mc.question,
            options: mc.options,
            correctOptionId: mc.correctOptionId,
          });
          if (!result) return;
          if (scaffoldReqRef.current[beat.id] !== reqId) return;
          const swapped: MCConfig = {
            question: result.paraphrasedQuestion,
            options: result.reducedOptions,
            correctOptionId: mc.correctOptionId,
            canonicalHints: mc.canonicalHints,
          };
          setScaffoldedMC((m) => ({ ...m, [beat.id]: swapped }));
          // Clear the learner's last selection + wrong-status so they can
          // pick fresh from the simpler two-option set.
          setMcSel((m) => {
            const next = { ...m };
            delete next[beat.id];
            return next;
          });
          setMcStatus((m) => {
            const next = { ...m };
            delete next[beat.id];
            return next;
          });
          setLiveHints((m) => {
            const next = { ...m };
            delete next[beat.id];
            return next;
          });
        })();
      }
    },
    [
      advanceTo,
      beats,
      beatCount,
      hintAttempts,
      liveMCFor,
      pushAri,
      pushUser,
      scaffoldedMC,
    ],
  );

  /** Stream Ari's reply via the chat agent. Canonical fallback (aiReplyTo)
   *  fires if the stream yields zero tokens (network / model down). */
  const runChatReply = useCallback(
    async (userText: string) => {
      setThinking(true);
      setStreamingText('');

      const currentBeat = beats[activeIdx] ?? null;
      const reqId = chatReqRef.current + 1;
      chatReqRef.current = reqId;

      // The user message we just pushed is the LAST entry; include the
      // turns before it as context (cap at CHAT_CONTEXT_TURNS).
      const recent = chatRef.current
        .slice(-CHAT_CONTEXT_TURNS - 1, -1)
        .map((m) => ({ from: m.from, text: m.text }));

      let accumulated = '';
      let gotAnyToken = false;
      try {
        const stream = streamChat({
          studentName,
          studentMessage: userText,
          currentBeatId: currentBeat?.id ?? null,
          currentBeatProse: currentBeat ? stripMarkup(currentBeat.prose) : null,
          currentBeatKindLabel: currentBeat?.kindLabel ?? null,
          manipulativeKind: currentBeat ? manipulativeKind(currentBeat) : null,
          recentChat: recent,
        });
        for await (const token of stream) {
          if (chatReqRef.current !== reqId) return;
          gotAnyToken = true;
          accumulated += token;
          setStreamingText(accumulated);
        }
      } catch {
        // streamChat never throws, but be defensive.
      }

      if (chatReqRef.current !== reqId) return;

      if (gotAnyToken && accumulated.trim().length > 0) {
        pushAri(accumulated.trim());
      } else {
        pushAri(aiReplyTo(userText, currentBeat ?? undefined, studentName));
      }
      setStreamingText(null);
      setThinking(false);
    },
    [activeIdx, beats, pushAri, studentName],
  );

  const sendChat = useCallback(
    (text: string) => {
      pushUser(text);
      void runChatReply(text);
    },
    [pushUser, runChatReply],
  );

  const quickReply = useCallback(
    (text: string) => {
      pushUser(text);
      void runChatReply(text);
    },
    [pushUser, runChatReply],
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
          streamingText={streamingText}
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
              const liveMC = liveMCFor(beat);
              const showMc =
                liveMC &&
                (status === 'active' ||
                  status === 'done' ||
                  (beat.manipulative && manipDone));
              const liveHint = liveHints[beat.id];
              const canonicalHint = liveMC
                ? lookupHint(
                    liveMC.canonicalHints,
                    Math.max(0, (hintAttempts[beat.id] ?? 1) - 1),
                  )
                : null;
              const isScaffolded = !!scaffoldedMC[beat.id];

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

                  {showMc && liveMC && (
                    <div style={{ marginTop: 22 }}>
                      {isScaffolded && (
                        <div
                          style={{
                            fontFamily:
                              'var(--font-jetbrains-mono), JetBrains Mono, monospace',
                            fontSize: 10,
                            letterSpacing: '0.14em',
                            color: 'var(--ink-mute)',
                            textTransform: 'uppercase',
                            marginBottom: 8,
                          }}
                        >
                          ↳ scaffolded
                        </div>
                      )}
                      <MCBlock
                        mc={liveMC}
                        onAnswer={(opt) => handleMC(idx, opt)}
                        locked={status === 'locked'}
                        selectedId={sel}
                        status={mcs}
                      />
                      {mcs === 'wrong' && (
                        <HintBubble>{liveHint ?? canonicalHint}</HintBubble>
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
