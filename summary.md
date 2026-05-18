# Synthesis — Architecture Summary

Living document. Updated whenever architecture, key decisions, data flow, or
module boundaries change. Explains **how it works and why**, not a changelog.

Forward-looking roadmap (Phase 1 → Phase 2 → Phase 3, what gets built when):
[PLAN.md](PLAN.md). Domain + pedagogy context: [synthesis_tutor_presearch.md](synthesis_tutor_presearch.md).

## What this app is

A six-beat fraction-equivalence lesson (½ = ²⁄₄) for a 7–10 year old on an
iPad, framed as a cosmos delivery story ("the Skiff run"), plus a
"How It Works" one-pager that walks adult viewers through the eight
Montessori principles behind it. The LLM (Haiku 4.5) sits behind a
LangGraph state graph and shapes every chat reply, every wrong-answer hint,
every paraphrase, and — when the same MC is missed three times — a
scaffolded simpler version of the question.

Two UI routes, one visual system (cosmos / space palette in
[globals.css](src/app/globals.css)):

- **`/` — `HowItWorksPage`** — full-bleed scrollytelling marketing page.
- **`/lesson` — `LessonPage`** — six-beat lesson; `ChatRail` on the left
  with Ari, vertical stack of `Cell`s on the right (chocolate ration →
  moon-pizza → star-map → warp-drive fraction-lock). Goes through a
  `NamePrompt` first so the student's name is captured before the lesson
  starts.

**Canonical-first contract.** Every authored line — beat prose, MC
question, canonical hints — renders immediately. The LLM fires in the
background and *swaps* the displayed text only when it resolves under
budget. If the network or the model fails, the canonical copy stays put
and the lesson is fully playable.

## Stack

- **Next.js 16.2.6** App Router (`src/app/`). React 19.2.
- **TypeScript** strict, no `any`, no `allowJs`.
- **Tailwind v4** via `@tailwindcss/postcss`; CSS-first config in
  [`globals.css`](src/app/globals.css). Bespoke class layer for the cosmos
  surfaces (`.cell`, `.chat`, `.principle-stage`, …).
- **next/font** loads Work Sans (100–600) + JetBrains Mono (300/400) into
  CSS vars.
- **Turbopack** for `next dev`.
- **ESLint 9** flat config + `eslint-config-next`.
- **Vitest 4** + **React Testing Library 16** + **jsdom 29**.
- **`@langchain/langgraph`** + **`@langchain/anthropic`** — `lessonAgent` is
  a single StateGraph with six nodes (one per task). Streaming chat
  bypasses the graph and pipes `ChatAnthropic.stream()` straight into SSE.
- **`langsmith`** — tracing is automatic when `LANGSMITH_TRACING=true` and
  `LANGSMITH_API_KEY` / `LANGSMITH_PROJECT` are set (LangChain reads them at
  module load). Required env vars listed below.

## Required env vars

| Var                    | Required? | Used for                                                  |
| ---------------------- | --------- | --------------------------------------------------------- |
| `ANTHROPIC_API_KEY`    | yes       | All LLM calls (hint, paraphrase, classify, scaffold, advance, chat). |
| `ELEVENLABS_API_KEY`   | optional  | Server-side TTS at `/api/tts`. Without it the lesson plays silent. |
| `LANGSMITH_TRACING`    | optional  | Set `true` to send traces.                                |
| `LANGSMITH_API_KEY`    | optional  | LangSmith credentials.                                    |
| `LANGSMITH_PROJECT`    | optional  | LangSmith project name.                                   |

When `ANTHROPIC_API_KEY` is absent the routes return 500 and the lesson
falls back to canonical authored copy. When `ELEVENLABS_API_KEY` is absent
`/api/tts` returns 500 and the voice player silently no-ops; the lesson
stays fully playable. The lesson stays fully playable.

## Module layout

