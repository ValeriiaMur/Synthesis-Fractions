import { useCallback, useState, type RefObject } from 'react';
import type { Beat, BeatId, ManipulativeState } from './types';
import type { PersistedLessonState } from './lessonPersistence';
import { isBeatComplete } from './completes';
import { stripMarkup } from './stripMarkup';

export type LessonStateMachine = {
  readonly activeIdx: number;
  readonly doneSet: ReadonlySet<BeatId>;
  readonly manipStates: Partial<Record<BeatId, ManipulativeState>>;
  readonly handleManip: (idx: number, state: ManipulativeState) => void;
};

export type UseLessonStateMachineDeps = {
  readonly beats: readonly Beat[];
  readonly initialState?: PersistedLessonState | null;
  readonly speakAri: (text: string) => void;
  readonly cellRefs: readonly RefObject<HTMLDivElement | null>[];
};

/**
 * Owns the lesson state + the single action the kid can take (complete a
 * manipulative, which advances). Pure dispatch — no fetch, no async races.
 *
 * Phase 1 of the Montessori rebuild: naming-first lessons + a single
 * equivalence beat. No MC, no hints, no celebration bubbles.
 */
export function useLessonStateMachine({
  beats,
  initialState = null,
  speakAri,
  cellRefs,
}: UseLessonStateMachineDeps): LessonStateMachine {
  const beatCount = beats.length;

  const [activeIdx, setActiveIdx] = useState(() => initialState?.activeIdx ?? 0);
  const [doneSet, setDoneSet] = useState<ReadonlySet<BeatId>>(
    () => new Set(initialState?.doneIds ?? []),
  );
  const [manipStates, setManipStates] = useState<
    Partial<Record<BeatId, ManipulativeState>>
  >(() => ({ ...(initialState?.manipStates ?? {}) }));

  const advanceTo = useCallback(
    (next: number) => {
      if (next >= beatCount) return;
      const nextBeat = beats[next];
      setActiveIdx(next);
      speakAri(stripMarkup(nextBeat.prose));
      window.setTimeout(() => {
        cellRefs[next]?.current?.scrollIntoView?.({
          behavior: 'smooth',
          block: 'center',
        });
      }, 250);
    },
    [beatCount, beats, cellRefs, speakAri],
  );

  const handleManip = useCallback(
    (idx: number, state: ManipulativeState) => {
      const beat = beats[idx];
      setManipStates((m) => ({ ...m, [beat.id]: state }));
      if (!isBeatComplete(beat, state)) return;

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
      const next = idx + 1;
      if (next < beatCount) advanceTo(next);
    },
    [advanceTo, beats, beatCount],
  );

  return { activeIdx, doneSet, manipStates, handleManip };
}
