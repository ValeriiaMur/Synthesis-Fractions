import { describe, it, expect } from 'vitest';
import {
  SCHEMA_VERSION,
  decodeLessonState,
  hasMeaningfulProgress,
  snapshotLesson,
  storageKey,
} from './lessonPersistence';
import type { PersistedLessonState } from './lessonPersistence';

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
