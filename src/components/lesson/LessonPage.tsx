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
import { enterLineFor, reactToMC } from '@/lib/lesson/branching';
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
import { StudentEcho } from './StudentEcho';
import { manipSummary } from '@/lib/lesson/manipSummary';
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

/**
 * Top-level lesson screen + state machine + branching wiring.
 *
 * Layout: full-width notebook. The chat rail was retired in favour of a
 * voice-driven, view-driven experience — the kid reads (or listens to) one
 * cell, completes the exercise, and the lesson advances. Each cell is one
 * turn in a vertical chat: Prose (Ari speaks) → manipulative/MC (student
 * responds) → StudentEcho (response mirrored) → Hint/Celebration (Ari
 * reacts) → next cell unlocks.
 *
 * Fully scripted: every tutor line is authored in `lessonData.ts`. The
 * branching layer is the pure `branching.ts` module — no LLM, no network,
 * no async races. ElevenLabs TTS voices the authored lines.
 *
 * Voice contract (see also summary.md):
 *  - On mount the voice queue is cleared and the active beat's prose is
 *    queued (preceded by a one-time intro on a fresh start). Re-entering
 *    the route always starts fresh on whichever cell the kid is on.
 *  - On unmount the queue is cleared and the in-flight utterance is
 *    aborted via the AbortSignal wired into voicePlayer.
 *  - During exercises the voice is silent. speakAri only fires at four
 *    decision points: wrong MC, correct MC, advance, end-of-lesson.
 *  - Wrong MC → speak the hint chosen by `reactToMC` (per-option-specific
 *    if authored, otherwise the attempt-indexed canonical).
 *  - Correct MC → speak the authored `correctReply`; 600ms later
 *    `advanceTo` fires and queues `[enterLine, nextProse]` in visual
 *    order. No fetch, no race.
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
  const initialStudentNameRef = useRef(studentName);
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
    // First-launch only: greet the kid and frame the Spirit run before the
    // first beat's prose. Skipped on restore so the kid doesn't re-hear it.
    const intro =
      idx === 0
        ? `Hi ${initialStudentNameRef.current}, I'm Ari. We're flying the Spirit today — four stops, then home.`
        : null;
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        if (intro) voice.speak(intro);
        voice.speak(text);
      });
    });
    return () => {
      // Navigating away (or StrictMode's dev-mode remount) kills both the
      // pending queue and the *deferred* speak. With the AbortSignal wired
      // through deps.play, voice.stop() also cuts the in-flight audio so
      // Ari doesn't bleed into the next page mid-sentence.
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
      voice.stop();
    };
  }, [voice]);

  /** One-shot scroll-to-active-cell when the page mounts on a *restored*
   *  beat (Continue/Resume). Fresh starts at beat 0 don't need it — the
   *  notebook is already scrolled to the top.
   *
   *  Lands the cell at the TOP of the notebook viewport (`block: 'start'`)
   *  so the resumed cell is the first thing the kid sees — Intro + earlier
   *  cells scroll off the top. Uses instant (`auto`) behaviour for the
   *  one-shot jump; a smooth animation made it feel like the page was
   *  drifting back up to the Intro.
   *
   *  The 200ms delay gives the cell's manipulative (which mounts and may
   *  publish its initial state synchronously) time to settle so the
   *  measured scroll offset is accurate. */
  const initialCellRefRef = useRef(cellRefs[activeIdx]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initialActiveIdxRef.current === 0) return;
    const id = window.setTimeout(() => {
      const target = initialCellRefRef.current?.current;
      if (!target) return;
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 200);
    return () => window.clearTimeout(id);
  }, []);

  /** Build the current snapshot. Pulled out so the persist-on-state-change
   *  effect *and* the beforeunload backstop can serialize the same thing. */
  const buildSnapshot = useCallback(
    () =>
      snapshotLesson(lesson.id, {
        activeIdx,
        doneIds: Array.from(doneSet),
        mcSel,
        mcStatus,
        hintAttempts,
        manipStates,
        liveHints,
        scaffoldedMC,
        chat: [],
      }),
    [
      lesson.id,
      activeIdx,
      doneSet,
      mcSel,
      mcStatus,
      hintAttempts,
      manipStates,
      liveHints,
      scaffoldedMC,
    ],
  );

  /** Persist the lesson state on any meaningful change.
   *
   *  Synchronous write — no rAF batching. The rAF gap used to lose the
   *  most recent advance when the user closed the tab in the ~16ms
   *  between the state update committing and the rAF callback running.
   *  localStorage.setItem is fast (a few ms even on iPad), and effects
   *  already coalesce multiple state changes from one render pass into a
   *  single fire, so there is no measurable perf cost. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        storageKey(lesson.id),
        JSON.stringify(buildSnapshot()),
      );
    } catch {
      // localStorage can throw if disabled / over quota; ignore.
    }
  }, [lesson.id, buildSnapshot]);

  /** Belt-and-suspenders: the tab-close path. Even with synchronous
   *  writes, there's a tiny window between React committing new state
   *  and the persistence effect firing (effects run after paint). If the
   *  user closes the tab in that window, the latest commit is lost.
   *  beforeunload fires synchronously before the page tears down, so
   *  this guarantees the freshest in-memory state lands on disk. */
  const buildSnapshotRef = useRef(buildSnapshot);
  useEffect(() => {
    buildSnapshotRef.current = buildSnapshot;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const flush = (): void => {
      try {
        window.localStorage.setItem(
          storageKey(lesson.id),
          JSON.stringify(buildSnapshotRef.current()),
        );
      } catch {
        // ignore — best effort on unload
      }
    };
    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [lesson.id]);

  const statusFor = useCallback(
    (idx: number): CellStatus => {
      const beat = beats[idx];
      if (doneSet.has(beat.id)) return 'done';
      if (idx === activeIdx) return 'active';
      return 'locked';
    },
    [activeIdx, beats, doneSet],
  );

  /** Move to beat `next`. Synchronous: visual unlock + voice queue happen
   *  in the same tick. The next beat's authored `enterLine` (if any) is
   *  spoken *before* the prose, matching the visual order in the
   *  notebook (the unlock banner sits above the cell). */
  const advanceTo = useCallback(
    (next: number) => {
      if (next >= beatCount) return;
      const nextBeat = beats[next];
      setActiveIdx(next);
      setUnlockedBanners((s) => {
        if (s.has(nextBeat.id)) return s;
        const ns = new Set(s);
        ns.add(nextBeat.id);
        return ns;
      });

      const enterLine = enterLineFor(nextBeat, studentName);
      const canonicalProse = stripMarkup(nextBeat.prose);
      if (enterLine) speakAri(enterLine);
      speakAri(canonicalProse);

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
      if (next < beatCount) advanceTo(next);
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

      const prevAttempts = hintAttempts[beat.id] ?? 0;
      // Dispatch to the deterministic branching layer. The reaction tells
      // us what to say and (on correct) where to go next — no async, no
      // request guards, no swap-in races.
      const reaction = reactToMC(beat, opt.id, prevAttempts, studentName);

      if (reaction.kind === 'correct') {
        setMcStatus((s) => ({ ...s, [beat.id]: 'correct' }));
        speakAri(reaction.line);
        setDoneSet((s) => {
          const n = new Set(s);
          n.add(beat.id);
          return n;
        });
        if (reaction.nextBeatId) {
          const next = idx + 1;
          window.setTimeout(() => advanceTo(next), 600);
        } else {
          // Final beat — speak the closing line. Authored inline because
          // it isn't tied to any one beat. Move to lessonData if it grows.
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

      // Wrong answer path. Store the chosen hint so the bubble can read it.
      const nextAttemptCount = prevAttempts + 1;
      setMcStatus((s) => ({ ...s, [beat.id]: 'wrong' }));
      setHintAttempts((h) => ({ ...h, [beat.id]: nextAttemptCount }));
      setLiveHints((m) => ({ ...m, [beat.id]: reaction.line }));
      speakAri(reaction.line);

      // Scaffold swap: branching.ts already factored in the threshold +
      // whether a scaffolded variant exists. We just need to install it
      // and clear the kid's current selection so they can pick fresh.
      if (reaction.shouldScaffold && !scaffoldedMC[beat.id] && beat.mc) {
        const sc = beat.mc.scaffolded;
        if (sc) {
          const swapped: MCConfig = {
            question: sc.question,
            options: sc.options,
            correctOptionId: sc.correctOptionId,
            canonicalHints: beat.mc.canonicalHints,
            correctReply: beat.mc.correctReply,
            hintByWrongOption: beat.mc.hintByWrongOption,
          };
          setScaffoldedMC((m) => ({ ...m, [beat.id]: swapped }));
          setMcSel((m) => {
            const n = { ...m };
            delete n[beat.id];
            return n;
          });
          setMcStatus((m) => {
            const n = { ...m };
            delete n[beat.id];
            return n;
          });
          setLiveHints((m) => {
            const n = { ...m };
            delete n[beat.id];
            return n;
          });
        }
      }
    },
    [
      advanceTo,
      beats,
      hintAttempts,
      liveMCFor,
      scaffoldedMC,
      speakAri,
      studentName,
    ],
  );

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
                        {manipDone && manipSummary(manipState) && (
                          <StudentEcho done>
                            {manipSummary(manipState)}
                          </StudentEcho>
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
                        {sel && (mcs === 'wrong' || mcs === 'correct') && (
                          <StudentEcho done={mcs === 'correct'}>
                            {
                              liveMC.options.find((o) => o.id === sel)?.label ??
                                sel
                            }
                          </StudentEcho>
                        )}
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
        </div>
      </div>
    </div>
  );
}