```
src/
  app/
    page.tsx                 # renders <HowItWorksPage />
    lesson/page.tsx          # NamePrompt → LessonPage
    layout.tsx, globals.css
    api/agent/
      hint/route.ts                    # POST — blocking hint
      paraphrase/route.ts              # POST — blocking paraphrase
      classify-reflection/route.ts     # POST — blocking
      scaffold-mc/route.ts             # POST — blocking, returns 2-option MC
      advance/route.ts                 # POST — blocking, in-world advance line
      chat/route.ts                    # POST — SSE token stream
    api/tts/route.ts                   # POST — text → audio/mpeg via ElevenLabs
  components/
    space/                   # Stars, GridBg, Doodles (+ 9 doodle icons)
    manipulatives/
      ChocolateBar.tsx, PizzaSlicer.tsx, PaperFold.tsx
      FractionBox.tsx        # 6th-beat drag-and-drop Lego brick puzzle
      LegoBrick, PaletteBrick, DragGhostBrick, StudRow, Plate, FracInline
      Caption, Fraction, FoldChip, shade
    lesson/
      LessonPage.tsx         # state machine + agent orchestration
      NamePrompt.tsx         # student-name capture, persists to localStorage
      Cell, Prose, MCBlock
      HintBubble, CelebrationBubble
      Intro, Outro
      TopBar, JumpButton
      ChatRail, ChatMessage, QuickReply, TypingDots
      Icon* (Pause, Sound, Send, ArrowDown, ArrowLeft)
    onepager/
      HowItWorksPage, Hero, HeroPreview
      PrincipleRow, SideRail, ScrollProgress, FinalCTA
      demos/ (DemoFrame, OrderToggle, TrayItem, FauxCell + 8 Demo* files)
  lib/
    lesson/
      types.ts               # Beat, MCConfig, ManipulativeConfig (incl. FractionBox), LessonState
      lessonData.ts          # 6 beats with story-fied prose + highlight tokens
      validators.ts          # validateMC / validateManipulative (all 4 kinds)
      stripMarkup.ts, completes.ts, fractions.ts
      aiReplyTo.ts           # deterministic chat fallback
      useReveal.ts, useScrollProgress.ts
    agent/
      lessonAgent.ts         # StateGraph: hint | paraphrase | classify_reflection | scaffold_mc | advance_to_beat | chat
      generateHint.ts        # back-compat wrapper around runLessonAgent({task:'hint'})
      anthropicClient.ts     # getHintLLM() + getStreamingLLM()
      validation.ts          # shared whitelists + isKnownBeatId / isKnownKind
      hintClient.ts, paraphraseClient.ts, classifyReflectionClient.ts
      scaffoldMCClient.ts    # 3-wrong-answers swap
      advanceClient.ts       # in-world advance acknowledgement
      chatClient.ts          # async-generator over SSE tokens
    voice/
      elevenLabsClient.ts    # server-side ElevenLabs TTS wrapper (Rachel, eleven_flash_v2_5)
      ttsClient.ts           # client fetch + in-memory cache (text → Blob)
      voicePlayer.ts         # singleton queue + mute, factory + getVoicePlayer()
      playSample.ts          # one-off audio preview for the name-modal sound check
  hooks/
    useParallaxDoodles.ts
```

Tests sit next to the component they cover (`*.test.tsx` / `*.test.ts`).
Vitest picks up `src/**/*.{test,spec}.{ts,tsx}` per
[`vitest.config.mts`](vitest.config.mts).

## The lesson agent graph

```
                              ┌─────────┐
                              │  START  │
                              └────┬────┘
                                   │ conditional edge on state.input.task
       ┌──────────┬────────────────┼────────────┬──────────────────┬──────┐
       ▼          ▼                ▼            ▼                  ▼      ▼
    ┌──────┐ ┌────────────┐ ┌────────────────┐ ┌────────────┐ ┌──────────────┐ ┌──────┐
    │ hint │ │ paraphrase │ │ classify_      │ │ scaffold_mc│ │ advance_     │ │ chat │
    │      │ │            │ │  reflection    │ │            │ │  to_beat     │ │      │
    └──┬───┘ └─────┬──────┘ └──────┬─────────┘ └──────┬─────┘ └──────┬───────┘ └──┬───┘
       └───────────┴────────────────┴─────────────────┴──────────────┴────────────┘
                                            ▼
                                          ┌───┐
                                          │END│
                                          └───┘
```

