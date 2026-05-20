import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';

const speakMock = vi.fn<(text: string) => void>();
const stopMock = vi.fn();
const setMutedMock = vi.fn();
const isMutedMock = vi.fn<() => boolean>().mockReturnValue(false);
const subscribeMock = vi.fn<(cb: (m: boolean) => void) => () => void>(
  () => () => {},
);

vi.mock('@/lib/voice/voicePlayer', () => ({
  getVoicePlayer: () => ({
    speak: speakMock,
    stop: stopMock,
    setMuted: setMutedMock,
    isMuted: isMutedMock,
    subscribe: subscribeMock,
  }),
}));

if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function (): void {};
}

import { LessonPage } from './LessonPage';
import { lesson } from '@/lib/lesson/lessonData';

function flush(ms = 50): Promise<void> {
  return new Promise<void>((r) => setTimeout(r, ms));
}

beforeEach(() => {
  speakMock.mockReset();
  stopMock.mockReset();
  setMutedMock.mockReset();
  isMutedMock.mockReset().mockReturnValue(false);
  subscribeMock.mockReset().mockImplementation(() => () => {});
  window.localStorage.clear();
});

describe('LessonPage — Phase 1 voice + persistence', () => {
  it('speaks the first beat prose on mount and stops the queue', async () => {
    await act(async () => {
      render(<LessonPage lesson={lesson} />);
    });
    await act(async () => {
      await flush(60);
    });

    expect(stopMock).toHaveBeenCalled();
    const spoken = speakMock.mock.calls.map((c) => String(c[0]));
    // Beat 0 is now the whole intro — that's the prose that should play on mount.
    expect(spoken).toContain('This is one whole. Tap to split it in half.');
  });

  it('stops the voice queue when LessonPage unmounts', async () => {
    const { unmount } = render(<LessonPage lesson={lesson} />);
    await act(async () => {
      await flush(60);
    });

    stopMock.mockClear();
    unmount();
    expect(stopMock).toHaveBeenCalled();
  });

  it('writes the latest activeIdx to localStorage synchronously', async () => {
    await act(async () => {
      render(<LessonPage lesson={lesson} />);
    });
    await act(async () => {
      await new Promise<void>((r) => setTimeout(r, 0));
    });

    const raw = window.localStorage.getItem(
      'synthesis:lesson:fractions-naming-v1:state',
    );
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as { activeIdx: number };
    expect(parsed.activeIdx).toBe(0);
  });

  it('flushes the snapshot on beforeunload as a backstop', async () => {
    await act(async () => {
      render(<LessonPage lesson={lesson} />);
    });
    window.localStorage.removeItem(
      'synthesis:lesson:fractions-naming-v1:state',
    );
    window.dispatchEvent(new Event('beforeunload'));

    const raw = window.localStorage.getItem(
      'synthesis:lesson:fractions-naming-v1:state',
    );
    expect(raw).not.toBeNull();
  });
});
