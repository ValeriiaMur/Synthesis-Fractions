# Synthesis — Architecture Summary

Living document. Updated whenever architecture, key decisions, data flow, or module boundaries change. Explains **how it works and why**, not a changelog.

## Stack

- **Next.js 16.2.6** with the **App Router** (`src/app/`). React 19.2.
- **TypeScript** with `strict: true` and `allowJs: false` — TS-only codebase, no `any`.
- **Tailwind CSS v4** via `@tailwindcss/postcss` (no `tailwind.config.*` — v4 uses CSS-first config in `src/app/globals.css`).
- **Turbopack** for `next dev` (default in Next 16).
- **ESLint 9** (flat config, `eslint.config.mjs`) with `eslint-config-next`.
- **Vitest 4** + **React Testing Library 16** + **jsdom 29** + **`@testing-library/jest-dom`** for unit/component tests.

## Why this stack

- App Router + RSC is the default in Next 16; server-first rendering keeps client bundles small.
- Tailwind v4 has a simpler, faster pipeline than v3 and aligns with the Next 16 toolchain.
- Strict TypeScript is a project rule (see [CLAUDE.md](CLAUDE.md)) — types are load-bearing, not advisory.
- Vitest (vs Jest) because it's the Next 16 recommended runner and shares Vite's transform pipeline — fast, TS-native, no Babel config. RTL because it's the React ecosystem standard and pairs with the TDD rule. jsdom (vs happy-dom) for broader DOM compatibility.

## Layout

```
src/
  app/             # App Router routes, layouts, pages
public/            # Static assets
```

One component per file (e.g. `Button.tsx` exports `Button`). Tests co-located (`Button.test.tsx`). Vitest picks up `src/**/*.{test,spec}.{ts,tsx}` (see `vitest.config.mts`).

## Conventions

- **TDD red→green.** Failing test first (run it, confirm it fails for the right reason), then minimum implementation to make it pass.
- **Path alias:** `@/*` → `./src/*`. Resolved in Vite/Vitest via native `resolve.tsconfigPaths: true` (no `vite-tsconfig-paths` plugin needed).
- **jest-dom matchers** (e.g. `toBeInTheDocument`) are extended onto Vitest's `expect` via `vitest.setup.ts` — no per-test import needed.
- **Vitest globals are off**; import `describe`/`it`/`expect` explicitly. Keeps test files honest about their dependencies and plays well with strict TS.
- **Async Server Components** are not supported by Vitest (per Next docs) — cover them with E2E tests when we add an E2E runner.
- **Next 16 caveat:** APIs and conventions differ from earlier Next versions; consult `node_modules/next/dist/docs/` (per `AGENTS.md`) before using Next-specific features.
- **No Prettier, no Biome.** ESLint (`eslint-config-next`) handles both lint and stylistic rules. Considered Biome and rejected it — ESLint alone keeps the toolchain narrow and avoids overlap.
- **Post-change routine:** every meaningful change ends with `npm run test:run` *and* `npm run lint:fix` both green. Enforced in [CLAUDE.md](CLAUDE.md#after-every-change).

## Scripts

- `npm run dev` — Next dev server (Turbopack)
- `npm run build` — production build
- `npm run lint` / `npm run lint:fix` — ESLint (check / auto-fix)
- `npm test` — Vitest in watch mode
- `npm run test:run` — Vitest one-shot (for CI / pre-commit)
