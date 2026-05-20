# Synthesis — Architecture Summary

Living document. Updated whenever architecture, key decisions, data flow, or
module boundaries change. Explains **how it works and why**, not a changelog.

Forward-looking roadmap (Phase 1 → Phase 2 → Phase 3, what gets built when):
[PLAN.md](PLAN.md). Domain + pedagogy context: [synthesis_tutor_presearch.md](synthesis_tutor_presearch.md).

## What this app is

A six-beat **naming-first** fraction lesson for a 6–8 year old on an iPad,
plus a "How It Works" one-pager that walks adult viewers through the eight
Montessori principles behind it. The lesson opens by splitting a whole bar
in half, then teaches *what one half is* and *what one quarter is* before
it asks the kid to recognize that one half is the same as two quarters. See [montessori-plan.md](montessori-plan.md) for
the cognitive-load reasoning (the Hinten et al. 2025 meta-analysis on
fantastical content in young-child media).

**Fully scripted, no LLM.** Per the 1-week challenge brief, the tutor's
dialogue is scripted — no LLM agent. Each beat carries one short prose line
authored in [`lessonData.ts`](src/lib/lesson/lessonData.ts). Voice is *quiet
by default*: ElevenLabs TTS plays the beat's prose on entry, and that's it.
No celebration lines, no per-wrong hints, no scaffolded MC variants — the
material itself is the feedback (Montessori control-of-error).

Two UI routes, one visual system (cosmos / space palette in
[globals.css](src/app/globals.css)):

- **`/` — `HowItWorksPage`** — full-bleed scrollytelling marketing page.
- **`/lesson` — `LessonPage`** — six-beat lesson; full-width notebook.
  Goes through a `NamePrompt` first (the click satisfies the browser's
  autoplay-gesture requirement so the lesson can speak its prose).

The seven beats:

| # | Beat id                    | Concept                        | Material                                                              |
|---|----------------------------|--------------------------------|-----------------------------------------------------------------------|
| 0 | `whole_intro`              | Period 1 — introduce ① (whole) | Chocolate bar (4 quarter-units, no gap); tap splits it into two halves (toggle) |
| 1 | `name_half`                | Period 1 — introduce ½         | Chocolate tray, 2 half-slabs; tap each (½ overlay)                    |
| 2 | `name_quarter`             | Period 1 — introduce ¼         | Chocolate tray, 4 quarter-tiles; tap each (¼ overlay)                 |
| 3 | `mix_half_quarter`         | Period 2 — recognize ½ vs ¼    | Mixed mat (4 quarters + a centered half) with a cycling "tap the X" label |
| 4 | `recall_name`              | Period 3 — recall ("what is this?") | Recall: one piece, say it aloud, "show me" reveals the symbol + voice names it back (no STT) |
| 5 | `equiv_half_two_quarters`  | Period 3 — whole = 4 quarters  | Chocolate fill-the-whole (4 slots + pile) + draggable hammer that breaks it (dnd-kit) |
| 6 | `equiv_paper_check`        | Period 3 — *transfer* check    | Paper-fold (square, fold twice = proof)                               |

Beats 0–5 use the **same chocolate material** (cognitive coherence — one
visual schema across whole → naming → recall → equivalence; chocolate art
in `public/images/` rendered through `ChocolatePiece`, with a `seamless`
mode so quarter-units merge into one bar). Beat 6 swaps to paper-fold as a
transfer check. Beat 4 (recall) is the canonical Montessori third period:
the child *names the piece aloud* and reveals the confirmation — no speech
capture.

**Voice + SFX (ElevenLabs).** Beyond per-beat prose TTS, the lesson now
has two more audio layers, both muted by the single topbar toggle:
- **Material SFX** — `sfxPlayer` (default volume 0.55) plays short clips
  baked via `scripts/bake-sfx.mts` (ElevenLabs Sound Effects API):
  `chocolateSnap`, `paperFold`, `wholeSplit`, `hammerBreak`. Missing files
  no-op silently.
- **Spoken observational feedback** — `useSpokenFeedback` enqueues
  milestone lines through the voice player (FIFO, throttled ~1.3s, never
  interrupts the beat prose): naming feedback, the whole-split observation,
  and the "four quarters fill the whole" line. Live `/api/tts` covers any
  un-baked line.

