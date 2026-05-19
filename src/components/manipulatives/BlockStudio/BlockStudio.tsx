'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type {
  BlockStudioConfig,
  BlockStudioQuestId,
  BlockStudioState,
  BlockStudioStepId,
  FractionBoxBar,
} from '@/lib/lesson/types';
import { fracSum, fracValue } from '@/lib/lesson/fractions';
import { DragGhostBrick } from '../DragGhostBrick';
import { BlockStudioStepper } from './BlockStudioStepper';
import { BlockStudioStepIntro } from './BlockStudioStepIntro';
import { BlockStudioRail } from './BlockStudioRail';
import { BlockStudioPalette } from './BlockStudioPalette';
import { BlockStudioInspector } from './BlockStudioInspector';
import { BlockStudioCelebration } from './BlockStudioCelebration';
import { BlockStudioToast } from './BlockStudioToast';
import {
  computeInsertIndexFromMidpoints,
  findEquivalenceGroups,
  questCheckQ1,
  questCheckQ2,
  questCheckQ3,
  stepCheckCompare,
  stepCheckPlay,
} from './blockStudioLogic';
import type {
  DragState,
  PaletteFrac,
  QuestDescriptor,
  Rail,
  StepDescriptor,
  Toast,
} from './types';

const PALETTE_COLORS: Readonly<Record<number, string>> = {
  2: '#f06b85', // red
  3: '#ffb079', // orange
  4: '#5b8cff', // blue
  6: '#5fd897', // green
  8: '#b69bff', // purple
  12: '#7fdce8', // cyan
};

function colorForDen(den: number): string {
  return PALETTE_COLORS[den] ?? '#5b8cff';
}

const ALL_STEPS: readonly StepDescriptor[] = [
  {
    id: 'play',
    num: 1,
    label: 'Play',
    eyebrow: 'Step 1 of 3 · Free play',
    title: 'Just play with the bricks',
    blurb:
      'Drag bricks from the tray onto a rail. Each rail is one whole. See which bricks fit — try filling a rail completely.',
    goal: 'Place at least 3 bricks to continue',
    goalReady: 'Nice — a few bricks down. Ready to continue.',
  },
  {
    id: 'compare',
    num: 2,
    label: 'Compare',
    eyebrow: 'Step 2 of 3 · Compare',
    title: 'Same whole, different bricks',
    blurb:
      "Fill two rails to 1 whole using a different combination on each. When the totals match, you've found an equivalence.",
    goal: 'Build the same whole two different ways',
    goalReady: 'Same whole, different bricks. That is equivalence!',
  },
  {
    id: 'quest',
    num: 3,
    label: 'Quest',
    eyebrow: 'Step 3 of 3 · Quests',
    title: 'Take on three quests',
    blurb:
      "Apply what you've learned. Each challenge is a little trickier.",
    goal: 'Complete all three quests',
    goalReady: 'All three quests done!',
  },
];

const ALL_QUESTS: Readonly<Record<BlockStudioQuestId, QuestDescriptor>> = {
  q1: {
    id: 'q1',
    task: 'Fill one rail completely. Any combination of bricks works.',
    hint: 'Drop bricks on a rail until they reach the end.',
  },
  q2: {
    id: 'q2',
    task: 'Make exactly one half on a rail — without using a 1/2 brick.',
    hint: 'Try two 1/4 bricks, or three 1/6 bricks.',
  },
  q3: {
    id: 'q3',
    task: 'Fill one rail using three different brick sizes.',
    hint: 'Try 1/2 + 1/3 + 1/6 — what other combos can you find?',
  },
};

const QUEST_CHECKS: Readonly<
  Record<BlockStudioQuestId, (rails: readonly Rail[]) => boolean>
> = {
  q1: questCheckQ1,
  q2: questCheckQ2,
  q3: questCheckQ3,
};

function newRailId(): string {
  return `rail-${Math.random().toString(36).slice(2, 8)}`;
}

