# Synthesis — Architecture Summary

Living document. Updated whenever architecture, key decisions, data flow, or
module boundaries change. Explains **how it works and why**, not a changelog.

Forward-looking roadmap (Phase 1 → Phase 2 → Phase 3, what gets built when):
[PLAN.md](PLAN.md). Domain + pedagogy context: [synthesis_tutor_presearch.md](synthesis_tutor_presearch.md).

## What this app is

A fraction-equivalence lesson (½ = ²⁄₄) for a 7–10yo learner on an iPad, plus
a "How It Works" one-pager that walks adult viewers through the eight
Montessori principles behind it.

Two routes, one visual system (the cosmos / space palette in
[globals.css](src/app/globals.css)):

- **`/` — `HowItWorksPage`** — full-bleed scrollytelling marketing page. Hero
  with a live mini chocolate-bar, an intro section, eight full-viewport
  `PrincipleRow`s each pairing prose with a tiny interactive demo, a fixed
  `SideRail` navigator, a `ScrollProgress` bar pinned to the top, and a
  `FinalCTA` linking into the lesson.
- **`/lesson` — `LessonPage`** — the Jupyter-notebook-style lesson. A
  `ChatRail` on the left with Ari (the tutor persona), a vertical stack of
  five `Cell`s on the right, each carrying tutor prose + a Montessori
  manipulative + an optional multiple-choice check, plus a floating
  `JumpButton` to scroll back to the active cell.

Canonical authored copy is the immediate render and the silent-fallback path
on every chat / hint surface, so the lesson stays playable even with the LLM
layer cold.

## Stack

- **Next.js 16.2.6** App Router (`src/app/`). React 19.2.
- **TypeScript** strict, no `any`, no `allowJs`.
- **Tailwind v4** via `@tailwindcss/postcss`; CSS-first config in
  [`src/app/globals.css`](src/app/globals.css) — design tokens on `:root`,
  bespoke class layer for the cosmos surfaces (`.cell`, `.chat`, `.principle-stage`, …).
- **next/font** loads Work Sans (weights 100–600) and JetBrains Mono (300/400)
  and binds them to CSS vars (`--font-work-sans`, `--font-jetbrains-mono`),
  consumed by both Tailwind utilities and the bespoke class layer.
- **Turbopack** for `next dev`.
- **ESLint 9** flat config + `eslint-config-next`.
- **Vitest 4** + **React Testing Library 16** + **jsdom 29** + **`@testing-library/jest-dom`**.
- **`@dnd-kit/core`** is in deps but unused right now — tap / range-slider /
  button manipulatives are reliable on iPad and trivially testable in jsdom.
- **framer-motion** in deps; reserved for a future polish pass on the spring
  physics (snap-fold, slice rotation).
- **`@langchain/langgraph`** + **`@langchain/anthropic`** + **`@langchain/core`** —
  the lesson agent graph (hint / paraphrase / classify_reflection). API routes
  are intact; the chat UI is currently routed through the canonical-only
  `aiReplyTo` keyword router. See **Where the agent layer plugs back in** below.
- **`langsmith`** — tracing is automatic when `LANGSMITH_TRACING=true` and the
  `LANGSMITH_API_KEY` / `LANGSMITH_PROJECT` env vars are present.

## Module layout

