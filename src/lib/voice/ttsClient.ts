// Client-side TTS fetch helper with a module-level cache.
//
// Tutor lines repeat (canonical prose, hints, advance lines), so the same
// utterance should only round-trip once per page load. The cache stores the
// in-flight Promise, so concurrent callers for the same text share a single
// request. Failures aren't cached — a later retry can succeed.

const cache = new Map<string, Promise<Blob>>();

export async function fetchTTS(text: string): Promise<Blob> {
  const key = text.trim();
  const existing = cache.get(key);
  if (existing) return existing;

  const pending = (async () => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: key }),
    });
    if (!res.ok) {
      throw new Error(`TTS request failed: ${res.status}`);
    }
    return res.blob();
  })();

  cache.set(key, pending);
  try {
    return await pending;
  } catch (err) {
    cache.delete(key);
    throw err;
  }
}

/** Test-only — clears the module-level cache between tests. */
export function __resetTTSCacheForTests(): void {
  cache.clear();
}
