import { describe, it, expect, vi } from 'vitest';

// next/font triggers a webpack-only loader at import-time. Mock it so the
// layout module is importable inside vitest.
vi.mock('next/font/google', () => ({
  Work_Sans: () => ({ variable: '--font-work-sans' }),
  JetBrains_Mono: () => ({ variable: '--font-jetbrains-mono' }),
}));

const { viewport } = await import('./layout');

// iOS Safari needs `viewport-fit: cover` for `env(safe-area-inset-top)`
// to return real values; without it the topbar's `padding-top` collapses
// to its 0px fallback and the icons sit under the notch / status bar.
// Chrome DevTools "mobile preview" doesn't simulate this — only the real
// iOS Simulator (or device) does. See globals.css `.topbar` for the
// padding calc that depends on this.
describe('lesson route layout viewport', () => {
  it('exports a viewport config with viewport-fit: cover for iOS safe-area', () => {
    expect(viewport).toBeDefined();
    expect(viewport.viewportFit).toBe('cover');
  });

  it('sets device-width + initial-scale so iOS does not zoom the layout', () => {
    expect(viewport.width).toBe('device-width');
    expect(viewport.initialScale).toBe(1);
  });
});
