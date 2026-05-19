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

  const muted = useSyncExternalStore(
    player.subscribe,
    player.isMuted,
    player.isMuted,
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