| Node                  | Input payload         | Output                                    |
| --------------------- | --------------------- | ----------------------------------------- |
| `hint`                | manip kind, question, correct + selected labels, attempt | one short observational hint |
| `paraphrase`          | beat id, original prose                | rewritten paragraph              |
| `classify_reflection` | beat id, manip kind, reflection text  | `{ category, reaction }` JSON     |
| `scaffold_mc`         | beat id, manip kind, question, options, correctOptionId | `{ paraphrasedQuestion, keepOptionId }` JSON; route returns `{ paraphrasedQuestion, reducedOptions: [correct, distractor] }` |
| `advance_to_beat`     | from/to beat ids, kind label, student name | one in-world acknowledgement line |
| `chat` (blocking fallback) | full chat context  | one observational reply              |

Every node passes its model output through `isPraiseBombing(text)`. If a
praise phrase slips through ("great job", "awesome", "perfect", "you got
this", etc.) the node throws and the route returns 500 → client falls back
to canonical copy.

`scaffold_mc` has an extra contract: the node throws if the model picks the
correct option id as the distractor, or picks an id not in the original
options. The client *also* re-checks that the correct option survived the
reduction before accepting the swap.

## Streaming chat — SSE protocol

The chat path bypasses the graph and pipes `ChatAnthropic.stream()` directly
into a `ReadableStream` from `POST /api/agent/chat`. The prompt comes from
`buildChatMessages(payload)` in `lessonAgent.ts` (one source of truth).

```
POST /api/agent/chat
  ↓
text/event-stream
  ↓
data: <token>
data: <token>
...
data: [DONE]
```

Multi-line tokens use one `data: ` line per content line, joined back on
the client (matches the SSE spec). Praise words detected mid-stream cause
an immediate `[DONE]` and the client falls back to canonical copy.

Client side, `streamChat()` is an `async function*` that fetches the
endpoint, walks `Response.body.getReader()` parsing `data: ` events, and
yields each token until `[DONE]` or stream close. It never throws — an
iterator that yields zero tokens is the "no LLM reply, use fallback"
signal.

## Voice (ElevenLabs TTS)

Tutor lines speak as they appear. Stack:

```
LessonPage (each ari emission site)
        │  speakAri(text)
        ▼
voicePlayer  (singleton queue, mute-aware)
        │  fetchAudio(text)
        ▼
ttsClient    (in-memory text→Blob cache)
        │  POST /api/tts { text }
        ▼
/api/tts route
        │  validate text, read ELEVENLABS_API_KEY
        ▼
elevenLabsClient.synthesizeSpeech (Rachel · eleven_flash_v2_5)
        │  audio/mpeg bytes
        ▼
HTMLAudio in voicePlayer plays the Blob URL to completion, then dequeues.
```

Design contract:

- **Gesture-gated.** Before the lesson opens, `NamePrompt` plays a short
  ElevenLabs greeting via `playSampleVoice("Hi, I'm Ari — can you hear me?")`.
  The user clicks "I hear it" to confirm. That click is the user gesture that
  satisfies the browser's autoplay policy, so subsequent in-lesson speech
  plays without further interaction.
- **Mute is a hard floor.** When muted, `speak()` is a no-op (no fetch, no
  play) and the pending queue is dropped. The current line *finishes* — we
  don't try to interrupt the underlying `<audio>`. Mute is persisted in
  `localStorage` under `synthesis:voice:muted` and exposed in the lesson
  TopBar via `IconSound`.
- **Cache by text.** `ttsClient` keeps a module-level
  `Map<text, Promise<Blob>>`. Canonical hints and prose play once per page
  load even when they repeat. Failures aren't cached — a retry can succeed.
- **No `_cached`-style 304 dance.** The route sets
  `Cache-Control: private, max-age=86400` so the browser keeps audio across
  navigations; the in-memory map covers same-page repeats.
- **LangChain is not involved.** The voice subsystem is independent of
  Anthropic / the lesson agent. ElevenLabs failures degrade silently:
  `speak()` swallows fetch + play errors and moves on to the next line.

Call sites in [`LessonPage`](src/components/lesson/LessonPage.tsx) wire
`speakAri(text)` at every ari emission point: `pushAri`, the canonical-prose
append in `advanceTo`, and the spliced advance line. The paraphrase
text-swap deliberately does **not** speak — we already spoke the canonical
prose at the same index.

## Lesson state machine (`LessonPage`)

```ts
activeIdx: number;
doneSet: ReadonlySet<BeatId>;
mcSel: Partial<Record<BeatId, string>>;
mcStatus: Partial<Record<BeatId, 'idle'|'wrong'|'correct'>>;
hintAttempts: Partial<Record<BeatId, number>>;
manipStates: Partial<Record<BeatId, ManipulativeState>>;

// LLM-driven overrides — canonical-first, swap on resolve
liveHints: Partial<Record<BeatId, string>>;        // swaps canonical hint
scaffoldedMC: Partial<Record<BeatId, MCConfig>>;   // overrides beat.mc

// Chat
thinking: boolean;
streamingText: string | null;                       // live ari bubble
chat: readonly { from, text }[];
```

**On wrong MC:** push the user choice + canonical hint immediately. In the
background fire `fetchHint(...)` — if it resolves under budget AND its
per-beat request id is still the latest, swap `liveHints[beat.id]`.

**On the 3rd wrong on the same beat:** also fire `fetchScaffoldedMC`. On
success, store the new 2-option MC in `scaffoldedMC[beat.id]`, clear the
learner's last selection / status / live hint so they can pick fresh, and
the cell rebuilds the MC with the shorter question + two options.

**On advance:** push the canonical system message + canonical prose
immediately. Fire `fetchAdvanceLine` (in-world acknowledgement — splices in
*before* the prose) and `fetchParaphrase` (in-place swap of the prose
bubble). Per-beat request ids prevent stale responses from clobbering newer
ones.

**On chat send / quick reply:** push the user message, set
`thinking = true`, open the stream. First token arrives → flip to a live
`streamingText` bubble; tokens append. Stream ends → push the final text to
`chat`, clear `streamingText`. Zero tokens → push `aiReplyTo(...)` as
fallback.

All cell refs are memoized once with `useMemo(() => beats.map(() =>
createRef()))` so they're stable + safely readable in render. All
manipulatives keep their `onChange` in a ref so a fresh parent callback
identity doesn't re-fire the publish effect.

## Why these choices

- **One graph + a streaming side-channel.** LangGraph is great for routed
  blocking turns (router + post-filter + per-node discipline) and not great
  at token-by-token streaming. The graph handles 5 tasks; chat streams
  directly through `ChatAnthropic.stream()` using the same prompt builder.
  One source of truth for the chat system message, no graph overhead per
  token.
- **Canonical-first everywhere.** Authored prose / hints / questions render
  first. LLM responses *swap* into place. The lesson is fully playable with
  zero LLM availability.
- **Per-beat request ids.** A learner can answer the same MC wrong four
  times in 5 seconds; only the last LLM hint should win. Each LLM-swap site
  uses a `useRef<Partial<Record<BeatId, number>>>` to drop stale responses.
- **Tests for logic, not pixels.** Every pure helper + every agent node
  has unit tests. Manipulatives test their state machines. Visual-only
  components (Doodles, Hero, the demo set) skip tests this pass.
- **`useMemo` for cellRefs, not `useRef`.** Reading `useRef.current` during
  render trips `react-hooks/refs`. A memoized array of refs is render-safe
  and JumpButton still gets the per-cell handles.
- **Stable-ref onChange in every manipulative.** Parents pass a fresh
  inline arrow each render; without the ref the publish effect would re-fire
  every render and spin an infinite loop.

## Conventions

- **TDD red→green** per `CLAUDE.md` for logic. Visual / animation-only
  components are exempt this pass (with the user's sign-off).
- **One component per file.** Tests co-located.
- **Path alias:** `@/*` → `./src/*`. Resolved via
  `resolve.tsconfigPaths: true` in `vitest.config.mts`.
- **jest-dom matchers** auto-extended via `vitest.setup.ts`.
- **Vitest globals are off**; import `describe`/`it`/`expect` explicitly.
- **No Prettier, no Biome.** ESLint (`eslint-config-next`) only.
- **Post-change routine:** `npm run test:run` + `npm run lint` both green.

## Scripts

- `npm run dev` — Next dev server (Turbopack).
- `npm run build` — production build.
- `npm run lint` / `npm run lint:fix` — ESLint (check / auto-fix).
- `npm test` — Vitest watch mode.
- `npm run test:run` — Vitest one-shot (for CI / pre-commit).
