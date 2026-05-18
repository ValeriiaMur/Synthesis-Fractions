# Project Rules

## Language & Types
- **TypeScript only.** No JavaScript files.
- **Strict types.** `strict: true` in `tsconfig.json`. No `any` — use `unknown` + narrowing, generics, or precise types instead.
- No `@ts-ignore` / `@ts-expect-error` without a comment explaining why.

## File Layout
- **One component per file.** Each React component lives in its own file, named after the component (e.g. `Button.tsx` exports `Button`).
- Co-locate the component's tests and styles next to it (`Button.tsx`, `Button.test.tsx`).

## Testing — TDD (red → green)
- **Red first.** Write the failing test before the implementation. Run it, confirm it fails for the right reason.
- **Green.** Write the minimum code to make the test pass.
- **Refactor** only with tests passing.
- Do not write implementation code without a failing test pointing at it.

## After every change
- Run `npm run test:run` — full suite must pass.
- Run `npm run lint:fix` — fix what auto-fixes, leave nothing unresolved.
- Both must be green **before** reporting a task done. ESLint (with `eslint-config-next`) is the only linter/formatter — no Prettier, no Biome.
- Skippable only for changes that touch neither code nor config (pure docs/comments).

## Live Architecture Doc — `summary.md`
- Maintain a `summary.md` at the project root as the **living architecture document**.
- After any change that affects architecture, key decisions, data flow, or module boundaries, update `summary.md`.
- It should answer: **how does it work, and why?** — not be a changelog. Replace stale content; don't append.
- Skippable for trivial edits (typos, formatting, internal-only refactors that don't change behavior or shape).
