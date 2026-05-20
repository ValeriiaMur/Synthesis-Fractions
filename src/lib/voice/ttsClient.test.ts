import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTTS, __resetTTSCacheForTests } from './ttsClient';

function audioResponse(bytes: number[]): Response {
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: { 'content-type': 'audio/mpeg' },
  });
}

function manifestResponse(map: Record<string, string>): Response {
  return new Response(JSON.stringify(map), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function emptyManifestResponse(): Response {
  return new Response('null', { status: 404 });
}

describe('fetchTTS', () => {
  beforeEach(() => {
    __resetTTSCacheForTests();
    vi.restoreAllMocks();
  });

  it('serves prebaked audio when the text is in the manifest', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.endsWith('/audio/voice/manifest.json')) {
        return Promise.resolve(manifestResponse({ 'Tap one half.': 'abc.mp3' }));
      }
      if (url.endsWith('/audio/voice/abc.mp3')) {
        return Promise.resolve(audioResponse([9, 9, 9, 9]));
      }
      return Promise.resolve(new Response('unexpected', { status: 500 }));
    });

    const blob = await fetchTTS('Tap one half.');

    expect(blob.size).toBe(4);
    const apiCalls = fetchSpy.mock.calls.filter(([u]) => {
      const url = typeof u === 'string' ? u : (u as Request).url;
      return url === '/api/tts';
    });
    expect(apiCalls).toHaveLength(0);
  });

  it('POSTs the text to /api/tts and returns the audio Blob when the manifest is missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.endsWith('/audio/voice/manifest.json')) {
        return Promise.resolve(emptyManifestResponse());
      }
      return Promise.resolve(audioResponse([1, 2, 3]));
    });

    const blob = await fetchTTS('hello');

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('audio/mpeg');
    expect(blob.size).toBe(3);

    const apiCall = fetchSpy.mock.calls.find(([u]) => {
      const url = typeof u === 'string' ? u : (u as Request).url;
      return url === '/api/tts';
    });
    expect(apiCall).toBeTruthy();
    const init = apiCall![1] as RequestInit;
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string) as { text: string };
    expect(body.text).toBe('hello');
  });

  it('falls back to /api/tts for text the manifest does not cover', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.endsWith('/audio/voice/manifest.json')) {
        return Promise.resolve(manifestResponse({ 'Tap one half.': 'abc.mp3' }));
      }
      if (url === '/api/tts') {
        return Promise.resolve(audioResponse([5]));
      }
      return Promise.resolve(new Response('unexpected', { status: 500 }));
    });

    const blob = await fetchTTS('something brand new');

    expect(blob.size).toBe(1);
    const apiCall = fetchSpy.mock.calls.find(([u]) => {
      const url = typeof u === 'string' ? u : (u as Request).url;
      return url === '/api/tts';
    });
    expect(apiCall).toBeTruthy();
  });

  it('falls back to /api/tts when the static mp3 fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.endsWith('/audio/voice/manifest.json')) {
        return Promise.resolve(manifestResponse({ hello: 'gone.mp3' }));
      }
      if (url.endsWith('/audio/voice/gone.mp3')) {
        return Promise.resolve(new Response('missing', { status: 404 }));
      }
      if (url === '/api/tts') {
        return Promise.resolve(audioResponse([7]));
      }
      return Promise.resolve(new Response('unexpected', { status: 500 }));
    });

    const blob = await fetchTTS('hello');
    expect(blob.size).toBe(1);
  });

  it('caches by text — second call for the same text does not re-fetch audio', async () => {
    let mp3Hits = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.endsWith('/audio/voice/manifest.json')) {
        return Promise.resolve(manifestResponse({ 'same line': 'x.mp3' }));
      }
      if (url.endsWith('/audio/voice/x.mp3')) {
        mp3Hits += 1;
        return Promise.resolve(audioResponse([1, 2, 3]));
      }
      return Promise.resolve(new Response('unexpected', { status: 500 }));
    });

    const a = await fetchTTS('same line');
    const b = await fetchTTS('same line');

    expect(mp3Hits).toBe(1);
    expect(a).toBe(b);
  });

  it('treats different text as separate cache entries', async () => {
    let apiHits = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.endsWith('/audio/voice/manifest.json')) {
        return Promise.resolve(emptyManifestResponse());
      }
      if (url === '/api/tts') {
        apiHits += 1;
        return Promise.resolve(audioResponse([1]));
      }
      return Promise.resolve(new Response('unexpected', { status: 500 }));
    });

    await fetchTTS('one');
    await fetchTTS('two');

    expect(apiHits).toBe(2);
  });

  it('throws when the API fallback returns a non-2xx response', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.endsWith('/audio/voice/manifest.json')) {
        return Promise.resolve(emptyManifestResponse());
      }
      return Promise.resolve(new Response('nope', { status: 500 }));
    });

    await expect(fetchTTS('boom')).rejects.toThrow();
  });

  it('does not cache failed responses (a retry can succeed)', async () => {
    let apiHits = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.endsWith('/audio/voice/manifest.json')) {
        return Promise.resolve(emptyManifestResponse());
      }
      if (url === '/api/tts') {
        apiHits += 1;
        if (apiHits === 1) return Promise.resolve(new Response('nope', { status: 500 }));
        return Promise.resolve(audioResponse([7]));
      }
      return Promise.resolve(new Response('unexpected', { status: 500 }));
    });

    await expect(fetchTTS('retry me')).rejects.toThrow();
    const blob = await fetchTTS('retry me');

    expect(apiHits).toBe(2);
    expect(blob.size).toBe(1);
  });
});
