# Synthesis — naming-first fractions

A one-week prototype of a Synthesis-style math tutor. One self-contained
**naming-first** fractions lesson on halves and quarters, built for a 6–8
year old on an iPad, plus a "How It Works" one-pager that walks adult
viewers through the Montessori principles behind the design.

- **Live route:** `/lesson` — the lesson itself.
- **Companion route:** `/` — full-bleed scrollytelling on the Montessori
  principles, with small interactive demos.

<img width="900" height="910" alt="Screenshot 2026-05-19 at 4 31 16 PM" src="https://github.com/user-attachments/assets/b5adbdc7-55af-4783-b4c9-e4a8affa124d" />

## What it is

- **Fully scripted, no LLM.** Per the 1-week brief, every tutor line is
  authored in [`src/lib/lesson/lessonData.ts`](src/lib/lesson/lessonData.ts).
  There is no LLM agent, no chat rail, no MC / hint / scaffold paths.
- **Seven beats, three Montessori periods.** Whole → name half → name
  quarter → mix → recall → equivalence (build the whole, hammer-break
  it) → paper-fold transfer check.
- **One material across naming → equivalence.** Beats 0–5 use the same
  chocolate-bar visual (`ChocolatePiece` + a `seamless` mode). Beat 6
  swaps to a square of paper for the transfer check.
- **Material-as-feedback.** No celebration bubbles, no hint bubbles, no
  praise. Wrong taps are silent rejections from pure-logic helpers; right
  taps animate the material. Adult-voice copy is gone (control of error).
- **Voice (ElevenLabs).** TTS narrates the beat prose on entry and
  emits a small set of observational lines (`useSpokenFeedback`) for
  milestones — naming feedback, the whole-split observation, "four
  quarters fill the whole". A FIFO queue + mute toggle ride on a singleton
  voice player. Mute silences voice + SFX together.
- **Pre-baked audio.** Every Ari line is generated once into
  `public/audio/voice/<sha>.mp3` plus a manifest; `/api/tts` is the
  un-baked-line fallback. Run `npm run bake:voice` after editing prose.
- **Material SFX.** Short ElevenLabs sound-effects clips for chocolate
  snap, paper fold, whole-split, hammer-break — baked offline via
  `npm run bake:sfx`.
- **Persistence.** Progress saves to `localStorage` on every state
  change (synchronous + `beforeunload` backstop). `SCHEMA_VERSION = 7`;
  older snapshots are silently dropped on load.
- **iPad-first responsive.** Built and tested against iPad mini through
  iPad Pro 12.9", portrait and landscape. The lesson is a single
  full-width notebook column.

## Running it

```bash
npm install
npm run dev
```

Open <http://localhost:3000> for the home page, or
<http://localhost:3000/lesson> for the lesson directly.

`npm run build` + `npm start` runs the production build; deployment
target is any standard Next.js host (Vercel, Cloudflare Pages, Render).

### Environment

| Var | Required? | What for |
| --- | --------- | -------- |
| `ELEVENLABS_API_KEY` | optional at runtime, required to (re)bake voice / SFX | Server-side TTS at `/api/tts` (fallback for un-baked lines only). Read by `npm run bake:voice` and `npm run bake:sfx` to generate static audio under `public/audio/`. Without it the lesson plays silent for any line not already in the baked manifest — the prose still renders on screen. |
| `NEXT_PUBLIC_POSTHOG_KEY` | optional | Enables a single `lesson_feedback` capture from the Outro. No-op when unset. `NEXT_PUBLIC_POSTHOG_HOST` overrides the endpoint (defaults to PostHog US cloud). |

The lesson runs **fully offline** if TTS isn't configured — the kid
reads the cells, works the manipulatives, and the lesson advances. Audio
is decoration, not gating.

## Technical approach

- **Next.js 16 (App Router), React 19.2, TypeScript strict.**
- **Tailwind v4** for the cosmos palette; bespoke CSS classes for cell /
  manipulative / scene surfaces in [`globals.css`](src/app/globals.css).
