// Client-side TTS fetch helper with a module-level cache.
//
// Tutor lines are scripted, so the same utterance should only round-trip once
// per page load. The cache stores the in-flight Promise, so concurrent callers
// for the same text share a single request. Failures aren't cached — a later
// retry can succeed.
//
// Lines that have been pre-baked (see scripts/bake-voice.mts) are served as
// static MP3s from `/audio/voice/*.mp3` via a manifest lookup. Anything not in
// the manifest falls back to the live `/api/tts` ElevenLabs route. The manifest
// itself is fetched lazily, exactly once, on the first call.

const cache = new Map<string, Promise<Blob>>();

type Manifest = Readonly<Record<string, string>>;

let manifestPromise: Promise<Manifest> | null = null;

function loadManifest(): Promise<Manifest> {
  if (manifestPromise) return manifestPromise;
  manifestPromise = (async () => {
    try {
      const res = await fetch('/audio/voice/manifest.json');
      if (!res.ok) return {};
      const raw = (await res.json()) as unknown;
      if (raw && typeof raw === 'object') return raw as Manifest;
      return {};
    } catch {
      return {};
    }
  })();
  return manifestPromise;
}

async function fetchFromManifest(key: string): Promise<Blob | null> {
  const manifest = await loadManifest();
  const file = manifest[key];
  if (!file) return null;
  try {
    const res = await fetch(`/audio/voice/${file}`);
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

async function fetchFromApi(text: string): Promise<Blob> {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error(`TTS request failed: ${res.status}`);
  }
  return res.blob();
}

export async function fetchTTS(text: string): Promise<Blob> {
  const key = text.trim();
  const existing = cache.get(key);
  if (existing) return existing;

  const pending = (async () => {
    const prebaked = await fetchFromManifest(key);
    if (prebaked) return prebaked;
    return fetchFromApi(key);
  })();

  cache.set(key, pending);
  try {
    return await pending;
  } catch (err) {
    cache.delete(key);
    throw err;
  }
}

/** Test-only — clears the module-level caches between tests. */
export function __resetTTSCacheForTests(): void {
  cache.clear();
  manifestPromise = null;
}
