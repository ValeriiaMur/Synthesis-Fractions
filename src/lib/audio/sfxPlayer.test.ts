import { describe, it, expect, vi } from 'vitest';
import { createSfxPlayer, SFX_SRC } from './sfxPlayer';

describe('createSfxPlayer', () => {
  it('plays the requested SFX clip when not muted', () => {
    const play = vi.fn();
    const player = createSfxPlayer({
      isMuted: () => false,
      createAudio: (src) => ({ src, volume: 0, play }),
    });

    player.play('chocolateSnap');

    expect(play).toHaveBeenCalledOnce();
  });

  it('uses the configured volume on each new audio element', () => {
    const created: Array<{ src: string; volume: number }> = [];
    const player = createSfxPlayer({
      isMuted: () => false,
      volume: 0.3,
      createAudio: (src) => {
        const el = { src, volume: 0, play: vi.fn() };
        created.push(el);
        return el;
      },
    });

    player.play('chocolateSnap');

    expect(created).toHaveLength(1);
    expect(created[0].volume).toBe(0.3);
    expect(created[0].src).toBe(SFX_SRC.chocolateSnap);
  });

  it('is silent when isMuted returns true', () => {
    const play = vi.fn();
    const player = createSfxPlayer({
      isMuted: () => true,
      createAudio: (src) => ({ src, volume: 0, play }),
    });

    player.play('chocolateSnap');

    expect(play).not.toHaveBeenCalled();
  });

  it('swallows play() rejections so a blocked autoplay never throws', async () => {
    const player = createSfxPlayer({
      isMuted: () => false,
      createAudio: () => ({
        src: '',
        volume: 0,
        play: () => Promise.reject(new Error('blocked')),
      }),
    });

    expect(() => player.play('paperFold')).not.toThrow();
    // Let the microtask flush so any unhandled rejection would surface.
    await Promise.resolve();
  });

  it('exposes the expected SFX keys with /audio/sfx/* paths', () => {
    expect(SFX_SRC.chocolateSnap).toBe('/audio/sfx/chocolate-snap.mp3');
    expect(SFX_SRC.paperFold).toBe('/audio/sfx/paper-fold.mp3');
    expect(SFX_SRC.wholeSplit).toBe('/audio/sfx/whole-split.mp3');
    expect(SFX_SRC.hammerBreak).toBe('/audio/sfx/hammer-break.mp3');
  });

  it('defaults to a clearly audible volume (0.55) when none is configured', () => {
    const created: Array<{ volume: number }> = [];
    const player = createSfxPlayer({
      isMuted: () => false,
      createAudio: (src) => {
        const el = { src, volume: 0, play: vi.fn() };
        created.push(el);
        return el;
      },
    });
    player.play('chocolateSnap');
    expect(created[0].volume).toBe(0.55);
  });
});
