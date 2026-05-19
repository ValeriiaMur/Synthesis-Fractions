# Synthesis — Spirit Run

A one-week prototype of a Synthesis-style math tutor. One self-contained
lesson on **fraction equivalence (½ = ²⁄₄)**, framed as a six-stop
cosmos delivery (the "Spirit run") for a 7–10 year old on an iPad.

- **Live route:** `/lesson` — the lesson itself.
- **Companion route:** `/` — "How It Works", an adult-facing one-pager
  on the eight Montessori principles behind the lesson.

<img width="900" height="910" alt="Screenshot 2026-05-19 at 4 31 16 PM" src="https://github.com/user-attachments/assets/b5adbdc7-55af-4783-b4c9-e4a8affa124d" />

## What it is

- **Chat-style tutor, scripted.** Each cell in the vertical notebook is
  one turn of a conversation: Ari speaks (`<Prose>`), the student
  responds (manipulative or MC), the response is echoed back
  (`<StudentEcho>`), Ari reacts (`<HintBubble>` or `<CelebrationBubble>`),
  and the next cell unlocks. Every tutor line is **authored** in
  [`src/lib/lesson/lessonData.ts`](src/lib/lesson/lessonData.ts) — no
  LLM is in the active path. Branching (which hint to play, when to
  scaffold, where to advance) is a pure unit-tested module
  [`src/lib/lesson/branching.ts`](src/lib/lesson/branching.ts).
- **Interactive manipulatives.** Four hand-built fraction tools — a
  chocolate-bar ration tray, a moon-pizza slicer, a star-paper folder,
  and a multi-rail Block Studio — each lets the kid combine, split,
  or rearrange fraction pieces to *see* equivalence before naming it.
- **Voice.** ElevenLabs TTS narrates every authored line so Ari sounds
  warm without being stochastic. Mute toggle in the top bar; defaults
  to on after a one-click sound-check on the name modal.
- **Persistence.** Progress is saved to `localStorage` on every state
  change (synchronous writes + a `beforeunload` backstop). Returning
  later lands the kid on their last cell.
- **iPad-first responsive.** Built and tested against iPad mini through
  iPad Pro 12.9", portrait and landscape. Home page is full-bleed
  scrollytelling; the lesson is a single full-width notebook column.

## Running it

```bash
npm install
npm run dev
```

Open <http://localhost:3000> for the home page, or
<http://localhost:3000/lesson> for the lesson directly.

The build also runs against `npm run build` + `npm start` for a
production check; deployment target is any standard Next.js host
(Vercel, Cloudflare Pages, Render, etc.).

### Environment

| Var | Required? | What for |
| --- | --------- | -------- |
| `ELEVENLABS_API_KEY` | optional | Server-side TTS at `/api/tts`. Without it the lesson plays silent — every tutor line is still rendered on screen. |
| `ANTHROPIC_API_KEY` | not used | Only relevant if the dormant LLM agent under `src/lib/agent/` is reactivated; the active lesson never calls it. |

The lesson runs **fully offline** if TTS isn't configured — the kid
reads the cells, works the manipulatives, and the lesson advances on
correct MCs. Audio is decoration, not gating.

## Technical approach

- **Next.js 16 (App Router), React 19.2, TypeScript strict.**
- **Tailwind v4** for the cosmos palette; bespoke CSS classes for cell /
  manipulative surfaces in [`globals.css`](src/app/globals.css).
- **Deterministic state machine in React.** `LessonPage` holds
  `activeIdx`, `doneSet`, `mcSel`, `mcStatus`, `hintAttempts`,
  `manipStates`, `liveHints`, `scaffoldedMC`, `unlockedBanners`.
  Persisted via `lessonPersistence.ts`. No XState, no Redux.
- **Pure-function branching layer.** Every "what does Ari say next?"
  decision goes through `reactToMC` / `enterLineFor` in
  `branching.ts`. Tested in isolation in `branching.test.ts` (17 cases,
  no mocks).
- **Voice subsystem.** `voicePlayer` is a singleton FIFO queue around
  one `<Audio>` element; `ttsClient` is a per-text Blob cache around
  `/api/tts`. Page-bound: ambient on `/`, Ari on `/lesson` — each
  cleans up on unmount via `pause()` and `stop()` (the latter aborts the
  in-flight utterance via `AbortSignal`).
- **Vitest 4 + Testing Library 16 + jsdom 29.** Pure helpers, agent
  nodes (dormant), persistence, manipulative state machines, and the
  view-driven voice contract are all unit-tested. Visual / animation
  components skip tests per the project policy.
- **No LLM in the active path.** Per the 1-week brief, the tutor is
  fully scripted. The earlier LangGraph + LLM agent files (under
  `src/lib/agent/` and `src/app/api/agent/`) remain on disk as dead
  code for forensic value; nothing in `/lesson` imports them. See
  [`summary.md`](summary.md) for the full architecture write-up.

## Project structure

A condensed map — the architecture document
[`summary.md`](summary.md) has the full version with rationale.

```
src/
  app/
    page.tsx                — home (HowItWorksPage)
    lesson/page.tsx         — lesson route + Name + Resume gates
    api/tts/route.ts        — ElevenLabs TTS proxy
  components/
    lesson/                 — LessonPage, Cell, Prose, MCBlock,
                              HintBubble, CelebrationBubble,
                              StudentEcho, TopBar, Intro, Outro,
                              NamePrompt, ResumePrompt
    manipulatives/          — ChocolateBar, PizzaSlicer, PaperFold,
                              BlockStudio, FractionBox (dormant)
    onepager/               — Hero, PrincipleRow, AmbientAudio,
                              ScrollDownInvite, ScrollTopButton,
                              and the demos
    space/                  — Stars, GridBg, Doodles
  lib/
    lesson/
      lessonData.ts         — the script: prose, MC, hints, scaffolds,
                              enter lines, correct replies
      branching.ts          — reactToMC / interpolate / enterLineFor
      types.ts              — Beat, MCConfig, ScaffoldedMC, ...
      lessonPersistence.ts  — localStorage shape + decode/encode
      completes.ts          — isBeatComplete / lookupHint
      stripMarkup.ts        — strip {y}…{/y} highlight tokens for TTS
    voice/
      voicePlayer.ts        — FIFO queue + AbortSignal interrupt
      ttsClient.ts          — fetch + per-text Blob cache
      elevenLabsClient.ts   — server-side ElevenLabs wrapper
      playSample.ts         — one-shot sound-check used by NamePrompt
    audio/
      ambientPlayer.ts      — home-page looping pad with pause/resume
```

## Scripts

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Next dev server (Turbopack). |
| `npm run build` | Production build. |
| `npm start` | Run the production build locally. |
| `npm run lint` / `npm run lint:fix` | ESLint (check / auto-fix). |
| `npm test` | Vitest watch. |
| `npm run test:run` | Vitest one-shot (CI / pre-commit). |
