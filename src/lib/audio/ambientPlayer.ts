// Client-side ambient music player. Owns one looping <audio> element and a
// mute state mirrored to localStorage.
//
// Design notes:
//   - Default is muted. The first user interaction (clicking the toggle)
//     counts as the gesture that lets the browser start playback.
//   - setMuted(false) calls audio.play() — autoplay rejection (no user
//     gesture yet) is swallowed; the stored intent still flips to unmuted
//     so the icon reflects "the user wants sound".
//   - setMuted(true) calls audio.pause().
//   - subscribe(cb) lets React mirror the mute flag via useSyncExternalStore.

export type AmbientPlayer = {
  /** Attempt playback if currently unmuted. Used on mount and after the
   *  first user-gesture retry to satisfy browser autoplay policies. No-op
   *  when muted; rejection (autoplay blocked) is swallowed. */
  readonly start: () => Promise<void>;
  /** Soft-pause the ambient audio without flipping the user's mute
   *  preference. Used when the host component unmounts (e.g. navigating
   *  away from the home page) so the loop doesn't bleed into other
   *  pages. Returning to the page calls `start()` which resumes playback
   *  if the user hasn't muted in the meantime. */
  readonly pause: () => void;
  readonly setMuted: (muted: boolean) => Promise<void>;
  readonly isMuted: () => boolean;
  readonly subscribe: (listener: (muted: boolean) => void) => () => void;
};

export type AmbientPlayerDeps = {
  readonly audio: {
    readonly play: () => Promise<void>;
    /** Pauses the audio element without touching the `muted` property —
     *  the soft-pause used by `pause()`. */
    readonly pause: () => void;
    /** Sets the audio element's `muted` property. Race-free silence even
     *  when an in-flight `play()` Promise hasn't resolved yet. */
    readonly setMuted: (muted: boolean) => void;
  };
  readonly storage: {
    readonly get: () => boolean;
    readonly set: (muted: boolean) => void;
  };
};

export function createAmbientPlayer(deps: AmbientPlayerDeps): AmbientPlayer {
  let muted = deps.storage.get();
  const listeners = new Set<(muted: boolean) => void>();

  const notify = (): void => {
    for (const l of listeners) l(muted);
  };

  const setMuted = async (next: boolean): Promise<void> => {
    if (muted === next) return;
    muted = next;
    deps.storage.set(next);
    // Flip the audio element's `muted` first — that's instantaneous and
    // can't be defeated by a pending `play()` Promise. Then kick playback
    // back on when unmuting in case the element was paused for any reason
    // (autoplay block, hidden tab).
    deps.audio.setMuted(next);
    if (!next) {
      try {
        await deps.audio.play();
      } catch {
        // Autoplay blocked — fine. User can click the toggle again.
      }
    }
    notify();
  };

  const start = async (): Promise<void> => {
    if (muted) return;
    try {
      await deps.audio.play();
    } catch {
      // Autoplay blocked — the first-gesture retry in the component handles it.
    }
  };

  const pause = (): void => {
    // Soft pause. Does not touch `muted` so the user's "wants sound"
    // preference (and the icon state) stays where it was.
    deps.audio.pause();
  };

  const isMuted = (): boolean => muted;

  const subscribe = (listener: (muted: boolean) => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return { start, pause, setMuted, isMuted, subscribe };
}

// ---------------------------------------------------------------------------
// Default singleton — one <audio loop> element + localStorage. Built lazily
// so SSR never touches `window`.

const STORAGE_KEY = 'synthesis:ambient:muted';
export const AMBIENT_SRC = '/audio/ambient.mp3';

function defaultStorage(): AmbientPlayerDeps['storage'] {
  return {
    get: () => {
      // Default unmuted. Browsers will block autoplay until the user
      // interacts with the page; the component's first-gesture listener
      // retries playback then.
      if (typeof window === 'undefined') return false;
      try {
        const v = window.localStorage.getItem(STORAGE_KEY);
        return v === null ? false : v === '1';
      } catch {
        return false;
      }
    },
    set: (muted) => {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
      } catch {
        // ignore — quota / disabled
      }
    },
  };
}

let _default: AmbientPlayer | null = null;

/** Survives Next.js dev HMR — without this, a hot-reload would create a
 *  fresh audio element while the old one kept playing forever. */
type AmbientWindow = Window & {
  __synthesisAmbientAudio?: HTMLAudioElement;
};

export function getAmbientPlayer(): AmbientPlayer {
  if (_default) return _default;
  if (typeof window === 'undefined') {
    // SSR fallback — never plays, just reflects "muted".
    _default = createAmbientPlayer({
      audio: {
        play: () => Promise.resolve(),
        pause: () => {},
        setMuted: () => {},
      },
      storage: defaultStorage(),
    });
    return _default;
  }
  const w = window as AmbientWindow;
  let el = w.__synthesisAmbientAudio;
  if (!el) {
    el = new Audio(AMBIENT_SRC);
    el.loop = true;
    el.preload = 'auto';
    el.volume = 0.35;
    w.__synthesisAmbientAudio = el;
  }
  // Mirror the stored mute state onto the element now so HMR-reloaded code
  // doesn't inherit a stale `muted` flag.
  const initialMuted = defaultStorage().get();
  el.muted = initialMuted;
  _default = createAmbientPlayer({
    audio: {
      play: () => el!.play(),
      pause: () => el!.pause(),
      setMuted: (m) => {
        el!.muted = m;
        if (m) el!.pause();
      },
    },
    storage: defaultStorage(),
  });
  return _default;
}
