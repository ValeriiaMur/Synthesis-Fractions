# PLAN — Synthesis Tutor (as-built + deferred)

Living scope doc. The original Phase 1 → Phase 2 → Phase 3 roadmap
(LangGraph agent + Haiku narrator + LangSmith eval) was abandoned
mid-sprint after a pedagogy review re-anchored the product on Montessori
principles: cognitive coherence, control of error, three-period naming
before equivalence. The pivot is documented in
[`montessori-plan.md`](montessori-plan.md); the as-built architecture is
in [`summary.md`](summary.md). This file just captures *what shipped*
and *what was deliberately left out*, so a future agent doesn't try to
re-implement abandoned scope.

## North star (current)

A scrollytelling lesson on **half / quarter naming + the equivalence
`½ = ²⁄₄` / `whole = 4 quarters`** that feels like a calm picture book
on an iPad. Three Montessori "periods" (introduce → recognize → recall),
plus a transfer check.

## Shipped

- **Seven scripted beats** in
  [`lessonData.ts`](src/lib/lesson/lessonData.ts):
  1. `whole_intro` — tap a whole bar; it splits in half (P1).
  2. `name_half` — tap each half (P1).
  3. `name_quarter` — tap each quarter (P1).
  4. `mix_half_quarter` — tap half / each quarter, mixed (P2 recognize).
  5. `recall_name` — "what is this?" — say it aloud, "show me" reveals
     the confirmation (P3 recall; no speech capture).
  6. `equiv_half_two_quarters` — place 4 quarters to fill the whole,
     then break it with a draggable hammer (P3 recall, equivalence).
  7. `equiv_paper_check` — fold a square twice as a transfer proof.
- **Four manipulative kinds** (`whole | naming | equivalence | paper`)
  plus the new `recall` kind, each with a pure-logic module
  (`wholeLogic`, `namingLogic`, `coverLogic`, `paperLogic`) and a
  React component that only renders. Logic is unit-tested in isolation.
- **Deterministic state machine in React** —
  `useLessonStateMachine` + `useLessonPersistence`. No XState, no
  Redux, no LangGraph. The only event the machine handles is
  `handleManip(idx, state)`.
- **Voice subsystem (ElevenLabs)** — pre-baked per-line MP3s +
  manifest, FIFO queue, mute toggle, gesture-gated by `NamePrompt`,
  view-driven (one line on advance, no chat rail). Plus material
  SFX (chocolate snap, paper fold, whole split, hammer break) baked
  via the ElevenLabs sound-generation endpoint.
- **Observational spoken feedback** — `useSpokenFeedback` enqueues
  short milestone lines (naming feedback, whole-split observation,
  "four quarters fill the whole") through the same voice player.
  Throttled so it never interrupts beat prose.
- **Persistence** — `localStorage` snapshot under
  `synthesis:lesson:<id>:state`, schema v7, `correctedLessonState`
  repair on resume.
- **`/` companion one-pager** — full-bleed scrollytelling on the
  Montessori principles with small interactive demos
  (`DemoConcrete`, `DemoControlOfError`, …), `Unveil` brand intro,
  ambient audio toggle.
- **iPad-first responsive layout** — breakpoint tiers at 1180 /
  1024 / 900 / 720 px; `100dvh` lesson stage; `viewportFit: 'cover'`
  + `touch-action: manipulation` for iOS Safari.
- **Single analytics event** — `lesson_feedback` from the Outro
  via PostHog; gated on `NEXT_PUBLIC_POSTHOG_KEY`, no-op without it.

## Deliberately deferred / not shipped

- **LangGraph + Haiku narrator.** Originally Phase 2 (hint /
  paraphrase / classify-reflection routes). The
  full agent layer (`src/lib/agent/`, `src/app/api/agent/`) was
  deleted once the Montessori re-anchor made adult-voice hints and
  paraphrased prose anti-Montessori. `@langchain/*` + `langsmith`
  remain in `package.json` but nothing imports them — safe to drop in a
  future dependency-cleanup pass.
- **MC / hint / scaffold UI.** `MCBlock`, `HintBubble`,
  `CelebrationBubble`, `ChatRail`, `branching.ts`, `validators.ts`
  — all deleted. The material itself is the feedback (control of
  error). The only "decision" left is the pure `isBeatComplete`
  predicate.
- **LangSmith dataset eval + GitHub Actions gate.** No agent →
  nothing to evaluate.
- **Multi-lesson picker.** `montessori-plan.md` proposed a
  picker grid over Half / Quarter / Together / Equivalent so the kid
  chooses. Not built — the active lesson is a single linear flow
  through all seven beats. Picker is a clean future extension; the
  state machine already keys snapshots by `lesson.id`.
- **Real-world off-ramp cards.** The `montessori-plan.md`
  "show your grown-up" prompts are not yet rendered per-beat.
- **Symbol introduction (½ / ¼ glyphs).** Beat 5's reveal step shows
  glyphs, but a dedicated symbol-naming lesson between L3 and L5 is
  not built.
- **Curriculum expansion** beyond half / quarter equivalence. The
  architecture accommodates extension (new `Beat` rows with new
  manipulative kinds + logic modules) but no other lessons exist.
- **Multi-user / accounts / server-side persistence / PII.**
  Out of scope for a 1-week prototype. All progress is per-device
  in `localStorage`.

## Decision log (load-bearing choices)

- **Frontend** — Next.js 16 App Router + React 19.2 + Tailwind v4.
- **Touch / drag** — `@dnd-kit/core` (best iPad pointer support); used
  for the hammer in `EquivalenceMaterial` and the corner in `PaperFold`.
- **Animations** — `framer-motion` for spring physics on the chocolate
  taps and the hammer drag.
- **No XState / Redux / agent runtime.** The state machine is local
  React + a pure predicate; the lesson has nothing to orchestrate.
- **No LLM in the lesson loop.** ElevenLabs TTS is the only network
  dependency at runtime, and the steady-state lesson hits only the
  baked-manifest path (no `/api/tts` per learner once baked).
- **Testing** — Vitest + RTL + jsdom, TDD red→green per
  [CLAUDE.md](CLAUDE.md). Logic modules carry full test coverage;
  visual / animation components skip tests with sign-off.

## Working agreements

- The lesson script is authored in `lessonData.ts`. Editing prose
  there is a content change; rerun `npm run bake:voice` before demo
  to refresh the static-audio manifest.
- Every meaningful change ends with `npm run test:run` +
  `npm run lint:fix` green ([CLAUDE.md](CLAUDE.md)).
- API keys (ElevenLabs, PostHog) are optional at runtime; the lesson
  remains playable without them (silent + no analytics).
