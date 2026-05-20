import { useCallback, useRef } from 'react';
import { getVoicePlayer } from '@/lib/voice/voicePlayer';

/** Minimum gap between two spoken feedback lines. Rapid taps would
 *  otherwise stack a queue of short utterances; the throttle keeps the
 *  voice channel calm — at most one observation per gap. */
export const FEEDBACK_MIN_GAP_MS = 1300;

/**
 * Returns a `speak(text)` for *observational feedback* spoken aloud by
 * the tutor voice. It ENQUEUES (the voice player is FIFO) rather than
 * interrupting, so a milestone line plays after the beat's entry prose
 * instead of cutting it off. Throttled so a burst of taps doesn't pile
 * up a backlog of one-liners.
 *
 * Mute is handled downstream: the voice player no-ops while muted, so
 * the topbar sound toggle silences these lines too.
 */
export function useSpokenFeedback(
  minGapMs: number = FEEDBACK_MIN_GAP_MS,
): (text: string) => void {
  const lastAt = useRef(0);
  return useCallback(
    (text: string) => {
      if (typeof window === 'undefined') return;
      const now = Date.now();
      if (now - lastAt.current < minGapMs) return;
      lastAt.current = now;
      getVoicePlayer().speak(text);
    },
    [minGapMs],
  );
}
