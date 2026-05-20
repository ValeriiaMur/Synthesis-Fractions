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

const LESSON_ID = 'fractions-naming-v1';

const baseInput: Omit<PersistedLessonState, 'schemaVersion' | 'lessonId'> = {
  activeIdx: 1,
  doneIds: ['name_half'],
  manipStates: {
    name_half: { kind: 'naming', streak: 3 },
  },
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
    expect(decoded?.activeIdx).toBe(1);
    expect(decoded?.doneIds).toEqual(['name_half']);
    expect(decoded?.manipStates.name_half).toEqual({
      kind: 'naming',
      streak: 3,
    });
  });

  it('round-trips an equivalence state', () => {
    const snap = snapshotLesson(LESSON_ID, {
      activeIdx: 3,
      doneIds: ['name_half', 'name_quarter', 'mix_half_quarter'],
      manipStates: {
        equiv_half_two_quarters: { kind: 'equivalence', placedCount: 1 },
      },
    });
    const decoded = decodeLessonState(JSON.stringify(snap), LESSON_ID);
    expect(decoded?.manipStates.equiv_half_two_quarters).toEqual({
      kind: 'equivalence',
      placedCount: 1,
    });
  });

  it('round-trips a paper-fold transfer-check state', () => {
    const snap = snapshotLesson(LESSON_ID, {
      activeIdx: 4,
      doneIds: [
        'name_half',
        'name_quarter',
        'mix_half_quarter',
        'equiv_half_two_quarters',
      ],
      manipStates: {
        equiv_paper_check: { kind: 'paper', folds: ['horizontal'] },
      },
    });
    const decoded = decodeLessonState(JSON.stringify(snap), LESSON_ID);
    expect(decoded?.manipStates.equiv_paper_check).toEqual({
      kind: 'paper',
      folds: ['horizontal'],
    });
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
      manipStates: {},
    });
    expect(decodeLessonState(raw, LESSON_ID)).toBeNull();
  });

  it('drops invalid manipulative state shapes silently', () => {
    const raw = JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      lessonId: LESSON_ID,
      activeIdx: 0,
      doneIds: [],
      manipStates: {
        name_half: { kind: 'naming' }, // missing streak
      },
    });
    const decoded = decodeLessonState(raw, LESSON_ID);
    expect(decoded?.manipStates).toEqual({});
  });

  it('drops a paper state whose folds contain garbage values', () => {
    const raw = JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      lessonId: LESSON_ID,
      activeIdx: 0,
      doneIds: [],
      manipStates: {
        equiv_paper_check: { kind: 'paper', folds: ['horizontal', 'diagonal'] },
      },
    });
    const decoded = decodeLessonState(raw, LESSON_ID);
    expect(decoded?.manipStates).toEqual({});
  });
});

describe('correctedLessonState', () => {
  const beats: readonly { id: BeatId }[] = [
    { id: 'name_half' },
    { id: 'name_quarter' },
    { id: 'mix_half_quarter' },
    { id: 'equiv_half_two_quarters' },
    { id: 'equiv_paper_check' },
  ];

  it('returns the state unchanged when the active beat is not done', () => {
    const snap = snapshotLesson(LESSON_ID, {
      ...baseInput,
      activeIdx: 1,
      doneIds: ['name_half'],
    });
    const fixed = correctedLessonState(snap, beats);
    expect(fixed).toBe(snap);
  });

  it('advances activeIdx past a single done beat that the snapshot was stuck on', () => {
    const snap = snapshotLesson(LESSON_ID, {
      ...baseInput,
      activeIdx: 0,
      doneIds: ['name_half'],
    });
    const fixed = correctedLessonState(snap, beats);
    expect(fixed.activeIdx).toBe(1);
  });

  it('walks past a contiguous run of done beats', () => {
    const snap = snapshotLesson(LESSON_ID, {
      ...baseInput,
      activeIdx: 0,
      doneIds: ['name_half', 'name_quarter'],
    });
    const fixed = correctedLessonState(snap, beats);
    expect(fixed.activeIdx).toBe(2);
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
      activeIdx: 0,
      doneIds: ['name_half'],
    });
    const fixed = correctedLessonState(snap, beats);
    expect(fixed.doneIds).toEqual(snap.doneIds);
    expect(fixed.manipStates).toEqual(snap.manipStates);
    expect(fixed.lessonId).toBe(snap.lessonId);
    expect(fixed.schemaVersion).toBe(snap.schemaVersion);
  });

  it('does nothing when activeIdx is past the beats array', () => {
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
      manipStates: {},
    });
    expect(hasMeaningfulProgress(snap)).toBe(false);
  });

  it('is true once any done beats or active index advances', () => {
    expect(hasMeaningfulProgress(snapshotLesson(LESSON_ID, baseInput))).toBe(
      true,
    );
  });
});
