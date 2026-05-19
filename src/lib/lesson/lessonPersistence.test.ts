import { describe, it, expect } from 'vitest';
import {
  SCHEMA_VERSION,
  correctedLessonState,
  decodeLessonState,
  hasMeaningfulProgress,
  snapshotLesson,
  storageKey,
} from './lessonPersistence';
import type { PersistedLessonState } from './lessonPersistence';
import type { BeatId } from './types';

const LESSON_ID = 'fraction-equivalence-v1';

const baseInput: Omit<PersistedLessonState, 'schemaVersion' | 'lessonId'> = {
  activeIdx: 2,
  doneIds: ['chocolate_intro', 'chocolate_check'],
  mcSel: { chocolate_check: 'two' },
  mcStatus: { chocolate_check: 'correct' },
  hintAttempts: { pizza_check: 1 },
  manipStates: {
    chocolate_intro: { kind: 'chocolate', piecesOnReference: 2 },
  },
  liveHints: { chocolate_check: 'a llm hint' },
  scaffoldedMC: {},
  chat: [
    { from: 'ari', text: 'Hi Ben.' },
    { from: 'user', text: 'hello' },
  ],
};

describe('storageKey', () => {
  it('namespaces by lesson id', () => {
    expect(storageKey(LESSON_ID)).toBe(
      `synthesis:lesson:${LESSON_ID}:state`,
    );
  });
});

describe('snapshotLesson + decodeLessonState round trip', () => {
  it('round-trips a full snapshot', () => {
    const snap = snapshotLesson(LESSON_ID, baseInput);
    const decoded = decodeLessonState(JSON.stringify(snap), LESSON_ID);
    expect(decoded).not.toBeNull();
    expect(decoded?.activeIdx).toBe(2);
    expect(decoded?.doneIds).toEqual([
      'chocolate_intro',
      'chocolate_check',
    ]);
    expect(decoded?.mcSel.chocolate_check).toBe('two');
    expect(decoded?.manipStates.chocolate_intro).toEqual({
      kind: 'chocolate',
      piecesOnReference: 2,
    });
    expect(decoded?.chat).toHaveLength(2);
  });

  it('caps chat at 60 turns in the snapshot', () => {
    const longChat = Array.from({ length: 80 }, (_, i) => ({
      from: 'ari' as const,
      text: `msg ${i}`,
    }));
    const snap = snapshotLesson(LESSON_ID, { ...baseInput, chat: longChat });
    expect(snap.chat).toHaveLength(60);
    expect(snap.chat[0].text).toBe('msg 20');
    expect(snap.chat[59].text).toBe('msg 79');
  });
});

describe('decodeLessonState — defensive parsing', () => {
  it('returns null for missing payload', () => {
    expect(decodeLessonState(null, LESSON_ID)).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(decodeLessonState('not json', LESSON_ID)).toBeNull();
  });

  it('returns null for a different lesson id', () => {
    const snap = snapshotLesson('other-lesson', baseInput);
    expect(decodeLessonState(JSON.stringify(snap), LESSON_ID)).toBeNull();
  });

  it('returns null when schema version does not match', () => {
    const raw = JSON.stringify({
      schemaVersion: SCHEMA_VERSION + 1,
      lessonId: LESSON_ID,
      activeIdx: 0,
      doneIds: [],
      mcSel: {},
      mcStatus: {},
      hintAttempts: {},
      manipStates: {},
      liveHints: {},
      scaffoldedMC: {},
      chat: [],
    });
    expect(decodeLessonState(raw, LESSON_ID)).toBeNull();
  });

  it('drops invalid manipulative state shapes silently', () => {
    const snap = snapshotLesson(LESSON_ID, {
      ...baseInput,
      manipStates: {
        chocolate_intro: {
          // wrong shape — should be filtered out
          ...({ kind: 'chocolate' } as unknown as never),
        } as never,
      },
    });
    const decoded = decodeLessonState(JSON.stringify(snap), LESSON_ID);
    expect(decoded?.manipStates).toEqual({});
  });

  it('drops chat entries with malformed shape', () => {
    const raw = JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      lessonId: LESSON_ID,
      activeIdx: 0,
      doneIds: [],
      mcSel: {},
      mcStatus: {},
      hintAttempts: {},
      manipStates: {},
      liveHints: {},
      scaffoldedMC: {},
      chat: [
        { from: 'ari', text: 'good' },
        { from: 'mars', text: 'bad-from' },
        { from: 'user' },
        'totally bad',
      ],
    });
    const decoded = decodeLessonState(raw, LESSON_ID);
    expect(decoded?.chat).toEqual([{ from: 'ari', text: 'good' }]);
  });
});

