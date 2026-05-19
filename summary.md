# Synthesis — Architecture Summary

Living document. Updated whenever architecture, key decisions, data flow, or
module boundaries change. Explains **how it works and why**, not a changelog.

Forward-looking roadmap (Phase 1 → Phase 2 → Phase 3, what gets built when):
[PLAN.md](PLAN.md). Domain + pedagogy context: [synthesis_tutor_presearch.md](synthesis_tutor_presearch.md).

## What this app is

A six-beat fraction-equivalence lesson (½ = ²⁄₄) for a 7–10 year old on an
iPad, framed as a cosmos delivery story ("the Spirit run"), plus a
"How It Works" one-pager that walks adult viewers through the eight
Montessori principles behind it. Beat prose is fully scripted — the LLM
(Haiku 4.5) sits behind a LangGraph state graph and shapes every chat reply,
every wrong-answer hint, every reflection reaction, and — when the same MC
is missed three times — a scaffolded simpler version of the question.

Two UI routes, one visual system (cosmos / space palette in
[globals.css](src/app/globals.css)):

- **`/` — `HowItWorksPage`** — full-bleed scrollytelling marketing page.
- **`/lesson` — `LessonPage`** — six-beat lesson; full-width notebook
  (chocolate ration → moon-pizza → star-map → warp-drive Block Studio).
  Goes through a `NamePrompt` first so the student's name is captured
  before the lesson starts. There is no chat rail — Ari is voice-only.
  The chocked-up `ChatRail` / `ChatMessage` / `QuickReply` / `TypingDots`
  files are still on disk as dead code in case the rail is ever
  re-introduced, but nothing imports them anymore.
  The 6th beat (`fraction_box_explore`) ships as **Block Studio** — a
  guided 1-2-3 multi-rail puzzle; the older single-row `FractionBox`
  manipulative is still on disk but no longer wired into any beat.

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
  a single StateGraph with five nodes (one per task). Streaming chat
  bypasses the graph and pipes `ChatAnthropic.stream()` straight into SSE.
- **`langsmith`** — tracing is automatic when `LANGSMITH_TRACING=true` and
  `LANGSMITH_API_KEY` / `LANGSMITH_PROJECT` are set (LangChain reads them at
  module load). Required env vars listed below.

## Required env vars

| Var                    | Required? | Used for                                                  |
| ---------------------- | --------- | --------------------------------------------------------- |
| `ANTHROPIC_API_KEY`    | yes       | All LLM calls (hint, classify, scaffold, advance, chat). |
| `ELEVENLABS_API_KEY`   | optional  | Server-side TTS at `/api/tts`. Also used (offline, one-off) to generate `public/audio/ambient.mp3` for the home page pad. Without it the lesson plays silent. |
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
      classify-reflection/route.ts     # POST — blocking
      scaffold-mc/route.ts             # POST — blocking, returns 2-option MC
      advance/route.ts                 # POST — blocking, in-world advance line
      chat/route.ts                    # POST — SSE token stream
    api/tts/route.ts                   # POST — text → audio/mpeg via ElevenLabs
  components/
    space/                   # Stars, GridBg, Doodles (+ 9 doodle icons)
    manipulatives/
      ChocolateBar.tsx, PizzaSlicer.tsx, PaperFold.tsx
      FractionBox.tsx        # single-row Lego puzzle — unwired (superseded by BlockStudio)
      BlockStudio/           # 6th-beat guided 1-2-3 multi-rail manipulative
        BlockStudio.tsx, BlockStudioRail.tsx, BlockStudioPalette.tsx,
        BlockStudioInspector.tsx, BlockStudioStepper.tsx,
        BlockStudioStepIntro.tsx, BlockStudioCelebration.tsx,
        BlockStudioToast.tsx, blockStudioLogic.ts (+ test), types.ts
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
      lessonAgent.ts         # StateGraph: hint | classify_reflection | scaffold_mc | advance_to_beat | chat
      generateHint.ts        # back-compat wrapper around runLessonAgent({task:'hint'})
      anthropicClient.ts     # getHintLLM() + getStreamingLLM()
      validation.ts          # shared whitelists + isKnownBeatId / isKnownKind
      hintClient.ts, classifyReflectionClient.ts
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
       ┌──────────┬────────────────┼──────────────────┬──────┐
       ▼          ▼                ▼                  ▼      ▼
    ┌──────┐ ┌────────────────┐ ┌────────────┐ ┌──────────────┐ ┌──────┐
    │ hint │ │ classify_      │ │ scaffold_mc│ │ advance_     │ │ chat │
    │      │ │  reflection    │ │            │ │  to_beat     │ │      │
    └──┬───┘ └──────┬─────────┘ └──────┬─────┘ └──────┬───────┘ └──┬───┘
       └────────────┴─────────────────┴──────────────┴────────────┘
                                  ▼
                                ┌───┐
                                │END│
                                └───┘
