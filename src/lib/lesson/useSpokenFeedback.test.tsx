import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const speakMock = vi.fn();
vi.mock('@/lib/voice/voicePlayer', () => ({
  getVoicePlayer: () => ({
    speak: speakMock,
    stop: vi.fn(),
    setMuted: vi.fn(),
    isMuted: () => false,
    subscribe: () => () => {},
  }),
}));

import { useSpokenFeedback } from './useSpokenFeedback';

beforeEach(() => {
  speakMock.mockReset();
  vi.useRealTimers();
});

describe('useSpokenFeedback', () => {
  it('speaks the first line immediately', () => {
    const { result } = renderHook(() => useSpokenFeedback(1000));
    result.current('one half');
    expect(speakMock).toHaveBeenCalledWith('one half');
  });

  it('throttles a rapid second line within the gap', () => {
    const { result } = renderHook(() => useSpokenFeedback(1000));
    result.current('one half');
    result.current('one quarter'); // immediately after — should be dropped
    expect(speakMock).toHaveBeenCalledTimes(1);
  });

  it('speaks again once the gap has elapsed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(100_000);
    const { result } = renderHook(() => useSpokenFeedback(1000));
    result.current('one half');
    vi.setSystemTime(101_200);
    result.current('one quarter');
    expect(speakMock).toHaveBeenCalledTimes(2);
    expect(speakMock).toHaveBeenLastCalledWith('one quarter');
  });
});
