import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchHint, type HintRequest } from './hintClient';

const validRequest: HintRequest = {
  manipulativeKind: 'chocolate',
  question: 'How many?',
  correctOptionLabel: 'Two',
  selectedOptionLabel: 'Three',
  attemptCount: 1,
};

describe('fetchHint', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns the hint string on a successful response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ hint: 'Look at the bar.' }), { status: 200 }),
    );
    const result = await fetchHint(validRequest);
    expect(result).toBe('Look at the bar.');
  });

  it('returns null when the server responds non-2xx', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'boom' }), { status: 500 }),
    );
    const result = await fetchHint(validRequest);
    expect(result).toBeNull();
  });

  it('returns null when the network call throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    const result = await fetchHint(validRequest);
    expect(result).toBeNull();
  });

  it('returns null when the request exceeds the timeout', async () => {
    vi.mocked(fetch).mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          const signal = (init as RequestInit | undefined)?.signal;
          if (signal) {
            signal.addEventListener('abort', () => {
              reject(new DOMException('aborted', 'AbortError'));
            });
          }
        }),
    );
    const promise = fetchHint(validRequest, { timeoutMs: 1200 });
    await vi.advanceTimersByTimeAsync(1300);
    const result = await promise;
    expect(result).toBeNull();
  });

  it('POSTs the request body to /api/agent/hint as JSON', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ hint: 'ok' }), { status: 200 }),
    );
    await fetchHint(validRequest);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/api/agent/hint');
    expect((init as RequestInit).method).toBe('POST');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['content-type']).toMatch(/application\/json/);
    expect(JSON.parse((init as RequestInit).body as string)).toEqual(validRequest);
  });
});