function newBarId(): string {
  return `bar-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function starterRails(n: number): readonly Rail[] {
  return Array.from({ length: n }, () => ({ id: newRailId(), bars: [] }));
}

function snapshotRails(rails: readonly Rail[]): BlockStudioState['rails'] {
  return rails.map((r) => ({
    id: r.id,
    bars: r.bars.map((b) => ({
      id: b.id,
      num: b.num,
      den: b.den,
      color: b.color,
    })),
  }));
}

function railsFromSnapshot(
  rails: BlockStudioState['rails'],
): readonly Rail[] {
  return rails.map((r) => ({
    id: r.id,
    bars: r.bars.map((b) => ({ ...b })),
  }));
}

export type BlockStudioProps = {
  readonly config: BlockStudioConfig;
  readonly value?: BlockStudioState;
  readonly onChange?: (state: BlockStudioState) => void;
  readonly disabled?: boolean;
};

/**
 * Block Studio — a guided 1-2-3 fraction lesson built on multi-rail Lego
 * brick puzzles. Owns its own drag state and progression; publishes a
 * `BlockStudioState` upward whenever the snapshot changes.
 *
 * The component layout is "vertical stack" inside the lesson Cell, with a
 * side-by-side palette/mat row on landscape viewports (≥ 1:1 aspect ratio).
 * Inspector lives below.
 */
export function BlockStudio({
  config,
  value,
  onChange,
  disabled = false,
}: BlockStudioProps) {
  // Build the step list from the config (filter to authored ids preserving order).
  const steps = useMemo<readonly StepDescriptor[]>(
    () =>
      config.steps
        .map((id) => ALL_STEPS.find((s) => s.id === id))
        .filter((s): s is StepDescriptor => !!s),
    [config.steps],
  );

  const quests = useMemo<readonly QuestDescriptor[]>(
    () => config.quests.map((id) => ALL_QUESTS[id]),
    [config.quests],
  );

  const palette = useMemo<readonly PaletteFrac[]>(
    () =>
      config.palette.map((p) => ({
        num: p.num,
        den: p.den,
        color: colorForDen(p.den),
      })),
    [config.palette],
  );

  // --- core state ---------------------------------------------------------
  const [stepIdx, setStepIdx] = useState<number>(() => value?.stepIdx ?? 0);
  const [questIdx, setQuestIdx] = useState<number>(() => value?.questIdx ?? 0);
  const [maxStepReached, setMaxStepReached] = useState<number>(
    () => value?.maxStepReached ?? 0,
  );
  const [rails, setRails] = useState<readonly Rail[]>(() =>
    value?.rails ? railsFromSnapshot(value.rails) : starterRails(2),
  );
  const [completed, setCompleted] = useState<boolean>(
    () => value?.completed ?? false,
  );
  const [showComplete, setShowComplete] = useState<boolean>(
    () => value?.completed ?? false,
  );

  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverRailId, setHoverRailId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const railsRef = useRef(rails);
  useEffect(() => {
    railsRef.current = rails;
  });

  // --- toast auto-dismiss -------------------------------------------------
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  // --- progression derived values ----------------------------------------
  const currentStep = steps[stepIdx];
  const isQuestStep = currentStep?.id === 'quest';
  const currentQuest =
    isQuestStep && quests[questIdx] ? quests[questIdx] : null;

  const stepReady = useMemo(() => {
    if (!currentStep) return false;
    if (currentStep.id === 'quest') {
      const q = quests[questIdx];
      return q ? QUEST_CHECKS[q.id](rails) : false;
    }
    if (currentStep.id === 'play') return stepCheckPlay(rails);
    return stepCheckCompare(rails);
  }, [currentStep, quests, questIdx, rails]);

  // Quests done within the current run of step 3 — derived purely for the
  // published state and inspector ticks.
  const questsDoneCount = useMemo(() => {
    if (!isQuestStep) return 0;
    const past = questIdx;
    const currentDone = currentQuest
      ? QUEST_CHECKS[currentQuest.id](rails)
        ? 1
        : 0
      : 0;
    return past + currentDone;
  }, [isQuestStep, questIdx, currentQuest, rails]);

  // Auto-toast when current quest is solved (once per transition).
  const lastQuestKey = useRef<string>('');
  useEffect(() => {
    if (!isQuestStep || !currentQuest) return;
    const done = QUEST_CHECKS[currentQuest.id](rails);
    const key = `${questIdx}-${done}`;
    if (done && lastQuestKey.current !== key) {
      lastQuestKey.current = key;
      setToast({ msg: `Quest ${questIdx + 1} complete!`, kind: 'good' });
    }
  }, [isQuestStep, currentQuest, rails, questIdx]);

  // --- publish state upward ----------------------------------------------
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    onChangeRef.current?.({
      kind: 'blockstudio',
      stepIdx,
      questIdx,
      maxStepReached,
      rails: snapshotRails(rails),
      questsDone: questsDoneCount,
      completed,
    });
  }, [stepIdx, questIdx, maxStepReached, rails, questsDoneCount, completed]);

  // --- navigation --------------------------------------------------------
  const goToStep = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= steps.length) return;
      if (idx > maxStepReached + 1 && idx > stepIdx) return;
      if (idx === stepIdx) return;
      setStepIdx(idx);
      setMaxStepReached((m) => Math.max(m, idx));
      // Light reset on first time reaching steps 2/3.
      if (idx > maxStepReached) {
        if (steps[idx]?.id === 'compare') {
          setRails(starterRails(3));
          setToast({
            msg: 'Mat ready — three empty rails to compare.',
            kind: 'info',
          });
        } else if (steps[idx]?.id === 'quest') {
          setRails(starterRails(2));
          setQuestIdx(0);
          setToast({ msg: 'Quest 1 — first challenge.', kind: 'info' });
        }
      }
    },
    [maxStepReached, stepIdx, steps],
  );

  const advance = useCallback(() => {
    if (!stepReady || !currentStep) return;
    if (currentStep.id === 'quest') {
      if (questIdx < quests.length - 1) {
        setQuestIdx((i) => i + 1);
        setToast({
          msg: `Quest ${questIdx + 2} of ${quests.length}.`,
          kind: 'info',
        });
        return;
      }
      // All quests done → lesson complete
      setCompleted(true);
      setShowComplete(true);
      return;
    }
    goToStep(stepIdx + 1);
  }, [stepReady, currentStep, questIdx, quests.length, stepIdx, goToStep]);

  const restartLesson = useCallback(() => {
    setStepIdx(0);
    setQuestIdx(0);
    setMaxStepReached(0);
    setRails(starterRails(2));
    setCompleted(false);
    setShowComplete(false);
    setToast({ msg: 'Lesson restarted.', kind: 'info' });
  }, []);

  const clearMat = useCallback(() => {
    if (disabled) return;
    setRails((rs) => rs.map((r) => ({ ...r, bars: [] })));
    setToast({ msg: 'Mat cleared.', kind: 'info' });
  }, [disabled]);

  const addRail = useCallback(() => {
    if (disabled) return;
    setRails((rs) => [...rs, { id: newRailId(), bars: [] }]);
  }, [disabled]);

  const removeRail = useCallback(
    (id: string) => {
      if (disabled) return;
      setRails((rs) => (rs.length <= 1 ? rs : rs.filter((r) => r.id !== id)));
    },
    [disabled],
  );

  // --- equivalence highlight ---------------------------------------------
  const equivIds = useMemo(() => {
    const groups = findEquivalenceGroups(rails);
    const set = new Set<string>();
    for (const g of groups) {
      for (const id of g.railIds) set.add(id);
    }
    return set;
  }, [rails]);

  // --- drag handling -----------------------------------------------------
  const startDrag = useCallback(
    (
      e: ReactPointerEvent<HTMLDivElement>,
      src:
        | { readonly source: 'palette'; readonly frac: PaletteFrac }
        | {
            readonly source: 'workspace';
            readonly fromRailId: string;
            readonly barId: string;
            readonly frac: PaletteFrac;
          },
    ) => {
      if (disabled) return;
      e.preventDefault();
      const r = e.currentTarget.getBoundingClientRect();
      const base = {
        x: e.clientX,
        y: e.clientY,
        gx: e.clientX - r.left,
        gy: e.clientY - r.top,
        w: r.width,
        h: r.height,
      };
      if (src.source === 'palette') {
        setDrag({ source: 'palette', frac: src.frac, ...base });
      } else {
        setDrag({
          source: 'workspace',
          fromRailId: src.fromRailId,
          barId: src.barId,
          frac: src.frac,
          ...base,
        });
      }
    },
    [disabled],
  );

  useEffect(() => {
    if (!drag) return;

    const findHit = (
      ev: PointerEvent,
    ): { railId: string; railEl: HTMLElement } | null => {
      const els = document.querySelectorAll<HTMLElement>('[data-rail-id]');
      for (const el of Array.from(els)) {
        const r = el.getBoundingClientRect();
        if (
          ev.clientX >= r.left &&
          ev.clientX <= r.right &&
          ev.clientY >= r.top - 12 &&
          ev.clientY <= r.bottom + 12
        ) {
          const id = el.getAttribute('data-rail-id');
          if (id) return { railId: id, railEl: el };
        }
      }
      return null;
    };

    const onMove = (ev: PointerEvent) => {
      setDrag((d) => (d ? { ...d, x: ev.clientX, y: ev.clientY } : d));
      const hit = findHit(ev);
      setHoverRailId(hit?.railId ?? null);
    };

    const onUp = (ev: PointerEvent) => {
      const hit = findHit(ev);
      const cur = railsRef.current;

      if (drag.source === 'palette') {
        if (hit) {
          const target = cur.find((r) => r.id === hit.railId);
          if (target) {
            const s = fracSum(target.bars);
            const wouldBe = fracValue(s) + drag.frac.num / drag.frac.den;
            if (wouldBe > 1 + 1e-9) {
              setToast({
                msg: "That brick won't fit — try a smaller one or another rail.",
                kind: 'info',
              });
            } else {
              const childRects = Array.from(
                hit.railEl.querySelectorAll<HTMLElement>('[data-bar-id]'),
              ).map((el) => {
                const r = el.getBoundingClientRect();
                return { left: r.left, width: r.width };
              });
              const insertAt = computeInsertIndexFromMidpoints(
                ev.clientX,
                childRects,
              );
              const newBar: FractionBoxBar = {
                id: newBarId(),
                num: drag.frac.num,
                den: drag.frac.den,
                color: drag.frac.color,
              };
              setRails((rs) =>
                rs.map((r) => {
                  if (r.id !== hit.railId) return r;
                  const next = [...r.bars];
                  next.splice(insertAt, 0, newBar);
                  return { ...r, bars: next };
                }),
              );
              const willFill =
                Math.abs(fracValue(s) + drag.frac.num / drag.frac.den - 1) <
                1e-9;
              if (willFill) {
                window.setTimeout(
                  () =>
                    setToast({
                      msg: 'That rail equals 1 whole!',
                      kind: 'good',
                    }),
                  100,
                );
              }
            }
          }
        }
      } else {
        // workspace drag
        const fromRail = cur.find((r) => r.id === drag.fromRailId);
        const movingBar = fromRail?.bars.find((b) => b.id === drag.barId);
        if (movingBar) {
          if (!hit) {
            // dropped off any rail → remove
            setRails((rs) =>
              rs.map((r) =>
                r.id === drag.fromRailId
                  ? { ...r, bars: r.bars.filter((b) => b.id !== drag.barId) }
                  : r,
              ),
            );
          } else {
            const targetRail = cur.find((r) => r.id === hit.railId);
            if (targetRail) {
              const targetBars = targetRail.bars.filter(
                (b) => b.id !== drag.barId,
              );
              const ts = fracSum(targetBars);
              const wouldBe = fracValue(ts) + movingBar.num / movingBar.den;
              if (wouldBe > 1 + 1e-9) {
                setToast({
                  msg: "Won't fit on that rail.",
                  kind: 'info',
                });
              } else {
                const childRects = Array.from(
                  hit.railEl.querySelectorAll<HTMLElement>('[data-bar-id]'),
                )
                  .filter((el) => el.getAttribute('data-bar-id') !== drag.barId)
                  .map((el) => {
                    const r = el.getBoundingClientRect();
                    return { left: r.left, width: r.width };
                  });
                const insertAt = computeInsertIndexFromMidpoints(
                  ev.clientX,
                  childRects,
                );
                setRails((rs) =>
                  rs.map((r) => {
                    if (
                      r.id === drag.fromRailId &&
                      r.id === hit.railId
                    ) {
                      const others = r.bars.filter((b) => b.id !== drag.barId);
                      const next = [...others];
                      next.splice(insertAt, 0, movingBar);
                      return { ...r, bars: next };
                    }
                    if (r.id === drag.fromRailId) {
                      return {
                        ...r,
                        bars: r.bars.filter((b) => b.id !== drag.barId),
                      };
                    }
                    if (r.id === hit.railId) {
                      const next = [...r.bars];
                      next.splice(insertAt, 0, movingBar);
                      return { ...r, bars: next };
                    }
                    return r;
                  }),
                );
              }
            }
          }
        }
      }
      setDrag(null);
      setHoverRailId(null);
    };

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setDrag(null);
        setHoverRailId(null);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey);
    };
  }, [drag]);

  // --- intro card values -------------------------------------------------
  const currentQuestDone = currentQuest
    ? QUEST_CHECKS[currentQuest.id](rails)
    : false;
  const isLastQuest = isQuestStep && questIdx === quests.length - 1;
  const introTitle =
    isQuestStep && currentQuest
      ? `Quest ${questIdx + 1} of ${quests.length}`
      : (currentStep?.title ?? '');
  const introBlurb =
    isQuestStep && currentQuest
      ? currentQuest.task
      : (currentStep?.blurb ?? '');
  const introEyebrow =
    isQuestStep && currentQuest
      ? `Step 3 of 3 · Quest ${questIdx + 1} of ${quests.length}`
      : (currentStep?.eyebrow ?? '');
  const introNum =
    isQuestStep && currentQuest ? questIdx + 1 : (currentStep?.num ?? 1);
  const goalText = isQuestStep
    ? currentQuestDone
      ? isLastQuest
        ? 'All done! Tap Finish.'
        : 'Tap Next quest →'
      : `Hint: ${currentQuest?.hint ?? ''}`
    : stepReady
      ? (currentStep?.goalReady ?? '')
      : (currentStep?.goal ?? '');
  const introReady = isQuestStep ? currentQuestDone : stepReady;

  const nextLabel = isQuestStep
    ? isLastQuest
      ? 'Finish lesson'
      : 'Next quest →'
    : 'Next →';

  // --- styles ------------------------------------------------------------
  const topBar: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 14,
  };

  const actions: CSSProperties = {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  };

  const ghostBtn: CSSProperties = {
    padding: '8px 14px',
    background: 'transparent',
    border: '1px solid var(--line-strong)',
    color: 'var(--ink-mute)',
    borderRadius: 10,
    fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };

  const nextBtnStyle: CSSProperties = {
    padding: '9px 16px',
    border: stepReady
      ? '1px solid var(--green)'
      : '1px solid var(--line-strong)',
    background: stepReady ? 'var(--green)' : 'rgba(255,255,255,0.04)',
    color: stepReady ? '#082216' : 'var(--ink-mute)',
    borderRadius: 10,
    fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
    fontSize: 11.5,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: stepReady && !disabled ? 'pointer' : 'not-allowed',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    animation: stepReady
      ? 'blockStudioNextPulse 1.6s ease-in-out infinite'
      : 'none',
  };

  const addRailStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 14px',
    background: 'transparent',
    border: '1px dashed var(--line-strong)',
    borderRadius: 14,
    color: 'var(--ink-mute)',
    fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
    fontSize: 11,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <div
      className="block-studio-root"
      style={{
        width: '100%',
        maxWidth: 1080,
        margin: '0 auto',
        userSelect: drag ? 'none' : 'auto',
        touchAction: 'none',
      }}
    >
      <div style={topBar}>
        <BlockStudioStepper
          steps={steps}
          stepIdx={stepIdx}
          maxStepReached={maxStepReached}
          stepReady={stepReady}
          onSelect={goToStep}
        />
        <div style={actions}>
          <button
            type="button"
            onClick={clearMat}
            disabled={disabled}
            style={ghostBtn}
          >
            Clear mat
          </button>
          <button
            type="button"
            onClick={advance}
            disabled={!stepReady || disabled}
            style={nextBtnStyle}
            title={stepReady ? 'Continue' : 'Finish this step first'}
          >
            {stepReady && isLastQuest && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7.5L5.5 11L12 3.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {nextLabel}
          </button>
        </div>
      </div>

      <div className="block-studio-grid">
        <div className="block-studio-palette-col">
          <BlockStudioPalette
            palette={palette}
            disabled={disabled}
            onStartDrag={(e, frac) =>
              startDrag(e, { source: 'palette', frac })
            }
          />
        </div>

        <div className="block-studio-mat-col">
          {currentStep && (
            <BlockStudioStepIntro
              mountKey={`step-${stepIdx}-${questIdx}`}
              eyebrow={introEyebrow}
              num={introNum}
              title={introTitle}
              blurb={introBlurb}
              goalText={goalText}
              ready={introReady}
            />
          )}

          {rails.map((r, i) => (
            <BlockStudioRail
              key={r.id}
              rail={r}
              index={i}
              drag={drag}
              hoverRailId={hoverRailId}
              isEquivWithOther={equivIds.has(r.id)}
              canRemove={rails.length > 1}
              disabled={disabled}
              onPointerDownBrick={(e, railId, bar) =>
                startDrag(e, {
                  source: 'workspace',
                  fromRailId: railId,
                  barId: bar.id,
                  frac: { num: bar.num, den: bar.den, color: bar.color },
                })
              }
              onRemoveRail={removeRail}
            />
          ))}

          <button type="button" onClick={addRail} style={addRailStyle}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 2V12M2 7H12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            Add another rail
          </button>
        </div>

        <div className="block-studio-inspector-col">
          {currentStep && (
            <BlockStudioInspector
              rails={rails}
              stepId={currentStep.id as BlockStudioStepId}
              questIdx={questIdx}
              questsTotal={quests.length}
              currentQuest={currentQuest}
            />
          )}
        </div>
      </div>

      {drag && (
        <div
          style={{
            position: 'fixed',
            left: drag.x - drag.gx,
            top: drag.y - drag.gy,
            width: drag.w,
            height: drag.h,
            pointerEvents: 'none',
            zIndex: 1000,
            transform: 'scale(1.04) rotate(-2deg)',
            transformOrigin: 'center center',
            filter: 'drop-shadow(0 18px 28px rgba(0,0,0,0.55))',
          }}
        >
          <DragGhostBrick
            num={drag.frac.num}
            den={drag.frac.den}
            color={drag.frac.color}
          />
        </div>
      )}

      {toast && <BlockStudioToast toast={toast} />}

      {showComplete && (
        <BlockStudioCelebration
          onReplay={restartLesson}
          onClose={() => setShowComplete(false)}
        />
      )}

      <style>{`
        .block-studio-grid {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .block-studio-palette-col {
          padding: 16px 18px;
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--line);
          border-radius: 16px;
        }
        .block-studio-mat-col {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .block-studio-inspector-col {
          padding: 16px 18px;
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--line);
          border-radius: 16px;
        }
        @media (min-aspect-ratio: 1/1) and (min-width: 900px) {
          .block-studio-grid {
            display: grid;
            grid-template-columns: 220px 1fr 280px;
            align-items: flex-start;
            gap: 22px;
          }
        }
        @keyframes blockStudioStepIn {
          from { transform: translateY(-8px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes brickIn {
          from { transform: translateY(-10px) scale(0.92); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes blockStudioNextPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(95,216,151,0.35); }
          50% { box-shadow: 0 0 0 6px rgba(95,216,151,0); }
        }
        @keyframes blockStudioToastIn {
          from { transform: translateY(8px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes blockStudioCompletePop {
          from { transform: translate(-50%, -42%) scale(0.86); opacity: 0; }
          to   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes blockStudioConfettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.95; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}