No STT, no Conversational AI, no LLM in the lesson loop — per the presearch
scope. (PostHog captures one `lesson_feedback` event from the Outro;
gated on `NEXT_PUBLIC_POSTHOG_KEY`, no-op without it.)

**Decision contract.** There is no `branching.ts` anymore — the active
lesson has no branching to do. State lives in React (`LessonPage`) and on
disk (`lessonPersistence.ts`, schema v7); the only "rule" is `isBeatComplete`
in [`completes.ts`](src/lib/lesson/completes.ts), a pure dispatch on the
manipulative kind: whole = `split`, naming = every region in `tapped`,
recall = `revealed`, equivalence = `placedCount >= targetCount`, paper =
`folds.length >= targetFolds.length`.

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
| `ELEVENLABS_API_KEY`   | optional at runtime, required to (re)bake voice | At runtime: server-side TTS at `/api/tts` (fallback for un-baked lines only). Build-time: read by `npm run bake:voice` to generate `public/audio/voice/*.mp3`, and used (offline, one-off) to generate `public/audio/ambient.mp3`. Without it the lesson plays silent for any line not already in the baked manifest — tutor text is still on screen. |

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
      ChocolatePiece.tsx     # shared chocolate-image visual (PNG, used by all chocolate beats)
      PaperFold.tsx          # L5 transfer check: drag a corner to fold; 2 folds = done
      paper/                 # Paper, Quad, QuadLabels, PaperFrac, PaperStars, WholeNumber
    lesson/
      LessonPage.tsx         # composition only, wires the hooks below
      LessonBeatCell.tsx     # per-beat cell (prose + manipulative slot)
      ManipulativeSlot.tsx   # dispatch by manipulative.kind → Whole / Naming / Equivalence / PaperFold
      WholeMaterial.tsx      # Beat 0 — one whole bar, tap to split it in half
      NamingMaterial.tsx     # L1–L3 tap-to-name (chocolate bar / mixed mat)
      EquivalenceMaterial.tsx# L4 tap-to-cover (half-frame + slots + chocolate pile)
      NamePrompt.tsx         # autoplay-gesture capture; name stored in localStorage
      Cell, Prose
      Outro, ResumePrompt
      TopBar
      Icon* (Sound, ArrowLeft)
    onepager/
      HowItWorksPage, Hero, HeroPreview
      PrincipleRow, SideRail, ScrollProgress, ScrollDownInvite, ScrollTopButton
      AmbientAudio, AmbientGlow, Unveil, FinalCTA
      demos/ (DemoFrame, OrderToggle, TrayItem, FauxCell + 8 Demo* files)
  lib/
    lesson/
      types.ts               # Beat, ManipulativeConfig (Whole|Naming|Equivalence|Paper), states
      lessonData.ts          # 6 beats — whole intro → naming-first → equivalence → paper-fold check
      completes.ts           # isBeatComplete — pure predicate over (Beat, ManipulativeState)
      namingLogic.ts         # regionCount/regionKind/pickPromptKind/evalTap/feedbackMessage (L1–L3)
      coverLogic.ts          # placeQuarter/isCovered/coverStatusText (L4)
      paperLogic.ts          # nextFoldAxis/applyFold/isProven (L5)
      lessonPersistence.ts   # localStorage snapshot + isManipulativeState guard (schema v7)
      phaseLabel.ts          # LessonPhase → "P1 · introduce" label
      useLessonStateMachine.ts  # state + handleManip + advanceTo (no MC paths)
      useLessonVoice.ts      # speakAri + mute + mount-time voice + resume scroll
      useLessonPersistence.ts   # snapshot effect + beforeunload backstop
      stripMarkup.ts, titleCaseName.ts
      useReveal.ts, useScrollProgress.ts
    audio/
      ambientPlayer.ts       # home-page ambient pad singleton
      sfxPlayer.ts           # one-shot SFX (chocolate snap, paper fold), mute-aware
    voice/
      elevenLabsClient.ts    # server-side ElevenLabs TTS wrapper (Rachel, eleven_flash_v2_5)
      ttsClient.ts           # client fetch — manifest lookup → static MP3, else /api/tts
      voicePlayer.ts         # singleton queue + mute, factory + getVoicePlayer()
      playSample.ts          # one-off audio preview for the name-modal sound check
      sampleGreeting.ts      # SAMPLE_GREETING constant — shared by playSample + bake script
  hooks/
    useParallaxDoodles.ts, useElementProgress.ts,
    useActivePrinciple.ts, useSlideDrift.ts
