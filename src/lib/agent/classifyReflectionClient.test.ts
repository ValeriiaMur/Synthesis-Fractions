import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchReflectionReaction,
  type ReflectionRequest,
} from './classifyReflectionClient';

const validRequest: ReflectionRequest = {
  beatId: 'chocolate_intro',
  manipulativeKind: 'chocolate',
  reflectionText: 'Two pieces look like one half.',
};

describe('fetchReflectionReaction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns { category, reaction } on success', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ category: 'on-topic', reaction: 'You noticed two pieces.' }),
        { status: 200 },
      ),
    );
    const result = await fetchReflectionReaction(validRequest);
    expect(result).toEqual({ category: 'on-topic', reaction: 'You noticed two pieces.' });
  });

  it('returns null on non-2xx', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 500 }));
    expect(await fetchReflectionReaction(validRequest)).toBeNull();
  });

  it('returns null on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    expect(await fetchReflectionReaction(validRequest)).toBeNull();
  });

  it('returns null on timeout', async () => {
    vi.mocked(fetch).mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          (init as RequestInit | undefined)?.signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'));
          });
        }),
    );
    const promise = fetchReflectionReaction(validRequest, { timeoutMs: 1500 });
    await vi.advanceTimersByTimeAsync(1600);
    expect(await promise).toBeNull();
  });

  it('returns null when the response body is missing fields', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ category: 'on-topic' }), { status: 200 }),
    );
    expect(await fetchReflectionReaction(validRequest)).toBeNull();
  });

  it('POSTs to /api/agent/classify-reflection with the request body', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ category: 'on-topic', reaction: 'ok' }), {
        status: 200,
      }),
    );
    await fetchReflectionReaction(validRequest);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/api/agent/classify-reflection');
    expect((init as RequestInit).method).toBe('POST');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual(validRequest);
  });
});
