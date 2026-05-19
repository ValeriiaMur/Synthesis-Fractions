# Synthesis — Architecture Summary

Living document. Updated whenever architecture, key decisions, data flow, or
module boundaries change. Explains **how it works and why**, not a changelog.

Forward-looking roadmap (Phase 1 → Phase 2 → Phase 3, what gets built when):
[PLAN.md](PLAN.md). Domain + pedagogy context: [synthesis_tutor_presearch.md](synthesis_tutor_presearch.md).

## What this app is

A six-beat fraction-equivalence lesson (½ = ²⁄₄) for a 7–10 year old on an
iPad, framed as a cosmos delivery story ("the Spirit run"), plus a
"How It Works" one-pager that walks adult viewers through the eight
Montessori principles behind it.

**Fully scripted, no LLM.** Per the 1-week challenge brief, the tutor's
dialogue is scripted with simple branching logic — no LLM-based agent.
Every line the tutor speaks lives in [`lessonData.ts`](src/lib/lesson/lessonData.ts):
beat prose, MC questions, per-wrong-option hints, escalating canonical
hints, scaffolded 2-option variants for stuck cells, in-world transition
lines, and celebration replies. Branching (yes/no on MC correctness,
which hint to play, when to scaffold, where to advance) is a pure module
[`branching.ts`](src/lib/lesson/branching.ts) — fully unit-tested, no
network, no async. ElevenLabs TTS narrates the authored lines so Ari
sounds warm without being stochastic. The earlier LangGraph + LLM agent
layer (the StateGraph + 4 task clients + 5 API routes + the streaming
chat rail) was deleted in full — the active lesson never depended on it.

Two UI routes, one visual system (cosmos / space palette in
[globals.css](src/app/globals.css)):

- **`/` — `HowItWorksPage`** — full-bleed scrollytelling marketing page.
- **`/lesson` — `LessonPage`** — six-beat lesson; full-width notebook
  (chocolate ration → moon-pizza → star-map → warp-drive Block Studio).
  Goes through a `NamePrompt` first so the student's name is captured
  before the lesson starts. There is no chat rail — **each cell IS one
  turn of a vertical chat**: `<Prose>` (Ari speaks) → manipulative / MC
  (student responds) → `<StudentEcho>` (right-aligned mirror of the
  response) → `<HintBubble>` / `<CelebrationBubble>` (Ari reacts) → next
  cell unlocks. This satisfies the brief's "chat-style interface"
  requirement using the notebook layout rather than a side rail.
  The 6th beat (`fraction_box_explore`) ships as **Block Studio** — a
  guided 1-2-3 multi-rail puzzle; the older single-row `FractionBox`
  manipulative is still on disk but no longer wired into any beat.

**Branching contract.** Every tutor decision (which hint, when to
scaffold, which transition line, which celebration) is a pure call into
`branching.ts`. No async, no network, no race conditions. State lives in
React (`LessonPage`) and on disk (`lessonPersistence.ts`); branching.ts
is the rulebook applied to that state.

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
- **No LLM in the active path.** The scripted-tutor approach means the
  lesson runs end-to-end with only ElevenLabs (TTS) hitting the network.
  `@langchain/*` and `langsmith` are still in `package.json` from the
  retired agent layer; nothing imports them now, so they're safe to drop
  in a future dependency cleanup.

## Required env vars

| Var                    | Required? | Used for                                                  |
| ---------------------- | --------- | --------------------------------------------------------- |
| `ELEVENLABS_API_KEY`   | optional  | Server-side TTS at `/api/tts`. Also used (offline, one-off) to generate `public/audio/ambient.mp3` for the home page pad. Without it the lesson plays silent — all tutor text is still on screen. |

When `ELEVENLABS_API_KEY` is absent `/api/tts` returns 500 and the voice
player silently no-ops; the lesson stays fully playable as a silent
read-along.

## Module layout

