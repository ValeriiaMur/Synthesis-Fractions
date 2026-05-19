import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

// jsdom installs its own `Blob` global, but the global `fetch` (Node's
// undici-backed implementation) returns a `Response.blob()` whose
// constructor is *not* the jsdom Blob. That makes
// `expect(blob).toBeInstanceOf(Blob)` fail for legitimate blobs coming
// off `fetch`. Align `globalThis.Blob` with whatever class `Response.blob()`
// returns so `instanceof Blob` matches in tests.
beforeAll(async () => {
  const probe = await new Response(new Uint8Array([0])).blob();
  if (probe.constructor !== globalThis.Blob) {
    (globalThis as { Blob: typeof Blob }).Blob = probe.constructor as typeof Blob;
  }
});

afterEach(() => {
  cleanup();
});