describe('correctedLessonState', () => {
  const beats: readonly { id: BeatId }[] = [
    { id: 'chocolate_intro' },
    { id: 'chocolate_check' },
    { id: 'pizza_explore' },
    { id: 'pizza_check' },
    { id: 'paper_fold_final' },
    { id: 'fraction_box_explore' },
  ];

  it('returns the state unchanged when the active beat is not done', () => {
    const snap = snapshotLesson(LESSON_ID, {
      ...baseInput,
      activeIdx: 2,
      doneIds: ['chocolate_intro', 'chocolate_check'],
    });
    const fixed = correctedLessonState(snap, beats);
    expect(fixed).toBe(snap);
  });

  it('advances activeIdx past a single done beat that the snapshot was stuck on', () => {
    // Mirrors the real bug: correct MC fires, doneSet adds the beat, snapshot
    // is written, then a refresh interrupts the 600ms setTimeout that would
    // have called advanceTo. activeIdx is still N, but N is already done.
    const snap = snapshotLesson(LESSON_ID, {
      ...baseInput,
      activeIdx: 1,
      doneIds: ['chocolate_intro', 'chocolate_check'],
    });
    const fixed = correctedLessonState(snap, beats);
    expect(fixed.activeIdx).toBe(2);
  });

  it('walks past a contiguous run of done beats', () => {
    const snap = snapshotLesson(LESSON_ID, {
      ...baseInput,
      activeIdx: 0,
      doneIds: [
        'chocolate_intro',
        'chocolate_check',
        'pizza_explore',
      ],
    });
    const fixed = correctedLessonState(snap, beats);
    expect(fixed.activeIdx).toBe(3);
  });

  it('clamps at the last beat when every beat is done', () => {
    const snap = snapshotLesson(LESSON_ID, {
      ...baseInput,
      activeIdx: 0,
      doneIds: beats.map((b) => b.id),
    });
    const fixed = correctedLessonState(snap, beats);
    expect(fixed.activeIdx).toBe(beats.length - 1);
  });

  it('preserves all other fields verbatim', () => {
    const snap = snapshotLesson(LESSON_ID, {
      ...baseInput,
      activeIdx: 1,
      doneIds: ['chocolate_intro', 'chocolate_check'],
    });
    const fixed = correctedLessonState(snap, beats);
    expect(fixed.doneIds).toEqual(snap.doneIds);
    expect(fixed.mcSel).toEqual(snap.mcSel);
    expect(fixed.mcStatus).toEqual(snap.mcStatus);
    expect(fixed.hintAttempts).toEqual(snap.hintAttempts);
    expect(fixed.manipStates).toEqual(snap.manipStates);
    expect(fixed.liveHints).toEqual(snap.liveHints);
    expect(fixed.scaffoldedMC).toEqual(snap.scaffoldedMC);
    expect(fixed.chat).toEqual(snap.chat);
    expect(fixed.lessonId).toBe(snap.lessonId);
    expect(fixed.schemaVersion).toBe(snap.schemaVersion);
  });

  it('does nothing when activeIdx is past the beats array', () => {
    // Defensive: shouldn't crash if persisted state is somehow out of range.
    const snap = snapshotLesson(LESSON_ID, {
      ...baseInput,
      activeIdx: 99,
      doneIds: [],
    });
    const fixed = correctedLessonState(snap, beats);
    expect(fixed.activeIdx).toBe(99);
  });
});

describe('hasMeaningfulProgress', () => {
  it('is false on a fresh snapshot', () => {
    const snap = snapshotLesson(LESSON_ID, {
      activeIdx: 0,
      doneIds: [],
      mcSel: {},
      mcStatus: {},
      hintAttempts: {},
      manipStates: {},
      liveHints: {},
      scaffoldedMC: {},
      chat: [{ from: 'ari', text: 'hi' }],
    });
    expect(hasMeaningfulProgress(snap)).toBe(false);
  });

  it('is true once any done beats or active index advances', () => {
    expect(hasMeaningfulProgress(snapshotLesson(LESSON_ID, baseInput))).toBe(
      true,
    );
  });
});
