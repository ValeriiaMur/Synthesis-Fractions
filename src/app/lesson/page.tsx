'use client';

import { useSyncExternalStore } from 'react';
import { LessonPage } from '@/components/lesson/LessonPage';
import { NamePrompt } from '@/components/lesson/NamePrompt';
import { lesson } from '@/lib/lesson/lessonData';
import { titleCaseName } from '@/lib/lesson/titleCaseName';

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

export default function LessonRoute() {
  const name = useSyncExternalStore(
    subscribe,
    readName,
    () => null,
  );

  const handleSubmit = (value: string) => {
    const normalized = titleCaseName(value);
    if (!normalized) return;
    try {
      window.localStorage.setItem(NAME_KEY, normalized);
    } catch {
      // localStorage may be unavailable; fall through to in-memory state via the event.
    }
    window.dispatchEvent(new Event(NAME_EVENT));
  };

  if (!name) return <NamePrompt onSubmit={handleSubmit} />;
  return <LessonPage lesson={lesson} studentName={name} />;
}