```
src/
  app/
    page.tsx                 # renders <HowItWorksPage />
    lesson/page.tsx          # NamePrompt → LessonPage
    layout.tsx, globals.css
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
      Caption, Fraction, shade
    lesson/
      LessonPage.tsx         # ~130 lines — composition only, wires the hooks below
      LessonBeatCell.tsx     # per-beat cell (prose + manipulative + MC + bubbles)
      ManipulativeSlot.tsx   # dispatch by manipulative.kind → ChocolateBar / Pizza / Paper / BlockStudio / FractionBox
      NamePrompt.tsx         # student-name capture, persists to localStorage
      Cell, Prose, MCBlock, StudentEcho
      HintBubble, CelebrationBubble
      Intro, Outro, ResumePrompt
      TopBar
      Icon* (Sound, ArrowLeft)
    onepager/
      HowItWorksPage, Hero, HeroPreview
      PrincipleRow, SideRail, ScrollProgress, ScrollDownInvite, ScrollTopButton
      AmbientAudio, AmbientGlow, Unveil, FinalCTA
      demos/ (DemoFrame, OrderToggle, TrayItem, FauxCell + 8 Demo* files)
  lib/
    lesson/
      types.ts               # Beat, MCConfig, ManipulativeConfig (incl. FractionBox), LessonState
      lessonData.ts          # 6 beats with story-fied prose + highlight tokens
      branching.ts           # pure rulebook — reactToMC / shouldScaffold / advance
      validators.ts          # validateMC / validateManipulative (all 4 kinds)
      lessonPersistence.ts   # localStorage snapshot + isManipulativeState guard
      phaseLabel.ts          # LessonPhase → "P1 · introduce" label
      useLessonStateMachine.ts  # state + handleMC / handleManip / advanceTo
      useLessonVoice.ts      # speakAri + mute + mount-time voice + resume scroll
      useLessonPersistence.ts   # snapshot effect + beforeunload backstop
      stripMarkup.ts, completes.ts, fractions.ts, titleCaseName.ts
      manipSummary.ts        # short label for each manipulative state
      useReveal.ts, useScrollProgress.ts
    audio/
      ambientPlayer.ts       # home-page ambient pad singleton
    voice/
      elevenLabsClient.ts    # server-side ElevenLabs TTS wrapper (Rachel, eleven_flash_v2_5)
      ttsClient.ts           # client fetch + in-memory cache (text → Blob)
      voicePlayer.ts         # singleton queue + mute, factory + getVoicePlayer()
      playSample.ts          # one-off audio preview for the name-modal sound check
  hooks/
    useParallaxDoodles.ts, useElementProgress.ts,
    useActivePrinciple.ts, useSlideDrift.ts
```

Tests sit next to the component they cover (`*.test.tsx` / `*.test.ts`).
Vitest picks up `src/**/*.{test,spec}.{ts,tsx}` per
[`vitest.config.mts`](vitest.config.mts).

## Branching ([`branching.ts`](src/lib/lesson/branching.ts))

The scripted tutor's "intelligence" is one pure module + one data table.
No graph, no agent, no async, no race conditions.

```
              ┌─────────────────────────────────────┐
              │ kid clicks an MC option / completes │
              │ a manipulative                       │
              └─────────────────┬───────────────────┘
                                │
                                ▼
                      reactToMC(beat, optionId,
                                prevAttempts, name)
                                │
                ┌───────────────┴────────────────┐
                ▼                                ▼
        kind: 'correct'                    kind: 'wrong'
        line: correctReply                 line: per-option hint
        nextBeatId                              ?? attempt-indexed
        transitionLine                          canonical
                                           shouldScaffold
```

| Decision                  | Source of truth                                |
| ------------------------- | ---------------------------------------------- |
| What does Ari say on right? | `beat.mc.correctReply` (authored)              |
| Which beat is next?       | `lesson.beats[idx + 1]?.id`                    |
| In-world transition line? | `nextBeat.enterLine`, name-interpolated        |
| What does Ari say on wrong? | `mc.hintByWrongOption[optionId]` if authored, otherwise `mc.canonicalHints[attempt]` (clamped at last entry) |
| When to scaffold?         | `prevAttempts + 1 >= SCAFFOLD_THRESHOLD (3)` AND `mc.scaffolded` is authored |
| Which scaffold to swap?   | `beat.mc.scaffolded` (authored 2-option variant) |

`{name}` slots in `correctReply` / `enterLine` are interpolated via
`interpolate(template, { name })`. The whole module is 17 tests
([branching.test.ts](src/lib/lesson/branching.test.ts)) — no mocking,
no async, no setup.

### Retired layers

Two earlier surfaces were removed entirely once it was clear nothing in
the active lesson depended on them:

- **LangGraph + LLM agent** — `src/lib/agent/` (StateGraph + 4 task
  clients + prompts) and `src/app/api/agent/` (5 API routes: hint,
  classify-reflection, scaffold-mc, advance, SSE chat stream). Deleted.
- **Chat rail UI** — `ChatRail`, `ChatMessage`, `QuickReply`,
  `TypingDots`, `JumpButton`, plus the `IconArrowDown` / `IconPause` /
  `IconSend` icons that only those components used. Also
  `aiReplyTo.ts` (the deterministic chat-fallback the rail consumed).
  Deleted.

The lesson now drives Ari through voice + inline cell bubbles only —
there is no streaming chat surface to maintain.

The `FractionBox` manipulative is still on disk: `LessonPage` keeps a
fallback render branch for `kind: 'fractionbox'` configs and the
`FractionBoxConfig` / `FractionBoxState` types remain in
`ManipulativeConfig` / `ManipulativeState` unions, but no beat in
`lessonData.ts` uses `kind: 'fractionbox'`. Deleting it would mean
trimming those unions + the `lessonPersistence.ts` validator + the
LessonPage branch; kept as-is because `FractionBoxBar` is the brick type
BlockStudio is built on, so a clean rename is a separate change.

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
- **No LLM in the voice path.** ElevenLabs failures degrade silently:
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
  2. **Wrong MC.** The branching-resolved hint (per-option override or
     attempt-indexed canonical) is queued. No advance — the kid stays on
     the cell.
  3. **Correct MC.** The celebration line is queued; 600ms later
     `advanceTo` fires.
  4. **`advanceTo`.** Reads `enterLineFor(nextBeat, name)` from the
     authored data; if present, queues `speakAri(enterLine)` *then*
     `speakAri(prose)`; otherwise queues just the prose. Visual order in
     the notebook (the unlock banner sits above the newly-active cell)
     matches audio order.
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

## Unveil — home-page intro (once per session)

`HowItWorksPage` mounts an `<Unveil />` sibling before its `.page` div.
The component renders a fixed-position cream overlay with a dark-navy
square that grows from center to fill the viewport (~1.7s), then
unmounts at t=1.9s. The square's color matches `--bg-0`, so the moment
it covers the viewport it visually *becomes* the page underneath; the
cream backdrop fades out under cover, the page itself fades in via the
`.page-reveal` sibling rule, and the visitor lands directly on the dark
cosmos scene.

- **Once per browser session.** `Unveil` reads `sessionStorage` key
  `synthesis:unveil-played` via `useSyncExternalStore` with `false` as
  the server snapshot. SSR therefore always emits the overlay markup so
  the `.unveil ~ .page-reveal` rule hides the page at first paint (no
  FOUC). On a repeat visit the client snapshot reads `true` and React
  reconciles to `null` right after hydration — one frame of fully styled
  overlay, then it's gone. The earlier `useState(() => hasUnveilPlayed())`
  initializer caused an SSR/CSR mismatch where the server-rendered DOM
  briefly appeared as raw text in the corner before React tore it down;
  `useSyncExternalStore` is React's canonical fix and also satisfies
  `react-hooks/set-state-in-effect`.
- **Stamp on completion, not on mount.** The flag is written **when the
  1.9s timer fires**, not at mount. Stamping at mount looked simpler but
  broke React Strict Mode (Next.js default in dev): strict mode unmounts
  → remounts every component on the first cycle, so the second mount
  would see the flag and short-circuit, and the visitor would never see
  the animation. Stamping on completion means the cleanup of the first
  (cancelled) mount clears the timer before it can stamp; only the
  surviving mount runs the timer to the end and writes the flag.
  Side-benefit: a navigation away mid-animation also leaves the flag
  unset, so the visitor gets the full intro next time. The gate uses
  **session** (not local) storage so a new tab gets the unveil again —
  it's a brand moment, not a permanent onboarding step.
- **CSS scoping via sibling combinator.** All page-reveal styles in
  `globals.css` are scoped to `.unveil ~ .page-reveal`. When Unveil
  returns `null` the selector misses and the page is fully visible from
  frame one, with no JS coordination between the two components. On
  first visit the selector matches, the page starts at opacity 0, and
  the `unveilPageReveal` keyframe fades it in starting at 1.5s.
