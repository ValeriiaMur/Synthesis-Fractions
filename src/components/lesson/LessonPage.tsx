'use client';

import { createRef, useMemo, type RefObject } from 'react';
import type { Beat, BeatId, Lesson } from '@/lib/lesson/types';
import { GridBg } from '@/components/space/GridBg';
import { TopBar } from './TopBar';
import { Outro } from './Outro';
import { LessonBeatCell } from './LessonBeatCell';
import { LessonTrail } from './LessonTrail';
import type { PersistedLessonState } from '@/lib/lesson/lessonPersistence';
import { useLessonStateMachine } from '@/lib/lesson/useLessonStateMachine';
import { useLessonVoice } from '@/lib/lesson/useLessonVoice';
import { useLessonPersistence } from '@/lib/lesson/useLessonPersistence';

export type LessonPageProps = {
  readonly lesson: Lesson;
  readonly studentName?: string;
  /** Optional restore. When provided, the state machine hydrates from it
   *  instead of starting fresh. */
  readonly initialState?: PersistedLessonState | null;
};

type CellStatus = 'locked' | 'active' | 'done';

/**
 * Top-level lesson screen. Composition only — state, effects, and
 * voice wiring live in extracted hooks:
 *
 *  - `useLessonStateMachine` — state + handleManip / advance
 *  - `useLessonVoice` — speakAri + mute + mount-time voice + resume scroll
 *  - `useLessonPersistence` — localStorage snapshot + beforeunload backstop
 *
 * Phase 1 of the Montessori rebuild: one material per beat, voice quiet
 * by default, no MC / hints / celebration bubbles. See montessori-plan.md.
 */
export function LessonPage({
  lesson,
  initialState = null,
}: LessonPageProps) {
  const beats = lesson.beats;
  const beatCount = beats.length;

  const cellRefs = useMemo<readonly RefObject<HTMLDivElement | null>[]>(
    () => beats.map(() => createRef<HTMLDivElement | null>()),
    [beats],
  );

  const initialActiveIdx = initialState?.activeIdx ?? 0;
  const { speakAri, muted, toggleMuted } = useLessonVoice(
    initialActiveIdx,
    beats,
    cellRefs[initialActiveIdx],
  );

  const machine = useLessonStateMachine({
    beats,
    initialState,
    speakAri,
    cellRefs,
  });

  useLessonPersistence(lesson.id, {
    activeIdx: machine.activeIdx,
    doneSet: machine.doneSet,
    manipStates: machine.manipStates,
  });

  const statusFor = (idx: number): CellStatus => {
    const beat = beats[idx];
    if (machine.doneSet.has(beat.id)) return 'done';
    if (idx === machine.activeIdx) return 'active';
    return 'locked';
  };

  return (
    <div className="lesson-app cosmos-bg">
      {/* Doodles + Stars intentionally absent — /lesson is a focus surface;
          the home page keeps the cosmos decoration, the lesson does not. */}
      <GridBg />

      <TopBar muted={muted} onToggleSound={toggleMuted} />

      <div className="stage">
        <div className="notebook">
          <div className="notebook-inner">
            {beats.map((beat: Beat, idx: number) => (
              <LessonBeatCell
                key={beat.id}
                beat={beat}
                index={idx + 1}
                status={statusFor(idx)}
                anchorRef={cellRefs[idx]}
                manipState={machine.manipStates[beat.id as BeatId]}
                showUnlockBanner={idx > 0 && idx === machine.activeIdx}
                onManipChange={(s) => machine.handleManip(idx, s)}
              />
            ))}

            <LessonTrail allDone={machine.doneSet.size === beatCount} />

            <Outro done={machine.doneSet.size === beatCount} />
          </div>
        </div>
      </div>
    </div>
  );
}