```
src/
  app/
    page.tsx                 # renders <HowItWorksPage />
    lesson/page.tsx          # renders <LessonPage lesson={lesson} />
    layout.tsx               # loads Work Sans + JetBrains Mono, sets metadata
    globals.css              # design tokens + cosmos class layer
    api/agent/
      hint/route.ts                    # POST — runLessonAgent({task:'hint'})
      paraphrase/route.ts              # POST — task=paraphrase
      classify-reflection/route.ts     # POST — task=classify_reflection
  components/
    space/                   # shared backdrop — Stars, GridBg, Doodle + 9 doodle icons
      Doodle.tsx, Planet, Satellite, Telescope, UFO, Rocket, Comet, Atom, Star, Moon,
      Doodles.tsx (scatters the 12 wrapper spans w/ data-parallax)
    manipulatives/
      ChocolateBar.tsx       # 4 quarter-pieces tap-toggle between bar and half-space
      PizzaSlicer.tsx        # SVG pizza + draggable knife; cut value 0..1 → 2 / 4 slices
      PaperFold.tsx          # tap-cycle 0 → [h] → [h,v] → 0 with overlaid ½ + ¼ tints
      Caption.tsx, Fraction.tsx, FoldChip.tsx   # shared inner bits
    lesson/
      LessonPage.tsx         # state machine + layout for the /lesson screen
      Cell.tsx               # gutter (number + phase) + body card (kind + content)
      Prose.tsx              # renders {y}…{/y}, {r}/{b}/{g}…{/r|b|g} tokens
      MCBlock.tsx            # MC grid with selected / correct / wrong states
      HintBubble.tsx, CelebrationBubble.tsx
      Intro.tsx, Outro.tsx
      TopBar.tsx             # 64px header — pause, lesson tag, segmented progress, sound
      JumpButton.tsx         # floating scroll-to-active button
      ChatRail.tsx           # full chat aside — head, log, quick replies, input
      ChatMessage.tsx, QuickReply.tsx, TypingDots.tsx
      IconPause.tsx, IconSound.tsx, IconSend.tsx, IconArrowDown.tsx
    onepager/
      HowItWorksPage.tsx     # top-level scrollytelling page
      Hero.tsx, HeroPreview.tsx
      PrincipleRow.tsx       # full-viewport principle section (IO-driven .in-view)
      SideRail.tsx           # fixed right principle navigator
      ScrollProgress.tsx     # fixed top 2px gradient bar
      FinalCTA.tsx
      demos/
        DemoFrame.tsx, OrderToggle.tsx, TrayItem.tsx, FauxCell.tsx
        DemoConcrete, DemoControlOfError, DemoThreePeriod, DemoDescription,
        DemoPreparedEnvironment, DemoSelfPaced, DemoMinimalism, DemoRedirect
  lib/
    lesson/
      types.ts               # Beat, MCConfig, ManipulativeConfig, LessonState, …
      lessonData.ts          # authored 5-beat lesson; prose carries highlight tokens
      validators.ts          # validateMC / validateManipulative
      stripMarkup.ts         # strips {y}…{/y} tokens for chat / TTS output
      completes.ts           # isBeatComplete + lookupHint (pure)
      aiReplyTo.ts           # keyword-routed Ari reply (mirrors the prototype)
      useReveal.ts           # IO + 1.5s fallback hook for one-pager fades
      useScrollProgress.ts   # window scroll → 0..1
    agent/
      lessonAgent.ts         # unified StateGraph: router → hint | paraphrase | classify → END
      generateHint.ts        # back-compat wrapper around runLessonAgent({task:'hint'})
      anthropicClient.ts     # ChatAnthropic / Haiku 4.5 factory
      hintClient.ts, paraphraseClient.ts, classifyReflectionClient.ts
  hooks/
    useParallaxDoodles.ts    # offsets [data-parallax] children on scroll (passive)
```

Tests sit next to the component they cover (`*.test.tsx` / `*.test.ts`).
Vitest picks up `src/**/*.{test,spec}.{ts,tsx}` per
[`vitest.config.mts`](vitest.config.mts).

## Routes

| Path      | Component                               | Purpose                                                                                |
| --------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| `/`       | `HowItWorksPage` (client)               | Marketing / pedagogy scrollytelling. Eight principles + live demos + CTA into lesson.  |
| `/lesson` | `LessonPage` (client, fed by `lesson`)  | The interactive equivalent-fractions lesson — chat rail + notebook cells.              |
| `/api/agent/hint`                | route handler | Wrong-MC hint generation via the lesson agent.                          |
| `/api/agent/paraphrase`          | route handler | Per-beat paraphrase of authored prose.                                  |
| `/api/agent/classify-reflection` | route handler | Classifies a student's free reflection + returns Ari's reaction.        |

Both UI routes share the same backdrop primitives (`Stars`, `GridBg`,
`Doodles`) and the cosmos token set, so they read as one product.

## Lesson state machine (`LessonPage`)

Single client component holding:

```ts
activeIdx: number;                                   // pointer into beats[]
doneSet: ReadonlySet<BeatId>;                        // beats the learner has finished
mcSel: Partial<Record<BeatId, string>>;              // selected option per beat
mcStatus: Partial<Record<BeatId, 'idle'|'wrong'|'correct'>>;
hintAttempts: Partial<Record<BeatId, number>>;       // counts wrong tries per beat
manipStates: Partial<Record<BeatId, ManipulativeState>>;
thinking: boolean;                                   // chat typing indicator
chat: readonly ChatMsg[];                            // {from, text}[], from ∈ ari|user|system
```

Beats unlock sequentially:

- A beat is `active` when `idx === activeIdx`, `done` when its id is in
  `doneSet`, else `locked` (rendered blurred, pointer-events disabled).
- **Manipulative onChange**: write `manipStates[id]`, then if
  `isBeatComplete(beat, state)` is true and the beat has no MC, mark it done
  and call `advanceTo(idx + 1)`. If the beat has an MC (paper_fold_final),
  it's marked done but the MC stays — completing requires both.
- **MC onAnswer**: correct → push the user choice + Ari acknowledgement to
  chat, mark done, then `advanceTo` after 600ms. Wrong → push the canonical
  hint (looked up by attempt index in `beat.mc.canonicalHints`), bump
  `hintAttempts`, and render a `HintBubble` inline.
- **`advanceTo(next)`**: setActiveIdx, push a `▸ cell NN unlocked` system
  message, push the next beat's prose into chat (after `stripMarkup`),
  scrollIntoView 250ms later.
- **Chat send / quick reply**: push user text, flip `thinking: true`, after
  ~700ms call `aiReplyTo(text, currentBeat, studentName)` and push the reply.
  Right now `aiReplyTo` is the deterministic keyword router from the
  prototype; the agent layer is plumbed but not wired into this code path.

