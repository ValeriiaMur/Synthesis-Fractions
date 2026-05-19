'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { IconSound } from '@/components/lesson/IconSound';
import {
  getAmbientPlayer,
  type AmbientPlayer,
} from '@/lib/audio/ambientPlayer';

export type AmbientAudioProps = {
  /** Override the singleton — used by tests. */
  readonly player?: AmbientPlayer;
};

/**
 * Fixed-position toggle (top-right) for the home page's looping ambient pad.
 * The audio element + state machine live in the {@link getAmbientPlayer}
 * singleton, so re-renders never restart playback. Defaults to unmuted —
 * we attempt autoplay on mount; if the browser blocks it (no gesture yet),
 * a one-shot document-level listener retries playback on the first
 * pointerdown / keydown.
 */
export function AmbientAudio({ player: injected }: AmbientAudioProps = {}) {
  const player = injected ?? getAmbientPlayer();

  // Server snapshot is a constant default rather than `player.isMuted`: the
  // server has no localStorage and reports false, but on client hydration the
  // singleton has already read localStorage and may report true. Returning a
  // constant keeps SSR + the client's hydration paint in agreement;
  // useSyncExternalStore re-renders to the live state right after.
  const muted = useSyncExternalStore(
    player.subscribe,
    player.isMuted,
    () => false,
  );

  useEffect(() => {
    void player.start();
    const onGesture = (): void => {
      void player.start();
    };
    document.addEventListener('pointerdown', onGesture, {
      once: true,
      capture: true,
    });
    document.addEventListener('keydown', onGesture, {
      once: true,
      capture: true,
    });
    return () => {
      document.removeEventListener('pointerdown', onGesture, {
        capture: true,
      });
      document.removeEventListener('keydown', onGesture, { capture: true });
      // Soft-pause when navigating away — this is what keeps the ambient
      // loop bound to the home page. The user's mute preference is
      // untouched; returning to home calls `start()` again and resumes
      // playback unless they've muted in the meantime.
      player.pause();
    };
  }, [player]);

  const onToggle = useCallback(() => {
    void player.setMuted(!player.isMuted());
  }, [player]);

  const label = muted ? 'Play ambient music' : 'Mute ambient music';

  return (
    <button
      type="button"
      className="ambient-toggle"
      title={label}
      aria-label={label}
      aria-pressed={muted}
      onClick={onToggle}
    >
      <IconSound muted={muted} />
    </button>
  );
}
