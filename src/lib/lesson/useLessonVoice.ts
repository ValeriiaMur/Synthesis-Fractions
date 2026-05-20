import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type RefObject,
} from 'react';
import type { Beat } from './types';
import { stripMarkup } from './stripMarkup';
import { getVoicePlayer } from '@/lib/voice/voicePlayer';
import { getAmbientPlayer } from '@/lib/audio/ambientPlayer';

export type UseLessonVoiceResult = {
  /** Defers `voice.speak` through a double-rAF so React commits + paints
   *  before audio starts fetching. The voice player itself is FIFO. */
  readonly speakAri: (text: string) => void;
  readonly muted: boolean;
  readonly toggleMuted: () => void;
};

/**
 * Owns the lesson's voice channel:
 *  - exposes `speakAri` (reveal-gated via double-rAF) + mute controls
 *  - on mount: clears the queue and speaks the active beat's prose
 *  - on a *restored* mount (activeIdx !== 0): scrolls the active cell to
 *    the top of the notebook after 200ms so the material has time to
 *    settle before we measure
 *
 * The mount voice effect manages its own rAF chain locally (cancellable
 * in cleanup) instead of routing through speakAri — under React
 * StrictMode the effect runs twice and a non-cancellable double-rAF would
 * queue the prose twice.
 */
export function useLessonVoice(
  initialActiveIdx: number,
  beats: readonly Beat[],
  activeCellRef: RefObject<HTMLDivElement | null>,
): UseLessonVoiceResult {
  const voice = useMemo(() => getVoicePlayer(), []);

  const speakAri = useCallback(
    (text: string) => {
      if (typeof window === 'undefined') {
        voice.speak(text);
        return;
      }
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          voice.speak(text);
        });
      });
    },
    [voice],
  );

  const muted = useSyncExternalStore(
    voice.subscribe,
    voice.isMuted,
    () => false,
  );
  const toggleMuted = useCallback(() => {
    const next = !voice.isMuted();
    voice.setMuted(next);
    if (next) {
      // Cut any in-flight line immediately (setMuted alone lets the current
      // utterance finish), and silence the ambient pad in case it leaked in
      // from the name-prompt sound check — so one tap silences everything.
      voice.stop();
      getAmbientPlayer().setMuted(true);
    }
  }, [voice]);

  // Capture mount-time values in refs so the effect's empty-deps semantics
  // hold even when the parent re-renders.
  const initialActiveIdxRef = useRef(initialActiveIdx);
  const initialBeatsRef = useRef(beats);

  useEffect(() => {
    voice.stop();
    // The lesson is a focus surface — no background music. Pause the
    // ambient pad in case it's still looping from the name-prompt sound
    // check; the home page resumes it on return.
    getAmbientPlayer().pause();
    const idx = initialActiveIdxRef.current;
    const startBeat = initialBeatsRef.current[idx];
    if (!startBeat || typeof window === 'undefined') {
      return () => {
        voice.stop();
      };
    }
    const text = stripMarkup(startBeat.prose);
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        voice.speak(text);
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
      voice.stop();
    };
  }, [voice]);

  const initialCellRefRef = useRef(activeCellRef);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initialActiveIdxRef.current === 0) return;
    const id = window.setTimeout(() => {
      const target = initialCellRefRef.current?.current;
      if (!target) return;
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 200);
    return () => window.clearTimeout(id);
  }, []);

  return { speakAri, muted, toggleMuted };
}
