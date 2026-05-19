import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StrictMode } from 'react';
import { render, fireEvent, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Module mocks. Must be hoisted (declared before the LessonPage import below).

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

const fetchAdvanceLineMock = vi.fn<
  (...args: unknown[]) => Promise<string | null>
>();
vi.mock('@/lib/agent/advanceClient', () => ({
  fetchAdvanceLine: (...args: unknown[]) => fetchAdvanceLineMock(...args),
}));

const fetchHintMock = vi.fn<
  (...args: unknown[]) => Promise<string | null>
>();
vi.mock('@/lib/agent/hintClient', () => ({
  fetchHint: (...args: unknown[]) => fetchHintMock(...args),
}));

const fetchScaffoldedMCMock = vi.fn<
  (...args: unknown[]) => Promise<unknown | null>
>();
vi.mock('@/lib/agent/scaffoldMCClient', () => ({
  fetchScaffoldedMC: (...args: unknown[]) => fetchScaffoldedMCMock(...args),
}));

// jsdom doesn't implement scrollIntoView on HTMLElement.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function (): void {};
}

import { LessonPage } from './LessonPage';
import { lesson } from '@/lib/lesson/lessonData';
import {
  SCHEMA_VERSION,
  type PersistedLessonState,
} from '@/lib/lesson/lessonPersistence';

function flush(ms = 50): Promise<void> {
  return new Promise<void>((r) => setTimeout(r, ms));
}

beforeEach(() => {
  speakMock.mockReset();
  stopMock.mockReset();
  setMutedMock.mockReset();
  isMutedMock.mockReset().mockReturnValue(false);
  subscribeMock.mockReset().mockImplementation(() => () => {});
  fetchAdvanceLineMock.mockReset().mockResolvedValue(null);
  fetchHintMock.mockReset().mockResolvedValue(null);
  fetchScaffoldedMCMock.mockReset().mockResolvedValue(null);
});

function freshState(
  overrides: Partial<PersistedLessonState> = {},
): PersistedLessonState {
  return {
    schemaVersion: SCHEMA_VERSION,
    lessonId: lesson.id,
    activeIdx: 0,
    doneIds: [],
    mcSel: {},
    mcStatus: {},
    hintAttempts: {},
    manipStates: {},
    liveHints: {},
    scaffoldedMC: {},
    chat: [],
    ...overrides,
  };
}

