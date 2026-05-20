// Pure serialize/restore helpers for the LessonPage state machine. Kept
// out of LessonPage.tsx so the round-trip logic is unit-testable without
// rendering anything.
//
// Versioned: bump SCHEMA_VERSION whenever the stored shape changes; older
// snapshots are silently ignored so the lesson restarts cleanly.

import type { BeatId, ManipulativeState } from './types';

export const SCHEMA_VERSION = 7;

export type PersistedLessonState = {
  readonly schemaVersion: number;
  readonly lessonId: string;
  readonly activeIdx: number;
  readonly doneIds: readonly BeatId[];
  readonly manipStates: Readonly<Partial<Record<BeatId, ManipulativeState>>>;
};

export function storageKey(lessonId: string): string {
  return `synthesis:lesson:${lessonId}:state`;
}

export function snapshotLesson(
  lessonId: string,
  input: Omit<PersistedLessonState, 'schemaVersion' | 'lessonId'>,
): PersistedLessonState {
  return {
    schemaVersion: SCHEMA_VERSION,
    lessonId,
    activeIdx: input.activeIdx,
    doneIds: [...input.doneIds],
    manipStates: { ...input.manipStates },
  };
}

function isStringRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parseUnknownMap<T>(
  v: unknown,
  itemGuard: (x: unknown) => x is T,
): Readonly<Partial<Record<BeatId, T>>> {
  if (!isStringRecord(v)) return {};
  const out: Partial<Record<BeatId, T>> = {};
  for (const [k, val] of Object.entries(v)) {
    if (itemGuard(val)) out[k as BeatId] = val;
  }
  return out;
}

function isManipulativeState(v: unknown): v is ManipulativeState {
  if (!isStringRecord(v)) return false;
  if (v.kind === 'whole') return typeof v.split === 'boolean';
  if (v.kind === 'naming') {
    // New shape: { tapped: number[] }. Old shape: { streak: number }.
    // Either is acceptable on hydrate — old snapshots simply restore
    // with an empty tapped set (kid starts the beat from scratch) and
    // the schema version bump means most legacy snapshots are dropped
    // before we get here anyway.
    if (Array.isArray(v.tapped)) {
      return v.tapped.every((n: unknown) => typeof n === 'number');
    }
    return typeof v.streak === 'number';
  }
  if (v.kind === 'equivalence') return typeof v.placedCount === 'number';
  if (v.kind === 'paper') {
    if (!Array.isArray(v.folds)) return false;
    return v.folds.every(
      (f: unknown) => f === 'horizontal' || f === 'vertical',
    );
  }
  if (v.kind === 'recall') return typeof v.revealed === 'boolean';
  return false;
}

/**
 * Decode a raw localStorage payload. Returns null if the value is missing,
 * malformed, from a different lesson id, or from an older schema version.
 * Never throws — caller can treat null as "no resume available".
 */
export function decodeLessonState(
  raw: string | null,
  lessonId: string,
): PersistedLessonState | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isStringRecord(parsed)) return null;
  if (parsed.schemaVersion !== SCHEMA_VERSION) return null;
  if (parsed.lessonId !== lessonId) return null;
  const activeIdx =
    typeof parsed.activeIdx === 'number' &&
    Number.isInteger(parsed.activeIdx) &&
    parsed.activeIdx >= 0
      ? parsed.activeIdx
      : 0;
  const doneIds = Array.isArray(parsed.doneIds)
    ? parsed.doneIds.filter((x): x is BeatId => typeof x === 'string')
    : [];
  return {
    schemaVersion: SCHEMA_VERSION,
    lessonId,
    activeIdx,
    doneIds,
    manipStates: parseUnknownMap(parsed.manipStates, isManipulativeState),
  };
}

/**
 * Repair an `activeIdx` that points at an already-completed beat. The bug
 * this guards against: a correct answer marks the beat done synchronously
 * but the persistence write can race with the advance. Walk forward past
 * any contiguous run of done beats starting at the saved `activeIdx`.
 * Clamp at `beats.length - 1` so we never run off the end.
 */
export function correctedLessonState(
  state: PersistedLessonState,
  beats: readonly { readonly id: BeatId }[],
): PersistedLessonState {
  if (state.activeIdx < 0 || state.activeIdx >= beats.length) return state;
  const doneSet = new Set<BeatId>(state.doneIds);
  let idx = state.activeIdx;
  while (idx < beats.length - 1 && doneSet.has(beats[idx].id)) {
    idx += 1;
  }
  if (idx === state.activeIdx) return state;
  return { ...state, activeIdx: idx };
}

/** True if the persisted snapshot represents meaningful progress (anything
 *  past the initial state). Lets the UI offer Resume vs Start Over only
 *  when there's something worth resuming. */
export function hasMeaningfulProgress(state: PersistedLessonState): boolean {
  return (
    state.activeIdx > 0 ||
    state.doneIds.length > 0 ||
    Object.keys(state.manipStates).length > 0
  );
}
