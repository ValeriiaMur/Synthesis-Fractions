'use client';

import { useState, useSyncExternalStore } from 'react';
import { LessonPage } from '@/components/lesson/LessonPage';
import { NamePrompt } from '@/components/lesson/NamePrompt';
import { ResumePrompt } from '@/components/lesson/ResumePrompt';
import { lesson } from '@/lib/lesson/lessonData';
import { titleCaseName } from '@/lib/lesson/titleCaseName';
import {
  correctedLessonState,
  decodeLessonState,
  hasMeaningfulProgress,
  storageKey,
  type PersistedLessonState,
} from '@/lib/lesson/lessonPersistence';

const NAME_KEY = 'synthesis:lesson:studentName';
const NAME_EVENT = 'synthesis:lesson:name-set';

function readName(): string | null {
  try {
    const v = window.localStorage.getItem(NAME_KEY);
    if (!v) return null;
    const normalized = titleCaseName(v);
    return normalized || null;
  } catch {
    return null;
  }
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(NAME_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(NAME_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

type ResumeStatus =
  | { readonly kind: 'pending'; readonly saved: PersistedLessonState }
  | { readonly kind: 'resume'; readonly saved: PersistedLessonState }
  | { readonly kind: 'fresh' };

function initialResumeStatus(): ResumeStatus {
  if (typeof window === 'undefined') return { kind: 'fresh' };
  try {
    const decoded = decodeLessonState(
      window.localStorage.getItem(storageKey(lesson.id)),
      lesson.id,
    );
    if (decoded && hasMeaningfulProgress(decoded)) {
      // Repair stale snapshots whose activeIdx points at a beat that was
      // already marked done (correct-MC ran but the 600ms-deferred advanceTo
      // never got to fire before the tab closed). See `correctedLessonState`
      // in lessonPersistence.ts.
      const saved = correctedLessonState(decoded, lesson.beats);
      return { kind: 'pending', saved };
    }
  } catch {
    // localStorage unavailable — start fresh.
  }
  return { kind: 'fresh' };
}

export default function LessonRoute() {
  const name = useSyncExternalStore(subscribe, readName, () => null);
  const [resume, setResume] = useState<ResumeStatus>(initialResumeStatus);

  const handleSubmitName = (value: string) => {
    const normalized = titleCaseName(value);
    if (!normalized) return;
    try {
      window.localStorage.setItem(NAME_KEY, normalized);
    } catch {
      // ignore — fall through to in-memory state via the event.
    }
    window.dispatchEvent(new Event(NAME_EVENT));
  };

  if (!name) return <NamePrompt onSubmit={handleSubmitName} />;

  if (resume.kind === 'pending') {
    return (
      <ResumePrompt
        studentName={name}
        activeBeatNumber={resume.saved.activeIdx + 1}
        totalBeats={lesson.beats.length}
        onResume={() => setResume({ kind: 'resume', saved: resume.saved })}
        onStartOver={() => {
          try {
            window.localStorage.removeItem(storageKey(lesson.id));
          } catch {
            // ignore — start fresh in-memory anyway.
          }
          setResume({ kind: 'fresh' });
        }}
      />
    );
  }

  return (
    <LessonPage
      lesson={lesson}
      studentName={name}
      initialState={resume.kind === 'resume' ? resume.saved : null}
    />
  );
}