Cell refs are created once with `useMemo(() => beats.map(() => createRef()))`
so the array is stable, safely readable in render, and shared with
`JumpButton` for IO-driven visibility + `scrollIntoView`.

## Prose tokens

Every authored beat string can include four inline highlight tokens:

| Token        | Renders as                 | Meaning            |
| ------------ | -------------------------- | ------------------ |
| `{y}…{/y}`   | `<em>` (yellow)            | Emphasis           |
| `{r}…{/r}`   | `<span class="num-red">`   | Red numeral / accent  |
| `{b}…{/b}`   | `<span class="num-blue">`  | Blue numeral / accent |
| `{g}…{/g}`   | `<span class="num-green">` | Green numeral / accent |

`Prose` tokenizes lazily with a single non-greedy regex; unclosed tokens are
left literal so authored content is never silently dropped. `stripMarkup` is
the inverse — used when the same string is echoed into chat or TTS.

## One-pager reveals

- **`useReveal()`** returns `[ref, shown]`. Uses an IO with `threshold: 0.05`,
  starts shown if the element is already in / above the viewport on mount,
  and has a 1.5s timer fallback so SSR captures and screenshot tests aren't
  blank.
- **`useScrollProgress()`** returns `0..1` from `window.scrollY / (scrollHeight
  - innerHeight)`; the `ScrollProgress` bar reads it.
- **`useParallaxDoodles()`** queries every `.doodles [data-parallax]` once on
  mount, then on `scroll` (`{passive: true}`) applies
  `translate3d(0, -y * factor, 0)` per element. Factors live in `Doodles.tsx`.
- **`PrincipleRow`** owns its own IO (`threshold: 0.3`,
  `rootMargin: -12% 0 -12% 0`) and toggles `.in-view` on the section. CSS
  drives the text fade-up (`transition-delay: 0.05s`), the demo fade-up
  (`0.25s`), and the giant ghost-numeral opacity ramp.

## Why these choices

- **Cosmos palette in CSS vars + tokens, not Tailwind theme.** The design is
  hand-tuned (shadows, gradients, ring colors on `.cell.active`) and porting
  every selector to utility classes would balloon the markup. Tailwind v4
  still runs for utility-style components; bespoke class layer handles the
  cosmos surfaces.
- **One component per file.** Even the tiny ones (`IconPause`, `FoldChip`,
  `TrayItem`). Cheap to find, cheap to test, matches `CLAUDE.md`.
- **Tests for logic, not pixels.** Per CLAUDE.md TDD rules; pure helpers
  (`stripMarkup`, `aiReplyTo`, `isBeatComplete`, `lookupHint`, `validateMC`,
  `validateManipulative`) and the manipulatives' state machines are covered.
  Visual-only components (Doodles, Hero, FinalCTA, the eight demos, the
  side-rail) skip tests this pass.
- **`useMemo` for cellRefs, not `useRef`.** Reading `useRef.current` during
  render trips React's new `react-hooks/refs` rule. A memoized array of refs
  is render-safe and still gives JumpButton + scrollIntoView the per-cell
  handles they need.
- **Initial Ari prose is set in the chat initializer, not in `useEffect`.**
  Avoids `react-hooks/set-state-in-effect` and means the first message is
  present even before client hydration completes.

## Where the agent layer plugs back in

`lib/agent/*` + `app/api/agent/*` + the three client wrappers
(`hintClient` / `paraphraseClient` / `classifyReflectionClient`) are intact.
What's gone is the old `MCBubble` that called them on wrong-MC selection.
Re-wiring (next slice):

1. After `MCBlock.onAnswer` flags a wrong answer in `LessonPage`, kick off
   `fetchHint(...)` with the manipulative kind. Canonical hint renders
   immediately; `fetchHint` swaps it in if it resolves before the next click.
2. On `advanceTo`, push the canonical prose first, then fire
   `fetchParaphrase` and replace the chat message text if the paraphrase
   resolves under budget.
3. Free-text chat: replace `aiReplyTo` with a route call that goes through
   the same lesson-agent graph (a new `task: 'chat'` node).

Each wrapper already implements timeout + null-on-error so the silent-fallback
contract carries over.

## Conventions

- **TDD red→green** per `CLAUDE.md` for logic. Visual / animation-only
  components are exempt this pass (with the user's sign-off).
- **One component per file.** Tests co-located.
- **Path alias:** `@/*` → `./src/*`. Resolved via `resolve.tsconfigPaths: true`
  in `vitest.config.mts`.
- **jest-dom matchers** auto-extended via `vitest.setup.ts`.
- **Vitest globals are off**; import `describe`/`it`/`expect` explicitly.
- **No Prettier, no Biome.** ESLint (`eslint-config-next`) only.
- **Post-change routine:** `npm run test:run` + `npm run lint:fix` both green.

## Scripts

- `npm run dev` — Next dev server (Turbopack).
- `npm run build` — production build.
- `npm run lint` / `npm run lint:fix` — ESLint (check / auto-fix).
- `npm test` — Vitest watch mode.
- `npm run test:run` — Vitest one-shot (for CI / pre-commit).
