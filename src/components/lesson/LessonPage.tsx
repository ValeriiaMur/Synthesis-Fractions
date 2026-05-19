'use client';

import {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
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
import { fetchHint } from '@/lib/agent/hintClient';
import { fetchAdvanceLine } from '@/lib/agent/advanceClient';
import { fetchScaffoldedMC } from '@/lib/agent/scaffoldMCClient';
import type { ManipulativeKind } from '@/lib/agent/lessonAgent';
import { getVoicePlayer } from '@/lib/voice/voicePlayer';
import { Stars } from '@/components/space/Stars';
import { GridBg } from '@/components/space/GridBg';
import { Doodles } from '@/components/space/Doodles';
import { TopBar, type ProgressSegmentStatus } from './TopBar';
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
import { BlockStudio } from '@/components/manipulatives/BlockStudio/BlockStudio';

import type { PersistedLessonState } from '@/lib/lesson/lessonPersistence';
import { snapshotLesson, storageKey } from '@/lib/lesson/lessonPersistence';

export type LessonPageProps = {
  readonly lesson: Lesson;
  readonly studentName?: string;
  /** Optional restore. When provided, the state machine hydrates from it
   *  instead of starting fresh. */
  readonly initialState?: PersistedLessonState | null;
};

type CellStatus = 'locked' | 'active' | 'done';

const SCAFFOLD_THRESHOLD = 3;

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
  if (manip.kind === 'blockstudio') {
    return (
      <BlockStudio
        config={manip}
        value={value?.kind === 'blockstudio' ? value : undefined}
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
  const k = beat.manipulative?.kind;
  if (k === 'chocolate' || k === 'pizza' || k === 'paper' || k === 'fractionbox') {
    return k;
  }
  return null;
}

/**
 * Top-level lesson screen + state machine + agent wiring.
 *
 * Layout: full-width notebook. The chat rail was retired in favour of a
 * voice-driven, view-driven experience — the kid reads (or listens to) one
 * cell, completes the exercise, and the lesson advances. There is no more
 * free-text chat with Ari; reactions live in the hint / celebration bubbles
 * inside each cell and in the voice queue.
 *
 * Canonical-first contract: every authored line (hints, prose, MC) renders
 * immediately. The LLM (Haiku 4.5) fires in the background and *swaps* the
 * displayed text only when it resolves under budget. If the network or the
 * model fails, the canonical copy stays put.
 *
 * Voice contract (see also summary.md):
 *  - On mount the voice queue is cleared and the active beat's prose is
 *    queued. Re-entering the route from anywhere starts fresh on whichever
 *    cell the kid is on.
 *  - On unmount the queue is cleared (the currently-playing utterance
 *    finishes — voicePlayer.stop is non-interrupting by design).
 *  - During exercises (manipulative tinkering, considering an MC) the
 *    voice is silent. speakAri is only called from reaction sites below.
 *  - Wrong MC → speak the hint (LLM if available, canonical otherwise).
 *  - Correct MC → speak the celebration; 600ms later advanceTo races the
 *    advance line and queues [advance, next prose] in visual order.
 */
export function LessonPage({
  lesson,
  studentName = 'Ben',
  initialState = null,
}: LessonPageProps) {
  const beats = lesson.beats;
  const beatCount = beats.length;

  // ---- core lesson state (seeded from initialState when present) ----
  const [activeIdx, setActiveIdx] = useState(() => initialState?.activeIdx ?? 0);
  const [doneSet, setDoneSet] = useState<ReadonlySet<BeatId>>(
    () => new Set(initialState?.doneIds ?? []),
  );
  const [mcSel, setMcSel] = useState<Partial<Record<BeatId, string>>>(
    () => ({ ...(initialState?.mcSel ?? {}) }),
  );
  const [mcStatus, setMcStatus] = useState<Partial<Record<BeatId, MCStatus>>>(
    () => ({ ...(initialState?.mcStatus ?? {}) }),
  );
  const [hintAttempts, setHintAttempts] = useState<
    Partial<Record<BeatId, number>>
  >(() => ({ ...(initialState?.hintAttempts ?? {}) }));
  const [manipStates, setManipStates] = useState<
    Partial<Record<BeatId, ManipulativeState>>
  >(() => ({ ...(initialState?.manipStates ?? {}) }));

  // ---- LLM-driven overrides (canonical-first, swap on resolve) ----
  /** Live hint text per beat — overrides the canonical hint when set. */
  const [liveHints, setLiveHints] = useState<
    Partial<Record<BeatId, string>>
  >(() => ({ ...(initialState?.liveHints ?? {}) }));
  /** Scaffolded MC per beat — overrides `beat.mc` once the learner has hit
   *  SCAFFOLD_THRESHOLD wrong answers on the same beat. */
  const [scaffoldedMC, setScaffoldedMC] = useState<
    Partial<Record<BeatId, MCConfig>>
  >(() => ({ ...(initialState?.scaffoldedMC ?? {}) }));

  /** Tracks which beats have an in-world "▸ cell 02 unlocked" line shown
   *  above them. Populated lazily as the kid advances; not persisted. */
  const [unlockedBanners, setUnlockedBanners] = useState<
    ReadonlySet<BeatId>
  >(() => new Set());

  /** Stable cell refs, memoized so they can be safely read during render. */
  const cellRefs = useMemo<readonly RefObject<HTMLDivElement | null>[]>(
    () => beats.map(() => createRef<HTMLDivElement | null>()),
    [beats],
  );

  // Per-request guards so a stale LLM response can't clobber a newer one.
  const hintReqRef = useRef<Partial<Record<BeatId, number>>>({});
  const scaffoldReqRef = useRef<Partial<Record<BeatId, number>>>({});

  // ---- voice ----
  // Reveal-gated: each speakAri call defers `voice.speak` through a double
  // requestAnimationFrame so React has time to commit + paint the new
  // visual before audio starts fetching. The voice player itself is FIFO,
  // so consecutive speakAri calls still play in issue order.
  const voice = useMemo(() => getVoicePlayer(), []);
  const speakAri = useCallback(
    (text: string) => {
      if (typeof window === 'undefined') {
        voice.speak(text);
        return;
      }
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          voice.speak(text);
        });
      });
    },
    [voice],
  );
  const muted = useSyncExternalStore(
    voice.subscribe,
    voice.isMuted,
    () => false,
  );
  const toggleMuted = useCallback(
    () => voice.setMuted(!voice.isMuted()),
    [voice],
  );

  // Mount-time voice: clear queue + speak whatever beat the kid is on.
  // Empty deps — this is intentionally one-shot. Subsequent activeIdx
  // changes are driven by advanceTo, which owns its own voice queueing.
  //
  // We do NOT route through speakAri here: speakAri defers voice.speak via a
  // non-cancellable double-rAF, and under React StrictMode the mount effect
  // runs twice — both rAF chains end up firing after their respective
  // cleanups, so the same prose gets queued twice. Use a local rAF chain we
  // can cancel in cleanup so a re-mount (StrictMode) or fast nav-away can't
  // leak a stale speak.
  const initialActiveIdxRef = useRef(activeIdx);
  const initialBeatsRef = useRef(beats);
  useEffect(() => {
    voice.stop();
    const idx = initialActiveIdxRef.current;
    const startBeat = initialBeatsRef.current[idx];
    if (!startBeat || typeof window === 'undefined') {
      return () => {
        voice.stop();
      };
    }
    const text = stripMarkup(startBeat.prose);
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        voice.speak(text);
      });
    });
    return () => {
      // Navigating away (or StrictMode's dev-mode remount) kills both the
      // pending queue and the *deferred* speak. The currently-playing
      // utterance still finishes — voicePlayer.stop is non-interrupting.
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
      voice.stop();
    };
  }, [voice]);

  /** Persist the lesson state on any meaningful change. Skipping `chat`
   *  entirely now that the chat rail is gone; we still write an empty
   *  array to keep the persisted shape backward-compatible. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = window.requestAnimationFrame(() => {
      try {
        const snap = snapshotLesson(lesson.id, {
          activeIdx,
          doneIds: Array.from(doneSet),
          mcSel,
          mcStatus,
          hintAttempts,
          manipStates,
          liveHints,
          scaffoldedMC,
          chat: [],
        });
        window.localStorage.setItem(
          storageKey(lesson.id),
          JSON.stringify(snap),
        );
      } catch {
        // localStorage can throw if disabled / over quota; ignore.
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [
    lesson.id,
    activeIdx,
    doneSet,
    mcSel,
    mcStatus,
    hintAttempts,
    manipStates,
    liveHints,
    scaffoldedMC,
  ]);

  const statusFor = useCallback(
    (idx: number): CellStatus => {
      const beat = beats[idx];
      if (doneSet.has(beat.id)) return 'done';
      if (idx === activeIdx) return 'active';
      return 'locked';
    },
    [activeIdx, beats, doneSet],
  );

  /** Move to beat `next`. Visually canonical-first (banner + cell unlock
   *  flip immediately). Voice waits for `fetchAdvanceLine` so that an
   *  in-world line, when present, is queued BEFORE the next beat's prose. */
  const advanceTo = useCallback(
    (next: number, fromBeatId: BeatId | null) => {
      if (next >= beatCount) return;
      const nextBeat = beats[next];
      setActiveIdx(next);
      setUnlockedBanners((s) => {
        if (s.has(nextBeat.id)) return s;
        const ns = new Set(s);
        ns.add(nextBeat.id);
        return ns;
      });

      const canonicalProse = stripMarkup(nextBeat.prose);
      void (async () => {
        const line = await fetchAdvanceLine({
          fromBeatId,
          toBeatId: nextBeat.id,
          toBeatKindLabel: nextBeat.kindLabel,
          studentName,
        });
        if (line) {
          // Voice in visual order: advance line first, then prose.
          speakAri(line);
          speakAri(canonicalProse);
        } else {
          speakAri(canonicalProse);
        }
      })();

      window.setTimeout(() => {
        cellRefs[next]?.current?.scrollIntoView?.({
          behavior: 'smooth',
          block: 'center',
        });
      }, 250);
    },
    [beatCount, beats, cellRefs, speakAri, studentName],
  );

  const handleManip = useCallback(
    (idx: number, state: ManipulativeState) => {
      const beat = beats[idx];
      setManipStates((m) => ({ ...m, [beat.id]: state }));
      if (!isBeatComplete(beat, state)) return;

      // The reducer below is pure; the side-effecting advanceTo() lives
      // outside it so React 18 StrictMode (which intentionally double-runs
      // reducers in dev) doesn't fire the advance twice.
      let wasAlreadyDone = false;
      setDoneSet((s) => {
        if (s.has(beat.id)) {
          wasAlreadyDone = true;
          return s;
        }
        const ns = new Set(s);
        ns.add(beat.id);
        return ns;
      });

      if (wasAlreadyDone) return;
      // Beats with their own MC (paper_fold_final) don't auto-advance —
      // they wait for the MC answer.
      if (beat.mc) return;
      const next = idx + 1;
      if (next < beatCount) advanceTo(next, beat.id);
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
        speakAri("That's right — you can see it.");
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
              speakAri(
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
      if (canonical) speakAri(canonical);

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
      scaffoldedMC,
      speakAri,
    ],
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

      <TopBar progress={progress} muted={muted} onToggleSound={toggleMuted} />

      <div className="stage">
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
              const showBanner =
                idx > 0 && unlockedBanners.has(beat.id);

              return (
                <div key={beat.id}>
                  {showBanner && (
                    <div className="cell-unlock-banner" role="status">
                      <span className="cell-unlock-line" />
                      <span>
                        ▸ cell {String(idx + 1).padStart(2, '0')} unlocked
                      </span>
                      <span className="cell-unlock-line" />
                    </div>
                  )}
                  <Cell
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
                </div>
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