```

Tests sit next to the component they cover (`*.test.tsx` / `*.test.ts`).
Vitest picks up `src/**/*.{test,spec}.{ts,tsx}` per
[`vitest.config.mts`](vitest.config.mts).

## Decision contract ([`completes.ts`](src/lib/lesson/completes.ts))

The lesson has no branching — every cell has exactly one path forward:
work the material until it accepts the action. The whole "tutor
intelligence" collapses to one pure predicate:

```
isBeatComplete(beat, state) →
  beat.kind === 'naming'      ? state.streak       >= masteryStreak
  beat.kind === 'equivalence' ? state.placedCount  >= targetCount
  beat.kind === 'paper'       ? state.folds.length >= targetFolds.length
  : false
```

Each manipulative also has its own pure-logic module — they're not part
of `completes.ts` but they're the same shape (synchronous, no fetch, no
React imports, unit-tested in isolation):

| Module            | Lessons | Exports                                                |
| ----------------- | ------- | ------------------------------------------------------ |
| `namingLogic.ts`  | L1–L3   | `regionCount`, `regionKind`, `pickPromptKind`, `evalTap` |
| `coverLogic.ts`   | L4      | `placeQuarter`, `isCovered`                            |
| `paperLogic.ts`   | L5      | `nextFoldAxis`, `applyFold`, `isProven`                |

Wrong actions (tapping the wrong region in NamingMaterial, dropping
extra quarters once the half is covered) are *silently rejected* by these
helpers — no streak penalty, no error sound, no UI scold. The absence of
the expected response IS the feedback (Montessori control-of-error).

### Retired layers

Earlier surfaces removed once nothing in the active lesson depended on
them:

- **LangGraph + LLM agent** — `src/lib/agent/` (StateGraph + task clients
  + prompts) and `src/app/api/agent/` (5 API routes). Deleted.
- **Chat rail UI** — `ChatRail`, `ChatMessage`, `QuickReply`, `TypingDots`,
  `JumpButton`, `aiReplyTo.ts`. Deleted.
- **`branching.ts` + `validators.ts`** — the old MC/hint/scaffold
  decision module and its companion validators. Deleted along with
  `MCBlock`, `HintBubble`, `CelebrationBubble`.
- **Six-beat story lesson** — Spirit-run narrative, BlockStudio,
  PizzaSlicer, FractionBox, Lego primitives, `fractions.ts`,
  `manipSummary.ts`. Deleted.

The lesson now drives Ari through voice + inline prose only — there is
no streaming chat surface to maintain and no story metaphor to parse.

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
        │  ① lazy GET /audio/voice/manifest.json  (once per page)
        │      ├─ hit  → GET /audio/voice/<sha>.mp3   (static, ~instant)
        │      └─ miss → POST /api/tts { text }       (fallback)
        ▼
/api/tts route (fallback only — un-baked lines)
        │  validate text, read ELEVENLABS_API_KEY
        ▼
elevenLabsClient.synthesizeSpeech (Rachel · eleven_flash_v2_5)
        │  audio/mpeg bytes
        ▼
HTMLAudio in voicePlayer plays the Blob URL to completion, then dequeues.
```

**Pre-baked tutor lines.** The lesson is fully scripted, so every line Ari
speaks is generated *once* into `public/audio/voice/<sha>.mp3` plus a
`manifest.json` that maps the exact spoken text → filename. `ttsClient`
loads the manifest lazily on the first call; subsequent lookups are
synchronous against an in-memory copy. Run `npm run bake:voice` whenever
prose changes — the script skips entries whose hash + file are already on
disk, so re-runs only pay ElevenLabs for new or edited lines. Lines that
aren't in the manifest (e.g. a new beat added without re-baking) silently
fall back to `/api/tts`, so dev never blocks on the bake step. Source of
truth for baked texts: `lesson.beats[].prose` (stripped of markup) plus
`SAMPLE_GREETING` from `sampleGreeting.ts`.

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
- **Manifest-first lookup.** Same `ttsClient` cache, but every miss first
  consults `/audio/voice/manifest.json` (lazy-fetched once) and serves a
  static `<sha>.mp3` when the text is present. The `/api/tts` route is now
  the un-baked-line fallback — the steady-state lesson never hits
  ElevenLabs from a learner's browser.
