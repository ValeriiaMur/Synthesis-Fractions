import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { AmbientAudio } from './AmbientAudio';
import type { AmbientPlayer } from '@/lib/audio/ambientPlayer';

function makePlayer(initialMuted = true): {
  readonly player: AmbientPlayer;
  readonly setMuted: ReturnType<typeof vi.fn>;
  readonly start: ReturnType<typeof vi.fn>;
  readonly pause: ReturnType<typeof vi.fn>;
} {
  let muted = initialMuted;
  const listeners = new Set<(m: boolean) => void>();
  const setMuted = vi.fn(async (next: boolean) => {
    muted = next;
    for (const l of listeners) l(muted);
  });
  const start = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const pause = vi.fn<() => void>();
  const player: AmbientPlayer = {
    start,
    pause,
    setMuted,
    isMuted: () => muted,
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
  return { player, setMuted, start, pause };
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

  it('renders the unmuted default during SSR even if the client snapshot is muted', () => {
    // Regression: hydration mismatch. The server has no localStorage, so the
    // singleton renders muted=false; the client reads localStorage and the
    // hook's serverSnapshot used to read the live player, returning a stale
    // value that didn't match the SSR HTML. The serverSnapshot must be a
    // constant default so SSR + client first paint agree; useSyncExternalStore
    // then silently re-renders to the real client state.
    const { player } = makePlayer(true);
    const html = renderToString(<AmbientAudio player={player} />);
    expect(html).toContain('Mute ambient music');
    expect(html).toContain('aria-pressed="false"');
  });

  it('pauses the ambient on unmount so it does not bleed into other pages', () => {
    const { player, pause } = makePlayer(false);
    const { unmount } = render(<AmbientAudio player={player} />);
    pause.mockClear();
    unmount();
    expect(pause).toHaveBeenCalled();
  });
});