```

Beat prose is fully scripted and never rewritten — the LLM-driven
paraphrase node was removed (the canonical-first contract collapses to
just "always show the scripted text").

| Node                  | Input payload         | Output                                    |
| --------------------- | --------------------- | ----------------------------------------- |
| `hint`                | manip kind, question, correct + selected labels, attempt | one short observational hint |
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

## Streaming chat — SSE protocol (currently dormant)

The chat rail was retired, so nothing in the running app calls this any
more — but the endpoint + client are still wired and tested in case the
free-text Ari channel is ever brought back.

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

Voice is the *only* Ari channel in the lesson now — the chat rail is gone.
The kid reads the cell (or listens to it), works the exercise, and the
lesson advances. Stack:

```
LessonPage (mount, wrong MC, correct MC, advanceTo)
        │  speakAri(text)          ← double-rAF deferred
        ▼
voicePlayer  (singleton FIFO queue, mute-aware)
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
- **Reveal-gated `speakAri`.** Every call goes through a double
  `requestAnimationFrame` before reaching `voice.speak`. React commits +
  paints first, then audio fetch starts. The voice player itself is FIFO,
  so consecutive `speakAri` calls play in issue order.
- **View-driven, not chat-driven.** Voice anchors to the *active cell*,
  not to a chat log. The four emission sites in `LessonPage` are:
  1. **Mount.** `voice.stop()` clears any leftover queue and then the
     active beat's prose is queued. Re-entering the route (Home → Lesson)
     always starts on whichever cell the kid is currently on.
  2. **Wrong MC.** The canonical hint (or the swapped-in LLM hint) is
     queued. No advance — the kid stays on the cell.
  3. **Correct MC.** The celebration line is queued; 600ms later
     `advanceTo` fires.
  4. **`advanceTo`.** Races `fetchAdvanceLine`; on success queues
     `speakAri(line)` *then* `speakAri(prose)`; on failure queues just the
     prose. Visual order in the notebook (the unlock banner sits above the
     newly-active cell) matches audio order.
- **Silent during exercise.** While the kid is tinkering with a
  manipulative or pondering an MC, there is no `speakAri` call. The
  player drains whatever was already queued (typically the prose) and
  then sits idle.
- **Unmount stops the queue.** Navigating away from the lesson (back
  arrow, browser back) calls `voice.stop()` in the lesson's mount-effect
  cleanup. The currently-playing utterance finishes — `voicePlayer.stop`
  is intentionally non-interrupting — but no more lines play.
- **Gesture-gated.** Before the lesson opens, `NamePrompt` plays a short
  ElevenLabs greeting via `playSampleVoice("Hi, I'm Ari — can you hear me?")`.
  The user clicks "I hear it" to confirm. That click is the user gesture that
  satisfies the browser's autoplay policy, so subsequent in-lesson speech
  plays without further interaction.