- **Deterministic state in React.** `LessonPage` holds `activeIdx`,
  `doneSet`, `manipStates`, `unlockedBanners`; the only event is
  `handleManip(idx, state)` which runs `isBeatComplete` and advances on
  truth. Persisted via [`lessonPersistence.ts`](src/lib/lesson/lessonPersistence.ts).
  No XState, no Redux.
- **Pure-logic modules per material.** [`wholeLogic`](src/lib/lesson/), [`namingLogic`](src/lib/lesson/namingLogic.ts),
  [`coverLogic`](src/lib/lesson/coverLogic.ts), [`paperLogic`](src/lib/lesson/paperLogic.ts),
  recall — each synchronous, no fetch, no React imports, unit-tested in
  isolation. The components only render; the logic decides.
- **Voice subsystem.** `voicePlayer` is a singleton FIFO queue around
  one `<audio>` element; `ttsClient` is a per-text Blob cache that first
  consults the baked manifest before falling back to `/api/tts`. Mute is
  a hard floor and is persisted under `synthesis:voice:muted`.
- **Vitest 4 + Testing Library 16 + jsdom 29.** Pure helpers,
  persistence, the voice contract, and the new spoken-feedback hook are
  all unit-tested. Visual / animation components skip tests per the
  project policy.

See [`summary.md`](summary.md) for the full architecture write-up and
[`montessori-plan.md`](montessori-plan.md) for the pedagogy rationale
(cognitive coherence, control of error, three-period lesson).

## Project structure

Condensed map — [`summary.md`](summary.md) has the full version with
rationale.

```
src/
  app/
    page.tsx                — home (HowItWorksPage)
    lesson/page.tsx         — lesson route + NamePrompt gate
    api/tts/route.ts        — ElevenLabs TTS proxy (fallback only)
  components/
    lesson/                 — LessonPage, LessonBeatCell, ManipulativeSlot,
                              WholeMaterial, NamingMaterial,
                              EquivalenceMaterial, NamePrompt,
                              Cell, Prose, TopBar, Outro, ResumePrompt
    manipulatives/          — ChocolatePiece, PaperFold (+ paper/ helpers)
    onepager/               — HowItWorksPage, Hero, HeroPreview,
                              PrincipleRow, SideRail, AmbientAudio,
                              AmbientGlow, Unveil, FinalCTA, demos/
    space/                  — Stars, GridBg, Doodles (+ doodle icons)
  lib/
    lesson/
      lessonData.ts         — the seven scripted beats
      types.ts              — Beat, ManipulativeConfig, ManipulativeState
      completes.ts          — isBeatComplete (pure predicate)
      namingLogic.ts        — L1–L3 tap-to-name logic
      coverLogic.ts         — L5 fill-the-whole logic
      paperLogic.ts         — L6 paper-fold logic
      lessonPersistence.ts  — localStorage shape + corrected-state repair
      useLessonStateMachine.ts — handleManip + advanceTo
      useLessonVoice.ts     — speakAri + mute
      useSpokenFeedback.ts  — milestone observational lines
    voice/
      voicePlayer.ts        — FIFO queue + mute
      ttsClient.ts          — manifest → static MP3, else /api/tts
      elevenLabsClient.ts   — server-side ElevenLabs wrapper
      playSample.ts         — one-shot sound-check on NamePrompt
    audio/
      ambientPlayer.ts      — home-page looping pad
      sfxPlayer.ts          — material SFX (snap, fold, split, break)
    analytics/
      posthog.ts            — lesson_feedback capture (no-op without key)
scripts/
  bake-voice.mts            — pre-generate per-line MP3s + manifest
  bake-sfx.mts              — pre-generate material SFX MP3s
```

## Scripts

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Next dev server (Turbopack). |
| `npm run build` | Production build. |
| `npm start` | Run the production build locally. |
| `npm run lint` / `npm run lint:fix` | ESLint (check / auto-fix). |
| `npm test` | Vitest watch. |
| `npm run test:run` | Vitest one-shot (for CI / pre-commit). |
| `npm run bake:voice` | Re-bake per-line MP3s + `manifest.json` from the scripted prose. Skip-if-exists. Reads `ELEVENLABS_API_KEY` from `.env`. |
| `npm run bake:sfx` | Re-bake material SFX MP3s (chocolate snap, paper fold, whole split, hammer break). Skip-if-exists. |