- **No `_cached`-style 304 dance.** The route sets
  `Cache-Control: private, max-age=86400` so the browser keeps audio across
  navigations; the in-memory map covers same-page repeats. The static MP3s
  get HTTP-level cacheability for free.
- **No LLM in the voice path.** ElevenLabs failures degrade silently:
  `speak()` swallows fetch + play errors and moves on to the next line.
- **Reveal-gated `speakAri`.** Every call goes through a double
  `requestAnimationFrame` before reaching `voice.speak`. React commits +
  paints first, then audio fetch starts. The voice player itself is FIFO,
  so consecutive `speakAri` calls play in issue order.
- **View-driven, not chat-driven.** Voice anchors to the *active cell*,
  not to a chat log. The two emission sites in `LessonPage` are:
  1. **Mount.** `voice.stop()` clears any leftover queue and then the
     active beat's prose is queued. Re-entering the route (Home → Lesson)
     always starts on whichever cell the kid is currently on.
  2. **`advanceTo`.** When a beat completes, `useLessonStateMachine`
     fires `advanceTo(next)`, which speaks the next beat's prose. One
     line, on advance — no celebrations, no hints, no announcements when
     the half is covered. The material's own visual signal (lift on
     correct tap, chocolate fills the slot, paper folds) carries the
     feedback.
- **Silent during exercise.** While the kid is tinkering with a
  manipulative there is no `speakAri` call. The player drains whatever
  was already queued (typically the prose) and then sits idle.
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

## Lesson SFX (chocolate snap, paper fold)

Tiny one-shot effects layered under Ari's voice. Two static MP3s sit in
`public/audio/sfx/`:

- `chocolate-snap.mp3` — fires on every chocolate tap in `NamingMaterial`
  (L1–L3) and `EquivalenceMaterial` (L4), and on every hammer-break in L4.
- `paper-fold.mp3` — fires on every accepted fold in `PaperFold` (L5),
  via a `prevFoldsRef` effect so a hydrated restore doesn't replay past
  folds.

`sfxPlayer.ts` is a factory + lazy singleton (`getSfxPlayer()`). Each
`play(key)` constructs a fresh `Audio` element so rapid retriggers
overlap (two taps in quick succession sound like two snaps, not one
truncating the other). Mute is *inherited* from the voice player —
`isMuted: () => getVoicePlayer().isMuted()` — so the lesson's existing
sound toggle silences voice + SFX together. Volume defaults to 0.3 to
sit beneath Ari's narration. Autoplay rejections are swallowed.

Both clips are generated via `npm run bake:sfx`
([scripts/bake-sfx.mts](scripts/bake-sfx.mts)) hitting the ElevenLabs
sound-generation endpoint. The script skips existing files — to swap a
sound, delete the mp3, edit its prompt in the script, re-run.

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

## Lesson state machine (`LessonPage` + `useLessonStateMachine`)

```ts
activeIdx:   number;                                  // which beat is in focus
doneSet:     ReadonlySet<BeatId>;                     // which beats have been completed
manipStates: Partial<Record<BeatId, ManipulativeState>>;
unlockedBanners: ReadonlySet<BeatId>;                 // "▸ cell 02 unlocked" cues (session-only)
```

There are no MC / hint / scaffold slots in the state — the lesson is
material-only. The only event the machine handles is `handleManip(idx,
state)`:

1. Update `manipStates[beat.id]`.
2. Ask `isBeatComplete(beat, state)`.
3. If complete and not already done, mark done and `advanceTo(idx + 1)`.

**On advance:** flip `activeIdx`, add the next beat to `unlockedBanners`,
speak the next beat's prose, scroll the new cell into view 250ms after
the flip. All synchronous — no fetch, no race.