The "▸ cell 02 unlocked" separator that used to live in the chat rail
now renders inline as `.cell-unlock-banner` above the newly-unlocked
cell. It is tracked by `unlockedBanners: Set<BeatId>` in `LessonPage`
state (not persisted — it's a session-only display cue).

## Ambient audio (home page)

The home page (`HowItWorksPage`) loops a soft cosmos pad behind the
scrollytelling scene. It's a separate channel from the lesson voice —
different MP3, different mute state, different storage key — so toggling
one doesn't affect the other.

- **One static asset.** `public/audio/ambient.mp3` is a ~22s ElevenLabs
  sound-generation render that loops with `<audio loop>`. Pre-generated
  so each visit pays zero generation cost or latency. To regenerate:
  ```
  KEY=$(grep '^ELEVENLABS_API_KEY=' .env | cut -d= -f2-) && \
  curl -X POST "https://api.elevenlabs.io/v1/sound-generation" \
    -H "xi-api-key: $KEY" -H "content-type: application/json" \
    -d '{"text":"soft cosmic ambient pad, slow breathing synth drone, low warm sub bass, gentle high shimmer, peaceful space lullaby, no rhythm, no melody, no percussion, calm meditation, dreamy reverb","duration_seconds":22,"prompt_influence":0.3}' \
    -o public/audio/ambient.mp3
  ```
- **`ambientPlayer` singleton.** `src/lib/audio/ambientPlayer.ts` owns
  one `HTMLAudioElement` (loop=true, volume 0.35) and exposes
  `setMuted` / `isMuted` / `subscribe`. Mute state is mirrored to
  `localStorage` under `synthesis:ambient:muted`.
- **Default muted.** First visit shows the "play" icon — the user's
  click is the gesture the browser needs to allow autoplay. If the user
  unmutes and `audio.play()` is rejected (no gesture yet), the stored
  intent still flips to "unmuted" so the icon stays honest; the next
  click will play.
- **The toggle.** `<AmbientAudio />` renders a small fixed-position
  round chip at the top-right corner, reusing `IconSound` from the
  lesson so the visual language matches the lesson's mute button. State
  binds via `useSyncExternalStore(player.subscribe, player.isMuted)`.

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

// View / voice cues
unlockedBanners: ReadonlySet<BeatId>;              // session-only
```

**On wrong MC:** flip status to `wrong` immediately and queue the canonical
hint for voice. In the background fire `fetchHint(...)` — if it resolves
under budget AND its per-beat request id is still the latest, swap
`liveHints[beat.id]` so the bubble re-renders with the LLM hint.

**On the 3rd wrong on the same beat:** also fire `fetchScaffoldedMC`. On
success, store the new 2-option MC in `scaffoldedMC[beat.id]`, clear the
learner's last selection / status / live hint so they can pick fresh, and
the cell rebuilds the MC with the shorter question + two options.

**On correct MC:** flip status to `correct`, queue the celebration line
for voice, add the beat to `doneSet`. 600ms later `advanceTo` runs.

**On advance:** flip `activeIdx`, add the next beat to `unlockedBanners`,
race `fetchAdvanceLine`, then queue voice in visual order: `[advanceLine,
nextProse]` (or just `[nextProse]` if no line). Scroll the new cell into
view 250ms after the flip. The prose itself is scripted and never swapped.

**Block Studio (the 6th beat).** `fraction_box_explore` carries a
`manipulative: { kind: 'blockstudio', palette, steps, quests }` config; the
state machine treats it like any other manipulative — calls `renderManipulative`
to mount `<BlockStudio>` with `(config, value, onChange, disabled)`. The
component is self-contained: it owns its 1-2-3 stepper, multi-rail mat,
quest sub-index, drag/drop, equivalence detection, toast queue, and
celebration overlay. It publishes a `BlockStudioState` upward on every
commit — `{ stepIdx, questIdx, maxStepReached, rails, questsDone,
completed }`. The beat is "done" when `state.completed === true`, which
`BlockStudio` sets when the final quest celebration fires. Because it's the
last beat, no `advanceTo` runs after — `LessonPage` just adds it to
`doneSet` and the `Outro` flips to its done state.

Behavior shaped by `BlockStudio`:

- **Step 1 (Play):** any palette brick drops on any rail. Ready when
  total bricks across all rails ≥ 3.
- **Step 2 (Compare):** entering this step the first time resets to three
  fresh empty rails. Ready when ≥ 2 rails sum to exactly 1 with *distinct*
  brick signatures (order-independent `comboKey`).
- **Step 3 (Quest):** entering resets to two fresh empty rails. Three
  scripted quests run in sequence: fill any rail to 1 → make ½ without a
  ½ brick → fill a rail with ≥ 3 distinct brick sizes. The Next button
  cycles `Next quest →` → `Next quest →` → `Finish lesson`.
- **Equivalence highlight:** any rails sharing a reduced sum and having
  at least 2 distinct brick signatures light up with a blue ring and
  appear in the inspector's "Equivalent rows" card.
- **Drag/drop:** pointer events, ghost follows cursor, hit-test
  `[data-rail-id]` bounding boxes with a 12px vertical fudge, reject
  drops that would exceed 1 (+1e-9 epsilon), dragging from workspace and
  dropping off any rail removes the brick. `Escape` cancels.

All pure logic (step predicates, quest predicates, equivalence-group
detection, insert-index from midpoints, canPlaceBrick) lives in
`blockStudioLogic.ts` and is unit-tested in `blockStudioLogic.test.ts`.
The React surface (component, rail, palette, inspector, stepper, intro
card, celebration, toast) is intentionally not test-rendered — the user
explicitly chose "pure logic only" for this lesson.

Re-skinned to the cosmos palette: chrome uses `--ink` / `--ink-soft` /
`--ink-mute` / `--line` / `--line-strong`; accents pull `--blue` (active +
equivalence + hover), `--green` (ready / done / one-whole), `--orange`
(over-one warning). Bricks keep their bright `PALETTE_COLORS` map
(`{2:#f06b85, 3:#ffb079, 4:#5b8cff, 6:#5fd897, 8:#b69bff, 12:#7fdce8}`)
since they are the visual focus. Layout collapses to a single vertical
stack on portrait/narrow viewports; switches to a three-column grid
(palette · mat · inspector) at `min-aspect-ratio: 1/1` and ≥ 900 CSS
pixels wide.

Persistence: because `BlockStudioState` is a new `ManipulativeState`
shape, `SCHEMA_VERSION` in `lessonPersistence.ts` bumped from 1 → 2; older
snapshots are silently rejected and the lesson restarts cleanly. The new
state is validated through `isManipulativeState` (kind === 'blockstudio'
+ field-shape checks) before re-hydration.

**Resume repair (`correctedLessonState`).** A correct MC answer marks the
beat done synchronously but defers `advanceTo` by 600ms via `setTimeout`.
The persistence rAF runs in between — so a refresh / nav-away inside that
600ms window writes a snapshot whose `activeIdx` still points at a beat
already in `doneIds`, with the next cell locked. On hydration in
`/lesson/page.tsx` we run `correctedLessonState(decoded, lesson.beats)`,
which walks `activeIdx` forward past any contiguous run of done beats
(clamped at `beats.length - 1`). The learner lands on the right cell
instead of getting parked on a completed one.

**Mount-voice rAF is cancellable.** The mount voice effect used to call
`speakAri(prose)`, which defers `voice.speak` through a non-cancellable
double-`requestAnimationFrame`. Under React StrictMode (Next dev's
default), the effect mounts → cleans up → mounts again, and the cleanup
couldn't cancel the scheduled speak — so the same prose was pushed onto
the FIFO queue twice and played twice. The mount effect now manages its
own rAF chain locally (`raf1` / `raf2` captured in closure) and
`cancelAnimationFrame`s both in cleanup, before calling `voice.stop()`.
Other `speakAri` sites (advance line, celebration, hint) remain unchanged —
they fire from event handlers, not mount effects, so the StrictMode
remount path doesn't apply.

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

## Responsive design (iPad-first)

The app is built to be opened on an iPad of any size, in either orientation.
All adaptive CSS lives in [`globals.css`](src/app/globals.css); components
themselves carry no breakpoint logic — they just rely on classes whose
declarations vary by media query.

**Target devices** (CSS pixels, both orientations):

| Device           | Portrait      | Landscape     |
| ---------------- | ------------- | ------------- |
| iPad mini        | 744 × 1133    | 1133 × 744    |
| iPad             | 810 × 1080    | 1080 × 810    |
| iPad Pro 11"     | 834 × 1194    | 1194 × 834    |
| iPad Pro 12.9"   | 1024 × 1366   | 1366 × 1024   |

**Breakpoint tiers** (`max-width`):

- **`1180px`** — landscape iPad mini → iPad Pro 11" landscape. Trims hero
  paddings + gaps, narrows `.hero-preview` so the side-by-side hero row
  actually fits at 1133 wide.
- **`1024px`** — iPad Pro 12.9" portrait and below. Scroll-top button
  hugs the corner more tightly.
- **`900px`** — portrait iPad mini + iPad portrait. `.principle-stage`
  collapses to a single column (was already there); on top of that we now
  hide `.side-rail` (it overlapped principle text at 744), tighten all
  section paddings, and clamp the hero / section / principle headings so
  type doesn't crash into edges.
- **`720px`** — phones. Further padding shrink, smaller hero h1.

**Orientation-driven lesson stage.** The lesson's chat-on-the-left /
notebook-on-the-right grid is keyed off `min-aspect-ratio: 1/1`, not a
width breakpoint, because what matters is whether there's room for two
columns next to each other:

- Portrait (`max-aspect-ratio: 1/1`) → stage stacks: chat on top
  (`max-height: 38vh`), notebook below. Cell gutter narrows from 80→60px
  and the floating JumpButton gets 140px of bottom clearance from the
  notebook so it doesn't sit on top of the last cell.
- Landscape, `≤ 1280px` (iPad mini landscape, iPad Pro 11" landscape) →
  side-by-side, but the chat column drops from 400→340px so the notebook
  isn't squeezed.
- Landscape, `≤ 1024px` → chat column drops to 300px and chat
  internal padding tightens.

**TopBar.** The verbose "equivalent fractions · ½ = ²⁄₄" tag shrinks
letter-spacing at ≤ 900px and is hidden outright at ≤ 560px so the
progress segments + back/sound buttons stay clear.

**iPad Safari viewport.** `.lesson-app` uses `height: 100dvh` (with a
`100vh` fallback) so the Safari URL bar collapsing/expanding doesn't push
the bottom of the notebook offscreen.

**Hero h1 / Intro h1.** Both use `clamp()` instead of fixed sizes so the
title scales smoothly from iPad mini portrait up through desktop.

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
