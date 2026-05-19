import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createAmbientPlayer,
  type AmbientPlayerDeps,
} from './ambientPlayer';

function makeDeps(overrides: Partial<AmbientPlayerDeps> = {}): {
  readonly deps: AmbientPlayerDeps;
  readonly play: ReturnType<typeof vi.fn>;
  readonly pauseAudio: ReturnType<typeof vi.fn>;
  readonly setAudioMuted: ReturnType<typeof vi.fn>;
  readonly storage: { value: boolean };
} {
  const storage = { value: false };
  const play = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const pauseAudio = vi.fn<() => void>();
  const setAudioMuted = vi.fn<(muted: boolean) => void>();

  const deps: AmbientPlayerDeps = {
    audio: { play, pause: pauseAudio, setMuted: setAudioMuted },
    storage: {
      get: () => storage.value,
      set: (v) => {
        storage.value = v;
      },
    },
    ...overrides,
  };

  return { deps, play, pauseAudio, setAudioMuted, storage };
}

describe('ambientPlayer', () => {
  it('defaults to unmuted (storage default false)', () => {
    const { deps } = makeDeps();
    const player = createAmbientPlayer(deps);
    expect(player.isMuted()).toBe(false);
  });

  it('reads initial mute state from storage', () => {
    const { deps, storage } = makeDeps();
    storage.value = true;
    const player = createAmbientPlayer(deps);
    expect(player.isMuted()).toBe(true);
  });

  it('setMuted(false) flips audio.muted off, plays, and persists', async () => {
    const { deps, play, setAudioMuted, storage } = makeDeps();
    storage.value = true;
    const player = createAmbientPlayer(deps);

    await player.setMuted(false);

    expect(setAudioMuted).toHaveBeenCalledWith(false);
    expect(play).toHaveBeenCalledOnce();
    expect(storage.value).toBe(false);
    expect(player.isMuted()).toBe(false);
  });

  it('setMuted(true) flips audio.muted on and persists', async () => {
    const { deps, setAudioMuted, storage } = makeDeps();
    const player = createAmbientPlayer(deps);

    await player.setMuted(true);

    expect(setAudioMuted).toHaveBeenCalledWith(true);
    expect(storage.value).toBe(true);
    expect(player.isMuted()).toBe(true);
  });

  it('no-ops when setMuted is called with the same value', async () => {
    const { deps, play, setAudioMuted } = makeDeps();
    const player = createAmbientPlayer(deps);

    await player.setMuted(false); // already unmuted
    expect(play).not.toHaveBeenCalled();
    expect(setAudioMuted).not.toHaveBeenCalled();

    await player.setMuted(true);
    await player.setMuted(true); // already muted
    expect(setAudioMuted).toHaveBeenCalledTimes(1);
  });

  it('swallows audio.play() rejection (autoplay block) and still flips state', async () => {
    const { deps, play, storage } = makeDeps();
    storage.value = true;
    play.mockRejectedValueOnce(new Error('autoplay blocked'));
    const player = createAmbientPlayer(deps);

    await player.setMuted(false);

    expect(player.isMuted()).toBe(false);
    expect(storage.value).toBe(false);
  });

  it('start() calls audio.play() when unmuted', async () => {
    const { deps, play } = makeDeps();
    const player = createAmbientPlayer(deps);
    await player.start();
    expect(play).toHaveBeenCalledOnce();
  });

  it('start() is a no-op when muted', async () => {
    const { deps, play } = makeDeps();
    deps.storage.set(true);
    // Re-create so the player picks up muted state.
    const player = createAmbientPlayer({
      ...deps,
      storage: { get: () => true, set: deps.storage.set },
    });
    await player.start();
    expect(play).not.toHaveBeenCalled();
  });

  it('start() swallows play() rejection (autoplay block)', async () => {
    const { deps, play } = makeDeps();
    play.mockRejectedValueOnce(new Error('autoplay blocked'));
    const player = createAmbientPlayer(deps);
    await expect(player.start()).resolves.toBeUndefined();
  });

  it('pause() pauses the audio without changing the mute preference', () => {
    const { deps, pauseAudio, storage } = makeDeps();
    const player = createAmbientPlayer(deps);

    expect(player.isMuted()).toBe(false);
    player.pause();

    expect(pauseAudio).toHaveBeenCalledOnce();
    // Soft pause — user's "wants sound" preference is unchanged.
    expect(player.isMuted()).toBe(false);
    expect(storage.value).toBe(false);
  });

  it('pause() does not notify mute subscribers', () => {
    const { deps } = makeDeps();
    const player = createAmbientPlayer(deps);
    const listener = vi.fn();
    player.subscribe(listener);
    player.pause();
    expect(listener).not.toHaveBeenCalled();
  });

  it('notifies subscribers on mute changes only', async () => {
    const { deps, storage } = makeDeps();
    storage.value = true; // start muted so the first transition fires
    const player = createAmbientPlayer(deps);
    const listener = vi.fn();
    const unsub = player.subscribe(listener);

    await player.setMuted(false);
    await player.setMuted(false); // no-op
    await player.setMuted(true);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, false);
    expect(listener).toHaveBeenNthCalledWith(2, true);

    unsub();
    await player.setMuted(false);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
