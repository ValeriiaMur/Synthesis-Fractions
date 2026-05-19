// Client-side voice player. Singleton queue that plays tutor lines in order.
//
// Design:
//   - speak(text) enqueues. If a worker isn't already draining, one starts.
//   - The worker fetches audio via deps.fetchAudio, then plays via deps.play.
//   - Mute is a hard floor: muted ⇒ no fetch, no play, drain pending queue.
//   - Mute is persisted via deps.storage (localStorage in the default player).
//   - subscribe(cb) fires on mute changes; useful for UI mute toggles.
//
// In-flight behaviour: if mute flips ON while a line is already playing, that
// line *finishes*. We don't try to interrupt the underlying <audio>. The
// pending queue is dropped immediately.

import { fetchTTS } from './ttsClient';

export type VoicePlayer = {
  readonly speak: (text: string) => void;
  readonly stop: () => void;
  readonly setMuted: (muted: boolean) => void;
  readonly isMuted: () => boolean;
  readonly subscribe: (listener: (muted: boolean) => void) => () => void;
};

export type VoicePlayerDeps = {
  readonly fetchAudio: (text: string) => Promise<Blob>;
  /** Plays the blob to natural end. If `opts.signal` is passed and gets
   *  aborted mid-playback, the implementation should stop the audio and
   *  resolve the promise. `stop()` uses this to cut Ari mid-sentence when
   *  the lesson page unmounts so audio doesn't bleed into the home page. */
  readonly play: (
    blob: Blob,
    opts?: { readonly signal?: AbortSignal },
  ) => Promise<void>;
  readonly storage: {
    readonly get: () => boolean;
    readonly set: (muted: boolean) => void;
  };
};

export function createVoicePlayer(deps: VoicePlayerDeps): VoicePlayer {
  const queue: string[] = [];
  let muted = deps.storage.get();
  let draining = false;
  /** AbortController for the currently-playing utterance. `stop()` aborts
   *  it so the in-flight `<audio>` cuts mid-line instead of running to
   *  natural end. Null when nothing is playing. */
  let currentAbort: AbortController | null = null;
  const listeners = new Set<(muted: boolean) => void>();

  const notify = (): void => {
    for (const l of listeners) l(muted);
  };

  const drain = async (): Promise<void> => {
    draining = true;
    try {
      while (queue.length > 0) {
        if (muted) {
          queue.length = 0;
          return;
        }
        const text = queue.shift();
        if (!text) continue;
        let blob: Blob;
        try {
          blob = await deps.fetchAudio(text);
        } catch {
          // Skip this line; keep draining the rest.
          continue;
        }
        if (muted) {
          queue.length = 0;
          return;
        }
        const ac = new AbortController();
        currentAbort = ac;
        try {
          await deps.play(blob, { signal: ac.signal });
        } catch {
          // Playback failed (autoplay block, decode error). Move on.
        }
        currentAbort = null;
      }
    } finally {
      draining = false;
    }
  };

  const speak = (text: string): void => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (muted) return;
    queue.push(trimmed);
    if (!draining) void drain();
  };

  const stop = (): void => {
    queue.length = 0;
    if (currentAbort) {
      currentAbort.abort();
      currentAbort = null;
    }
  };

  const setMuted = (next: boolean): void => {
    if (muted === next) return;
    muted = next;
    deps.storage.set(next);
    if (next) queue.length = 0;
    notify();
  };

  const isMuted = (): boolean => muted;

  const subscribe = (listener: (muted: boolean) => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { speak, stop, setMuted, isMuted, subscribe };
}

// ---------------------------------------------------------------------------
// Default singleton — wires the factory to real fetch + HTMLAudio + localStorage.

const MUTE_STORAGE_KEY = 'synthesis:voice:muted';

function defaultStorage(): VoicePlayerDeps['storage'] {
  return {
    get: () => {
      if (typeof window === 'undefined') return false;
      try {
        return window.localStorage.getItem(MUTE_STORAGE_KEY) === '1';
      } catch {
        return false;
      }
    },
    set: (muted) => {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? '1' : '0');
      } catch {
        // ignore — quota / disabled
      }
    },
  };
}

async function playBlob(
  blob: Blob,
  opts?: { readonly signal?: AbortSignal },
): Promise<void> {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  try {
    await new Promise<void>((resolve, reject) => {
      if (opts?.signal?.aborted) {
        audio.pause();
        resolve();
        return;
      }
      const onAbort = (): void => {
        audio.pause();
        audio.src = '';
        resolve();
      };
      opts?.signal?.addEventListener('abort', onAbort, { once: true });
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('audio playback failed'));
      // play() returns a Promise; rejection means the browser blocked it.
      void audio.play().catch(reject);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

let _default: VoicePlayer | null = null;

/** Lazily-built default player so SSR doesn't touch window. */
export function getVoicePlayer(): VoicePlayer {
  if (_default) return _default;
  _default = createVoicePlayer({
    fetchAudio: fetchTTS,
    play: playBlob,
    storage: defaultStorage(),
  });
  return _default;
}
