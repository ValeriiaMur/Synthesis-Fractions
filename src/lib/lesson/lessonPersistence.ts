// Pure serialize/restore helpers for the LessonPage state machine. Kept
// out of LessonPage.tsx so the round-trip logic is unit-testable without
// rendering anything.
//
// Versioned: bump SCHEMA_VERSION whenever the stored shape changes; older
// snapshots are silently ignored so the lesson restarts cleanly.

import type {
  BeatId,
  ManipulativeState,
  MCConfig,
} from './types';

export const SCHEMA_VERSION = 2;

export type PersistedChatMsg = {
  readonly from: 'ari' | 'user' | 'system';
  readonly text: string;
};

export type PersistedLessonState = {
  readonly schemaVersion: number;
  readonly lessonId: string;
  readonly activeIdx: number;
  readonly doneIds: readonly BeatId[];
  readonly mcSel: Readonly<Partial<Record<BeatId, string>>>;
  readonly mcStatus: Readonly<
    Partial<Record<BeatId, 'idle' | 'wrong' | 'correct'>>
  >;
  readonly hintAttempts: Readonly<Partial<Record<BeatId, number>>>;
  readonly manipStates: Readonly<Partial<Record<BeatId, ManipulativeState>>>;
  readonly liveHints: Readonly<Partial<Record<BeatId, string>>>;
  readonly scaffoldedMC: Readonly<Partial<Record<BeatId, MCConfig>>>;
  readonly chat: readonly PersistedChatMsg[];
};

const FROM_VALUES = new Set<PersistedChatMsg['from']>(['ari', 'user', 'system']);
const MC_STATUSES = new Set(['idle', 'wrong', 'correct']);

export function storageKey(lessonId: string): string {
  return `synthesis:lesson:${lessonId}:state`;
}

/** Cap chat history written to disk so a long session doesn't bloat
 *  localStorage. We keep the most-recent N turns. */
const MAX_CHAT_TURNS = 60;

export function snapshotLesson(
  lessonId: string,
  input: Omit<PersistedLessonState, 'schemaVersion' | 'lessonId'>,
): PersistedLessonState {
  return {
    schemaVersion: SCHEMA_VERSION,
    lessonId,
    activeIdx: input.activeIdx,
    doneIds: [...input.doneIds],
    mcSel: { ...input.mcSel },
    mcStatus: { ...input.mcStatus },
    hintAttempts: { ...input.hintAttempts },
    manipStates: { ...input.manipStates },
    liveHints: { ...input.liveHints },
    scaffoldedMC: { ...input.scaffoldedMC },
    chat: input.chat.slice(-MAX_CHAT_TURNS),
  };
}

function isStringRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parseChat(v: unknown): readonly PersistedChatMsg[] {
  if (!Array.isArray(v)) return [];
  const out: PersistedChatMsg[] = [];
  for (const item of v) {
    if (!isStringRecord(item)) continue;
    const from = item.from;
    const text = item.text;
    if (
      typeof from === 'string' &&
      FROM_VALUES.has(from as PersistedChatMsg['from']) &&
      typeof text === 'string' &&
      text.length > 0
    ) {
      out.push({ from: from as PersistedChatMsg['from'], text });
    }
  }
  return out;
}

function parseMcStatusMap(
  v: unknown,
): Readonly<Partial<Record<BeatId, 'idle' | 'wrong' | 'correct'>>> {
  if (!isStringRecord(v)) return {};
  const out: Partial<Record<BeatId, 'idle' | 'wrong' | 'correct'>> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'string' && MC_STATUSES.has(val)) {
      out[k as BeatId] = val as 'idle' | 'wrong' | 'correct';
    }
  }
  return out;
}

function parseStringMap(
  v: unknown,
): Readonly<Partial<Record<BeatId, string>>> {
  if (!isStringRecord(v)) return {};
  const out: Partial<Record<BeatId, string>> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'string') out[k as BeatId] = val;
  }
  return out;
}

function parseNumberMap(
  v: unknown,
): Readonly<Partial<Record<BeatId, number>>> {
  if (!isStringRecord(v)) return {};
  const out: Partial<Record<BeatId, number>> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'number' && Number.isFinite(val)) {
      out[k as BeatId] = val;
    }
  }
  return out;
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
  const kind = v.kind;
  if (kind === 'chocolate') return typeof v.piecesOnReference === 'number';
  if (kind === 'pizza') return typeof v.sliceCount === 'number';
  if (kind === 'paper') return Array.isArray(v.folds);
  if (kind === 'fractionbox')
    return Array.isArray(v.bars) && typeof v.combos === 'number';
  if (kind === 'blockstudio') {
    return (
      typeof v.stepIdx === 'number' &&
      typeof v.questIdx === 'number' &&
      typeof v.maxStepReached === 'number' &&
      typeof v.questsDone === 'number' &&
      typeof v.completed === 'boolean' &&
      Array.isArray(v.rails)
    );
  }
  return false;
}

function isMCConfig(v: unknown): v is MCConfig {
  if (!isStringRecord(v)) return false;
  if (typeof v.question !== 'string') return false;
  if (typeof v.correctOptionId !== 'string') return false;
  if (!Array.isArray(v.options)) return false;
  if (!Array.isArray(v.canonicalHints)) return false;
  for (const opt of v.options) {
    if (!isStringRecord(opt)) return false;
    if (typeof opt.id !== 'string' || typeof opt.label !== 'string') {
      return false;
    }
  }
  for (const hint of v.canonicalHints) {
    if (typeof hint !== 'string') return false;
  }
  return true;
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
    mcSel: parseStringMap(parsed.mcSel),
    mcStatus: parseMcStatusMap(parsed.mcStatus),
    hintAttempts: parseNumberMap(parsed.hintAttempts),
    manipStates: parseUnknownMap(parsed.manipStates, isManipulativeState),
    liveHints: parseStringMap(parsed.liveHints),
    scaffoldedMC: parseUnknownMap(parsed.scaffoldedMC, isMCConfig),
    chat: parseChat(parsed.chat),
  };
}

/**
 * Repair an `activeIdx` that points at an already-completed beat. The bug
 * this guards against: a correct MC answer marks the beat done synchronously
 * but schedules the actual `advanceTo` 600ms later via `setTimeout`. The
 * persistence effect runs in between — so if the user refreshes or closes
 * the tab during that window, the saved snapshot has `activeIdx = N` with
 * `doneIds` already containing N. On resume that lands them on a "done"
 * cell whose `next` cell is still locked: stuck.
 *
 * Walk forward past any contiguous run of done beats starting at the saved
 * `activeIdx`. Clamp at `beats.length - 1` so we never run off the end.
 * The persisted snapshot is otherwise returned verbatim — only `activeIdx`
 * is touched (and only when a correction is actually needed; otherwise we
 * return the input unchanged for cheap identity equality).
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
export function hasMeaningfulProgress(
  state: PersistedLessonState,
): boolean {
  return (
    state.activeIdx > 0 ||
    state.doneIds.length > 0 ||
    Object.keys(state.manipStates).length > 0 ||
    Object.keys(state.mcSel).length > 0
  );
}
