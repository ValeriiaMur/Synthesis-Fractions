import { describe, it, expect } from 'vitest';

/**
 * Regression guard for the jsdom ↔ Node Blob mismatch.
 *
 * Background: jsdom installs its own `Blob` global, but Node's undici-backed
 * `fetch` returns `Response.blob()` results whose constructor is a *different*
 * class. Without the alignment in `vitest.setup.ts`, `expect(blob).toBeInstanceOf(Blob)`
 * would fail for legitimate fetch blobs.
 *
 * `vitest.setup.ts` aligns `globalThis.Blob` to the class actually returned
 * by `Response.blob()`. This test fails fast if that alignment ever regresses
 * (e.g. someone removes the setup hook or vitest changes how it isolates
 * globals between tests).
 */
describe('Blob global alignment (jsdom ↔ Node fetch)', () => {
  it('Response.blob() returns an instance of globalThis.Blob', async () => {
    const blob = await new Response(new Uint8Array([1, 2, 3])).blob();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.constructor).toBe(globalThis.Blob);
  });
});
