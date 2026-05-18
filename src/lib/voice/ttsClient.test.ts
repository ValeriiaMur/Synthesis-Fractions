import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTTS, __resetTTSCacheForTests } from './ttsClient';

function audioResponse(bytes: number[]): Response {
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: { 'content-type': 'audio/mpeg' },
  });
}

describe('fetchTTS', () => {
  beforeEach(() => {
    __resetTTSCacheForTests();
    vi.restoreAllMocks();
  });

  it('POSTs the text to /api/tts and returns the audio Blob', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(audioResponse([1, 2, 3]));

    const blob = await fetchTTS('hello');

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('audio/mpeg');
    expect(blob.size).toBe(3);

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/tts');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string) as { text: string };
    expect(body.text).toBe('hello');
  });

  it('caches by text — second call for the same text does not hit the network', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(audioResponse([1, 2, 3]));

    const a = await fetchTTS('same line');
    const b = await fetchTTS('same line');

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(a).toBe(b);
  });

  it('treats different text as separate cache entries', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(audioResponse([1])));

    await fetchTTS('one');
    await fetchTTS('two');

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('throws when the route returns a non-2xx response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('nope', { status: 500 }),
    );

    await expect(fetchTTS('boom')).rejects.toThrow();
  });

  it('does not cache failed responses (a retry can succeed)', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('nope', { status: 500 }))
      .mockResolvedValueOnce(audioResponse([7]));

    await expect(fetchTTS('retry me')).rejects.toThrow();
    const blob = await fetchTTS('retry me');

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(blob.size).toBe(1);
  });
});