- **A11y + perf.** `aria-hidden="true"` on the overlay (the brand mark
  "synthesis tutor" is decorative — it duplicates the page's own
  heading), `pointer-events: none` so scroll/clicks pass through during
  the 1.9s window, and `prefers-reduced-motion: reduce` hides the
  overlay and skips the page fade entirely. The square animates only
  `transform` and `opacity` — compositor-only, no layout or paint per
  frame.

## Lesson state machine (`LessonPage`)

```ts
activeIdx: number;
doneSet: ReadonlySet<BeatId>;
mcSel: Partial<Record<BeatId, string>>;
mcStatus: Partial<Record<BeatId, 'idle'|'wrong'|'correct'>>;
hintAttempts: Partial<Record<BeatId, number>>;
manipStates: Partial<Record<BeatId, ManipulativeState>>;

// Branching-driven cell overrides (filled by branching.ts, not LLM)
liveHints: Partial<Record<BeatId, string>>;        // hint shown in the bubble
scaffoldedMC: Partial<Record<BeatId, MCConfig>>;   // 2-option swap after 3 wrongs

// View / voice cues
unlockedBanners: ReadonlySet<BeatId>;              // session-only
```

**On wrong MC:** call `reactToMC(beat, optionId, prevAttempts, name)`.
The returned `line` (per-option hint if authored, else attempt-indexed
canonical) is stored in `liveHints[beat.id]` and spoken via `speakAri`.
`hintAttempts[beat.id]` increments. If `reaction.shouldScaffold === true`
AND `beat.mc.scaffolded` is authored, swap `scaffoldedMC[beat.id]` to the
2-option variant and clear the kid's selection so they can pick fresh.

**On correct MC:** call `reactToMC(...)`. The returned `line` is the
authored `correctReply` (name-interpolated). Speak it. Mark the beat
done. If `reaction.nextBeatId` is non-null, fire `advanceTo(next)` on a
600ms timeout; otherwise (final beat) speak the closing line on a 500ms
timeout.

**On advance:** flip `activeIdx`, add the next beat to `unlockedBanners`,
read `enterLineFor(nextBeat, name)` and speak it (if any), then speak the
prose. Scroll the new cell into view 250ms after the flip. All
synchronous — no fetch, no race.

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

- **Scripted, not generated.** Every line Ari can say lives in
  `lessonData.ts`; every decision lives in `branching.ts`. Removes the
  whole class of LLM failure modes (latency, hallucination, racing
  responses) and lets the lesson run end-to-end with only ElevenLabs in
  the network path.
- **Tests for logic, not pixels.** Every pure helper + every branching
  rule has unit tests. Manipulatives test their state machines.
  Visual-only components (Doodles, Hero, the demo set) skip tests this
  pass.
- **Stable-ref onChange in every manipulative.** Parents pass a fresh
  inline arrow each render; without the ref the publish effect would
  re-fire every render and spin an infinite loop.

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

**Orientation-driven lesson stage.** The lesson is a single full-width
notebook column (the chat rail was retired). Cell gutter narrows from
80→60px on portrait so the manipulatives breathe on iPad mini portrait.

**TopBar.** The verbose "equivalent fractions · ½ = ²⁄₄" tag shrinks
letter-spacing at ≤ 900px and is hidden outright at ≤ 560px so the
progress segments + back/sound buttons stay clear.

**iPad Safari viewport.** `.lesson-app` uses `height: 100dvh` (with a
`100vh` fallback) so the Safari URL bar collapsing/expanding doesn't push
the bottom of the notebook offscreen.

**iOS Safari safe-area + tap latency.** Two pitfalls that only reproduce
on the real iOS Simulator (Chrome DevTools mobile preview skips both):

- `src/app/layout.tsx` exports a `Viewport` config with
  `viewportFit: 'cover'`. Without it iOS Safari reports
  `env(safe-area-inset-top)` as `0` and the topbar's `padding-top` calc
  collapses up under the notch / status bar.
- `globals.css` applies `touch-action: manipulation` +
  `-webkit-tap-highlight-color: transparent` to every `button`, `a`, and
  `[role="button"]`. The former removes WebKit's 300ms double-tap-to-zoom
  delay — without it MC options and topbar icons need a second tap to
  register on iOS, exactly the "I need to click a few times" symptom.

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
