import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchParaphrase, type ParaphraseRequest } from './paraphraseClient';

const validRequest: ParaphraseRequest = {
  beatId: 'chocolate_intro',
  originalProse: 'Here is a chocolate bar.',
};

describe('fetchParaphrase', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns the paraphrased prose on success', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ paraphrasedProse: 'A bar of chocolate.' }), {
        status: 200,
      }),
    );
    const result = await fetchParaphrase(validRequest);
    expect(result).toBe('A bar of chocolate.');
  });

  it('returns null on non-2xx', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 500 }));
    expect(await fetchParaphrase(validRequest)).toBeNull();
  });

  it('returns null on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    expect(await fetchParaphrase(validRequest)).toBeNull();
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
    const promise = fetchParaphrase(validRequest, { timeoutMs: 1500 });
    await vi.advanceTimersByTimeAsync(1600);
    expect(await promise).toBeNull();
  });

  it('POSTs to /api/agent/paraphrase with the request body as JSON', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ paraphrasedProse: 'ok' }), { status: 200 }),
    );
    await fetchParaphrase(validRequest);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/api/agent/paraphrase');
    expect((init as RequestInit).method).toBe('POST');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual(validRequest);
  });
});
