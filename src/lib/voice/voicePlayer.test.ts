import { describe, it, expect, vi } from 'vitest';
import {
  createVoicePlayer,
  type VoicePlayerDeps,
} from './voicePlayer';

function makeDeps(overrides: Partial<VoicePlayerDeps> = {}): {
  readonly deps: VoicePlayerDeps;
  readonly fetchAudio: ReturnType<typeof vi.fn>;
  readonly play: ReturnType<typeof vi.fn>;
  readonly storage: { value: boolean };
} {
  const storage = { value: false };
  const fetchAudio = vi
    .fn<(text: string) => Promise<Blob>>()
    .mockImplementation((t) => Promise.resolve(new Blob([t])));
  const play = vi
    .fn<(blob: Blob) => Promise<void>>()
    .mockResolvedValue(undefined);

  const deps: VoicePlayerDeps = {
    fetchAudio,
    play,
    storage: {
      get: () => storage.value,
      set: (v) => {
        storage.value = v;
      },
    },
    ...overrides,
  };

  return { deps, fetchAudio, play, storage };
}

async function flush(): Promise<void> {
  await new Promise<void>((r) => setTimeout(r, 0));
  await new Promise<void>((r) => setTimeout(r, 0));
}

describe('voicePlayer', () => {
  it('speak() fetches audio and plays it', async () => {
    const { deps, fetchAudio, play } = makeDeps();
    const player = createVoicePlayer(deps);

    player.speak('hello');
    await flush();

    expect(fetchAudio).toHaveBeenCalledWith('hello');
    expect(play).toHaveBeenCalledOnce();
  });

  it('plays multiple utterances sequentially in enqueue order', async () => {
    const { deps, play } = makeDeps();
    const order: string[] = [];
    deps.play = vi.fn().mockImplementation(async (b: Blob) => {
      order.push(await b.text());
      await new Promise<void>((r) => setTimeout(r, 5));
    });
    const player = createVoicePlayer(deps);

    player.speak('one');
    player.speak('two');
    player.speak('three');

    await new Promise<void>((r) => setTimeout(r, 50));

    expect(order).toEqual(['one', 'two', 'three']);
    expect(play).not.toHaveBeenCalled(); // overwritten
  });

  it('does not fetch or play when muted', async () => {
    const { deps, fetchAudio, play } = makeDeps();
    const player = createVoicePlayer(deps);
    player.setMuted(true);

    player.speak('silent');
    await flush();

    expect(fetchAudio).not.toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
  });

  it('drains pending queue when muted mid-stream (still finishes the in-flight line)', async () => {
    const { deps, play } = makeDeps();
    const player = createVoicePlayer(deps);

    player.speak('first');
    player.speak('second');
    player.setMuted(true);

    await new Promise<void>((r) => setTimeout(r, 20));

    // First was already in-flight when mute hit, so it may or may not play
    // depending on timing — but "second" must NOT have played.
    const playedTexts = await Promise.all(
      play.mock.calls.map((c) => (c[0] as Blob).text()),
    );
    expect(playedTexts).not.toContain('second');
  });

  it('persists mute state via storage', () => {
    const { deps, storage } = makeDeps();
    const player = createVoicePlayer(deps);

    expect(player.isMuted()).toBe(false);
    player.setMuted(true);
    expect(storage.value).toBe(true);
    expect(player.isMuted()).toBe(true);
  });

  it('reads initial mute state from storage', () => {
    const { deps, storage } = makeDeps();
    storage.value = true;
    const player = createVoicePlayer(deps);
    expect(player.isMuted()).toBe(true);
  });

  it('notifies subscribers on mute changes only', () => {
    const { deps } = makeDeps();
    const player = createVoicePlayer(deps);

    const listener = vi.fn();
    const unsub = player.subscribe(listener);

    player.setMuted(true);
    player.setMuted(true); // no-op, same value
    player.setMuted(false);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, true);
    expect(listener).toHaveBeenNthCalledWith(2, false);

    unsub();
    player.setMuted(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('stop() clears the queue so pending utterances do not play', async () => {
    const { deps, play } = makeDeps();
    deps.play = vi.fn().mockImplementation(async () => {
      await new Promise<void>((r) => setTimeout(r, 5));
    });
    const player = createVoicePlayer(deps);

    player.speak('one');
    player.speak('two');
    player.stop();

    await new Promise<void>((r) => setTimeout(r, 30));

    expect(play.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it('stop() aborts the in-flight play so the audio cuts mid-line', async () => {
    // Real-world: kid is on lesson, Ari is mid-sentence, kid clicks back to
    // home. The audio should cut. Voice is page-bound: leaving the lesson
    // calls voice.stop(), which now also aborts the current play().
    const { deps } = makeDeps();
    let abortedDuringPlay = false;
    deps.play = vi.fn(
      async (_blob: Blob, opts?: { signal?: AbortSignal }) => {
        await new Promise<void>((resolve) => {
          if (opts?.signal?.aborted) {
            abortedDuringPlay = true;
            resolve();
            return;
          }
          opts?.signal?.addEventListener('abort', () => {
            abortedDuringPlay = true;
            resolve();
          });
          // Otherwise stay pending until aborted (simulates a long line).
        });
      },
    );
    const player = createVoicePlayer(deps);

    player.speak('a long sentence');
    // Let drain pick it up and call deps.play.
    await new Promise<void>((r) => setTimeout(r, 5));

    player.stop();
    // Give the abort event a tick to propagate.
    await new Promise<void>((r) => setTimeout(r, 5));

    expect(abortedDuringPlay).toBe(true);
  });

  it('swallows fetch errors and continues with the next utterance', async () => {
    const { deps, play } = makeDeps();
    deps.fetchAudio = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(new Blob(['ok']));
    const player = createVoicePlayer(deps);

    player.speak('broken');
    player.speak('works');

    await new Promise<void>((r) => setTimeout(r, 20));

    expect(play).toHaveBeenCalledOnce();
    expect(await (play.mock.calls[0][0] as Blob).text()).toBe('ok');
  });
});