describe('LessonPage — view-driven voice', () => {
  it('clears the voice queue and speaks the active beat prose on mount', async () => {
    await act(async () => {
      render(<LessonPage lesson={lesson} studentName="Ben" />);
    });
    await act(async () => {
      await flush(60);
    });

    // voice.stop is invoked once on mount so any leftover queue is dropped.
    expect(stopMock).toHaveBeenCalled();

    const spoken = speakMock.mock.calls.map((c) => String(c[0]));
    // Beat 0 (chocolate_intro) prose was spoken.
    expect(spoken.some((s) => /snack-ration|chocolate bar/i.test(s))).toBe(
      true,
    );
    // No legacy "greeting + co-pilot" seed messages — those used to live in
    // the chat rail and shouldn't be spoken anymore.
    expect(spoken.some((s) => /co-pilot/i.test(s))).toBe(false);
    expect(spoken.some((s) => /short stops/i.test(s))).toBe(false);
  });

  it('speaks the restored beat prose on mount when initialState pins a later beat', async () => {
    const restored = freshState({
      activeIdx: 1,
      doneIds: ['chocolate_intro'],
    });

    await act(async () => {
      render(
        <LessonPage
          lesson={lesson}
          studentName="Ben"
          initialState={restored}
        />,
      );
    });
    await act(async () => {
      await flush(60);
    });

    const spoken = speakMock.mock.calls.map((c) => String(c[0]));
    // Beat 1 (chocolate_check) prose — that's the cell the kid is on.
    expect(spoken.some((s) => /flight log|count the squares/i.test(s))).toBe(
      true,
    );
  });

  it('does not double-speak the mount prose under React StrictMode', async () => {
    // Regression: the mount voice effect used to schedule voice.speak through
    // a non-cancellable double rAF inside speakAri. Under StrictMode's
    // mount → cleanup → mount cycle, each pass scheduled a fresh rAF chain
    // and the cleanup couldn't cancel them — so the same prose was queued
    // twice and played twice. Mount must be idempotent.
    await act(async () => {
      render(
        <StrictMode>
          <LessonPage lesson={lesson} studentName="Ben" />
        </StrictMode>,
      );
    });
    await act(async () => {
      await flush(80);
    });

    const proseCalls = speakMock.mock.calls
      .map((c) => String(c[0]))
      .filter((s) => /snack-ration|chocolate bar/i.test(s));
    expect(proseCalls).toHaveLength(1);
  });

  it('stops the voice queue when LessonPage unmounts', async () => {
    const { unmount } = render(
      <LessonPage lesson={lesson} studentName="Ben" />,
    );
    await act(async () => {
      await flush(60);
    });

    stopMock.mockClear();
    unmount();

    // Going home (= unmount) drops the queue.
    expect(stopMock).toHaveBeenCalled();
  });

  it('queues celebration → advance line → next prose on correct MC', async () => {
    const ADVANCE = 'Locked in, Ben. Pizza incoming.';
    fetchAdvanceLineMock.mockResolvedValue(ADVANCE);

    const initial = freshState({
      activeIdx: 1,
      doneIds: ['chocolate_intro'],
    });

    const screen = render(
      <LessonPage lesson={lesson} studentName="Ben" initialState={initial} />,
    );
    await act(async () => {
      await flush(20);
    });

    const twoBtn = screen
      .getAllByRole('button')
      .find((b) => /Two$/.test(b.textContent ?? ''));
    expect(twoBtn).toBeDefined();

    speakMock.mockClear();
    await act(async () => {
      fireEvent.click(twoBtn!);
    });
    await act(async () => {
      await flush(900);
    });

    const spoken = speakMock.mock.calls.map((c) => String(c[0]));
    const idxCelebration = spoken.findIndex((t) => /that's right/i.test(t));
    const idxAdvance = spoken.indexOf(ADVANCE);
    const idxProse = spoken.findIndex((t) =>
      /moon-pizza|cook pulls a moon-pizza/i.test(t),
    );

    expect(idxCelebration).toBeGreaterThanOrEqual(0);
    expect(idxAdvance).toBeGreaterThanOrEqual(0);
    expect(idxProse).toBeGreaterThanOrEqual(0);
    // Full audio order: celebration → advance line → next prose.
    expect(idxCelebration).toBeLessThan(idxAdvance);
    expect(idxAdvance).toBeLessThan(idxProse);
  });

  it('speaks the canonical hint on a wrong MC answer', async () => {
    const initial = freshState({
      activeIdx: 1,
      doneIds: ['chocolate_intro'],
    });

    const screen = render(
      <LessonPage lesson={lesson} studentName="Ben" initialState={initial} />,
    );
    await act(async () => {
      await flush(20);
    });

    // Pick the wrong answer "Four" instead of "Two".
    const fourBtn = screen
      .getAllByRole('button')
      .find((b) => /Four$/.test(b.textContent ?? ''));
    expect(fourBtn).toBeDefined();

    speakMock.mockClear();
    await act(async () => {
      fireEvent.click(fourBtn!);
    });
    await act(async () => {
      await flush(80);
    });

    const spoken = speakMock.mock.calls.map((c) => String(c[0]));
    // The first canonical hint for chocolate_check mentions sliding the
    // quarter-squares side-by-side. Match a robust substring.
    expect(spoken.some((s) => /quarter-squares/i.test(s))).toBe(true);
  });

  it('does not speak anything while the kid is working an exercise', async () => {
    const initial = freshState({
      activeIdx: 1,
      doneIds: ['chocolate_intro'],
    });

    render(
      <LessonPage lesson={lesson} studentName="Ben" initialState={initial} />,
    );
    await act(async () => {
      await flush(60);
    });

    // After the on-mount prose, no further speech happens until the kid
    // clicks something.
    const baseline = speakMock.mock.calls.length;
    await act(async () => {
      await flush(200);
    });
    expect(speakMock.mock.calls.length).toBe(baseline);
  });
});
