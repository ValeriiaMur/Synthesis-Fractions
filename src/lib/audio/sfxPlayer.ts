// Tiny one-shot SFX player. Each `play(key)` creates a fresh Audio element
// pointed at the cached blob URL so rapid retriggers overlap naturally (two
// quick chocolate taps → two snaps, not one cut-off by the other).
//
// Mute is inherited from the voice player so the topbar's sound toggle silences
// SFX and tutor narration together — one icon, one expectation.

import { getVoicePlayer } from '@/lib/voice/voicePlayer';

export type SfxKey =
  | 'chocolateSnap'
  | 'paperFold'
  | 'wholeSplit'
  | 'hammerBreak';

export const SFX_SRC: Readonly<Record<SfxKey, string>> = {
  chocolateSnap: '/audio/sfx/chocolate-snap.mp3',
  paperFold: '/audio/sfx/paper-fold.mp3',
  wholeSplit: '/audio/sfx/whole-split.mp3',
  hammerBreak: '/audio/sfx/hammer-break.mp3',
};

type MinimalAudio = {
  src: string;
  volume: number;
  readonly play: () => void | Promise<unknown>;
};

export type SfxPlayer = {
  readonly play: (key: SfxKey) => void;
};

export type SfxPlayerDeps = {
  readonly isMuted: () => boolean;
  /** 0..1, default 0.55 — present and tactile, still under the voice. */
  readonly volume?: number;
  readonly createAudio: (src: string) => MinimalAudio;
};

export function createSfxPlayer(deps: SfxPlayerDeps): SfxPlayer {
  const volume = deps.volume ?? 0.55;
  return {
    play: (key) => {
      if (deps.isMuted()) return;
      const audio = deps.createAudio(SFX_SRC[key]);
      audio.volume = volume;
      const result = audio.play();
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        (result as Promise<unknown>).catch(() => {
          // Autoplay blocked or decode failed — SFX is non-essential, drop it.
        });
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Default singleton. Built lazily so SSR never touches `window`.

let _default: SfxPlayer | null = null;

export function getSfxPlayer(): SfxPlayer {
  if (_default) return _default;
  _default = createSfxPlayer({
    isMuted: () => {
      if (typeof window === 'undefined') return true;
      return getVoicePlayer().isMuted();
    },
    createAudio: (src) => new Audio(src),
  });
  return _default;
}
