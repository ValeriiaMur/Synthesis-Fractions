import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AmbientAudio } from './AmbientAudio';
import type { AmbientPlayer } from '@/lib/audio/ambientPlayer';

function makePlayer(initialMuted = true): {
  readonly player: AmbientPlayer;
  readonly setMuted: ReturnType<typeof vi.fn>;
  readonly start: ReturnType<typeof vi.fn>;
} {
  let muted = initialMuted;
  const listeners = new Set<(m: boolean) => void>();
  const setMuted = vi.fn(async (next: boolean) => {
    muted = next;
    for (const l of listeners) l(muted);
  });
  const start = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const player: AmbientPlayer = {
    start,
    setMuted,
    isMuted: () => muted,
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
  return { player, setMuted, start };
}

describe('AmbientAudio', () => {
  it('renders a button labeled "Play ambient music" when muted', () => {
    const { player } = makePlayer(true);
    render(<AmbientAudio player={player} />);
    const btn = screen.getByRole('button', { name: /play ambient music/i });
    expect(btn).toBeVisible();
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('renders a button labeled "Mute ambient music" when unmuted', () => {
    const { player } = makePlayer(false);
    render(<AmbientAudio player={player} />);
    const btn = screen.getByRole('button', { name: /mute ambient music/i });
    expect(btn).toBeVisible();
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking toggles muted state via the player', async () => {
    const { player, setMuted } = makePlayer(true);
    render(<AmbientAudio player={player} />);
    const btn = screen.getByRole('button', { name: /play ambient music/i });

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(setMuted).toHaveBeenCalledWith(false);
  });

  it('icon updates when player state changes externally', async () => {
    const { player } = makePlayer(true);
    render(<AmbientAudio player={player} />);
    expect(
      screen.getByRole('button', { name: /play ambient music/i }),
    ).toBeVisible();

    await act(async () => {
      await player.setMuted(false);
    });

    expect(
      screen.getByRole('button', { name: /mute ambient music/i }),
    ).toBeVisible();
  });
});