**The three manipulatives in the slot:**

- `kind: 'naming'` → `<NamingMaterial>` — chocolate tap regions.
  Publishes `{ kind:'naming', streak: number }` on every accepted tap;
  wrong taps don't publish.
- `kind: 'equivalence'` → `<EquivalenceMaterial>` — half-frame + slots +
  chocolate pile. Publishes `{ kind:'equivalence', placedCount: number }`
  bounded by `targetCount`. Extra taps after coverage are no-ops.
- `kind: 'paper'` → `<PaperFold>` — drag corner to fold. Publishes
  `{ kind:'paper', folds: readonly ('horizontal'|'vertical')[] }` on each
  successful fold; capped at two folds.

Each component holds its own UI state (lift animation, prompt-cycling,
fold pointer math, `@dnd-kit/core` drag in `EquivalenceMaterial`'s
hammer) but the only fact it pushes upward is the manipulative-kind
state. The state machine doesn't know or care how the fact was produced.

**Persistence (`SCHEMA_VERSION = 7`).** The manipulative states above all
serialize to plain JSON. `isManipulativeState` validates kind + field
shape before rehydration; older or malformed snapshots are silently
rejected and the lesson restarts. Bumps so far: 1 (initial), 1 → 2
(BlockStudio added, since removed), 2 → 5 (naming + equivalence + paper
added; chat / MC / hint / scaffold fields stripped from the snapshot
shape when those surfaces were retired), 5 → 6 (post-removal refactor of
the snapshot shape), 6 → 7 (`whole` + `recall` manipulative kinds added).

**Resume repair (`correctedLessonState`).** A correct manipulative
completion marks the beat done synchronously but defers `advanceTo` to a
microtask. The persistence rAF can run in between — so a refresh inside
that window writes a snapshot whose `activeIdx` still points at a beat
already in `doneIds`. On hydration `/lesson/page.tsx` runs
`correctedLessonState(decoded, lesson.beats)`, walking `activeIdx`
forward past any contiguous run of done beats (clamped at
`beats.length - 1`).

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

- **Scripted, not generated.** Every line the tutor speaks lives in
  `lessonData.ts`; the only "decision" is the pure `isBeatComplete`
  predicate. Removes the whole class of LLM failure modes (latency,
  hallucination, racing responses) and lets the lesson run end-to-end
  with only ElevenLabs in the network path.
- **One material across naming → equivalence.** Beats 1–4 all use the
  same chocolate art (`public/images/chocolate.png` via `ChocolatePiece`).
  Same visual schema, same tap interaction. Cognitive coherence — the
  kid doesn't burn working memory parsing a new material per beat.
- **Paper-fold is a *transfer* check, not a parallel material.** Beat 5
  swaps to paper because the proof has already been made on chocolate;
  recognizing the equivalence in a new representation is what makes it
  durable. One material per *concept*, not per beat.
- **Material-as-feedback.** No celebration bubbles, no hint bubbles, no
  scaffolded MC variants. Wrong taps are silent rejections from the
  logic helpers; right taps animate the material. Adult-voice "look
  again" copy was deleted with `HintBubble` / `CelebrationBubble`.
- **Tests for logic, not pixels.** Every pure helper has unit tests
  (`namingLogic`, `coverLogic`, `paperLogic`, `completes`). Material
  components have behavior tests (tap → streak, tap → placedCount, fold
  → folds array) but not visual-snapshot tests.
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

**TopBar.** Back-to-home link + "fractions" lesson tag on the left, mute
toggle on the right. No progress segments — the lesson is mastery-paced,
not progress-bar-paced.

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
- `npm run bake:voice` — regenerate `public/audio/voice/*.mp3` + `manifest.json`
  from the scripted lesson lines. Skip-if-exists: only re-fetches lines
  whose text changed. Reads `ELEVENLABS_API_KEY` from `.env`.
- `npm run bake:sfx` — regenerate `public/audio/sfx/*.mp3` (chocolate
  snap, paper fold) via the ElevenLabs sound-generation API. Skip-if-exists
  per file — delete an mp3 to re-bake it with the prompt currently in the
  script.
