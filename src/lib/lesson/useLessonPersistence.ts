import { useCallback, useEffect, useRef } from 'react';
import type { BeatId, ManipulativeState } from './types';
import { snapshotLesson, storageKey } from './lessonPersistence';

export type LessonStateForPersistence = {
  readonly activeIdx: number;
  readonly doneSet: ReadonlySet<BeatId>;
  readonly manipStates: Partial<Record<BeatId, ManipulativeState>>;
};

/**
 * Persists the lesson snapshot to localStorage on every meaningful state
 * change, plus a beforeunload/pagehide flush so the freshest in-memory
 * state lands on disk if the user closes the tab between a React commit
 * and the effect firing.
 *
 * Synchronous write — no rAF batching.
 */
export function useLessonPersistence(
  lessonId: string,
  state: LessonStateForPersistence,
): void {
  const buildSnapshot = useCallback(
    () =>
      snapshotLesson(lessonId, {
        activeIdx: state.activeIdx,
        doneIds: Array.from(state.doneSet),
        manipStates: state.manipStates,
      }),
    [lessonId, state.activeIdx, state.doneSet, state.manipStates],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        storageKey(lessonId),
        JSON.stringify(buildSnapshot()),
      );
    } catch {
      // localStorage can throw if disabled / over quota; ignore.
    }
  }, [lessonId, buildSnapshot]);

  const buildSnapshotRef = useRef(buildSnapshot);
  useEffect(() => {
    buildSnapshotRef.current = buildSnapshot;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const flush = (): void => {
      try {
        window.localStorage.setItem(
          storageKey(lessonId),
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
  }, [lessonId]);
}
