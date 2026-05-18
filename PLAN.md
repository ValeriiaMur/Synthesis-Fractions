# PLAN — Synthesis Tutor Clone (1-Week Sprint)

Living roadmap. Future agents should read this to understand the full intended scope
and where the current build sits within it. Update phase status as we go;
do not turn this into a changelog (use git for that).

Authoritative pedagogy + product context: [synthesis_tutor_presearch.md](synthesis_tutor_presearch.md).
Architecture-as-built: [summary.md](summary.md). Project rules: [CLAUDE.md](CLAUDE.md).

## North Star

A scrollytelling lesson on **fraction equivalence (1/2 = 2/4)** that feels like
a Jupyter notebook crossed with a calm picture-book. Five beats, three different
Montessori-style manipulatives in order:

1. `chocolate_intro` — break a 4-piece chocolate bar; observe 2 quarters cover 1 half.
2. `chocolate_check` — MC: "How many quarter-pieces make one half?"
3. `pizza_explore` — drag a knife; see slices and toppings re-anchor equivalence.
4. `pizza_check` — MC: "Is 2/4 the same amount of pizza as 1/2?"
5. `paper_fold_final` — fold a square in half, then fold again; overlay proves 1/2 = 2/4. Final MC.

Optional reflection beats are non-blocking.

The eight pedagogical principles (concrete-before-abstract, control-of-error,
three-period lesson, description-not-praise, prepared-environment,
redirect-not-reprimand, self-paced-reveal, aesthetic-minimalism) are the
design north star. Cut anything that contradicts them.

## Phase Sequencing (MVP-first)

### Phase 1 — Playable lesson, no LLM, no TTS (days 1–3)

Goal: a fully completable lesson on the iPad in Safari, end-to-end, with
deterministic MC + manipulative checks only. This is the demo-safety floor;
if Anthropic or ElevenLabs is down on demo day, this still ships.

- TypeScript types for `Beat`, `ManipulativeConfig`, `MCConfig`, `LessonState`.
- `lesson.json` with all 5 beats authored (prose + manipulative config + MC keys + canonical hints).
- Three manipulatives, each in its own component file, each with built-in control-of-error:
  - `ChocolateBar` — 4 quarter-pieces snap on a half-bar reference; dnd-kit for touch.
  - `PizzaSlicer` — radial knife rotates to set slice count; deterministic angular bounds.
  - `PaperFold` — square folds along axes; crease overlay shows 1/2 ≡ 2/4 alignment.
- `MCBubble` — accessible radio-group-style bubble selection; verdict from deterministic key.
- `LessonBeat` shell — prose + manipulative slot + MC slot; reveals via IntersectionObserver.
- `LessonPage` (route) — vertical scroll-snap, beats in order, persists state to `localStorage`.
- Canonical authored hint text shown on wrong MC (no Haiku yet).
- Vitest coverage for: deterministic validators, manipulative end-state detection, MC selection,
  scroll-reveal gating.

### Phase 2 — Haiku 4.5 narrator (days 4–5)

Goal: replace canonical hint/paraphrase text with Haiku output; keep canonical text as fallback.

**Slice 1 (LIVE) — `generate_hint`:**
- `src/app/api/agent/hint/route.ts` — POST endpoint, validates body, runs the LangGraph.
- `src/lib/agent/generateHint.ts` — one-node `StateGraph` calling `ChatAnthropic` (Haiku 4.5).
  SystemMessage encodes Montessori discipline; node defense-in-depth filters praise-bombing output.
- `src/lib/agent/hintClient.ts` — client fetch wrapper, 1.2s timeout, null-on-fail.
- `MCBubble` renders the canonical authored hint immediately (demo-safety floor),
  then upgrades to the Haiku hint when `fetchHint` resolves. A `useRef` request id
  guards against stale-overwrite when answering wrong twice in quick succession.
- LangSmith tracing automatic via env vars (`LANGSMITH_TRACING=true`).
- Anthropic ZDR confirmed before any session with a real child.

**Slice 2 (LIVE) — unified lessonAgent with paraphrase + reflection:**
- `src/lib/agent/lessonAgent.ts` — one `StateGraph` with conditional edges from
  `START` routing on `state.input.task` into one of three nodes:
  `hint | paraphrase | classify_reflection`. All three share the Montessori
  discipline floor (no praise-bombing); each defense-in-depth filters its own
  output.
- `generateHint.ts` is now a thin back-compat wrapper around
  `runLessonAgent({task:'hint'})`.
- `/api/agent/paraphrase` + `paraphraseClient.ts` — `LessonBeat` calls
  `fetchParaphrase` on becoming active; the displayed prose upgrades from
  canonical to paraphrased when the response arrives.
- `/api/agent/classify-reflection` + `classifyReflectionClient.ts` — plumbed,
  ready for reflection-beat UI when the lesson data adds them. Returns
  `{category, reaction}`; reaction is praise-filtered.

**Slice 3 (TODO) — multi-beat orchestration + escalation:**
- A bigger LessonState-keyed graph: nodes for each beat or per-stage; conditional
  edges encode "advance / re-hint / escalate to guided beat" based on MC
  result + manipulative state + attempt count (presearch §10 "three consecutive
  wrong" rule).
- Surface `validate_manipulative`, `read_manipulative_state`, `advance_to_beat`
  as tools the agent can call.
- Persist `LessonState` snapshots to `localStorage` for resume-on-reload.
- System prompt + few-shot examples committed under `src/lib/agent/prompts/`.

### Phase 3 — TTS + eval + polish (days 6–7)

- ElevenLabs TTS server-side; pre-generate the next beat's audio one beat ahead.
  Fall back to text-on-page silently on outage.
- LangSmith traces + dataset eval:
  - `classify_reflection` accuracy on ~60 labeled examples (gate: ≥85%).
  - `generate_hint` Montessori hint-tone rubric via LLM-as-judge (gate: ≥4.0/5).
  - High-stakes regression: MC-wrong-then-praise-bomb must never happen.
- GitHub Actions runs unit + eval on every PR; blocks merge on regression.
- Polish: typography, scroll-snap easing, manipulative spring physics, audio crossfade.
- 1–2 min demo video recorded against a pinned `v1.0` tag for one-click rollback.

## Out of Scope (1-week sprint)

- Multi-user / accounts / PII storage.
- Open-source release / licensing.
- Adversarial testing.
- Real-time monitoring / paging.
- Curriculum expansion beyond fraction equivalence
  (the architecture should *accommodate* extension, not implement it).

## Decision Log (load-bearing choices)

- **Frontend**: React + Next.js 16 App Router + Tailwind v4 (already scaffolded).
- **Touch / drag**: `@dnd-kit/core` — best iPad pointer-event support.
- **Animations**: `framer-motion` — spring physics for snap/cut/fold tactile feel.
  Rejected: react-konva/PixiJS (canvas overhead not justified for ~10 draggables);
  HTML5 native DnD (broken on iOS Safari touch); Yjs (no collaboration).
- **Agent runtime**: LangGraph (JS) inside Next.js API routes. State persisted client-side.
  Rejected: separate Python service (two deploys, no win at prototype scale).
- **Model**: Claude Haiku 4.5 — fast, cheap, function-calling reliable, tone-steerable.
- **TTS**: ElevenLabs (TTS only, no Conversational AI / no STT).
- **Eval**: LangSmith — native LangGraph integration, zero-config traces.
- **Testing**: Vitest + RTL + jsdom; TDD red→green per CLAUDE.md.

## Working Agreements

- Author the lesson script iteratively (per user: "iteratively"). Phase 1 ships
  with a first-cut script; refine beat-by-beat as prose/MC/hint copy is reviewed.
- API keys (Anthropic, ElevenLabs, LangSmith) arrive partway through the sprint;
  Phase 1 must be fully playable without any of them.
- Every meaningful change ends with `npm run test:run` + `npm run lint:fix` green
  (per [CLAUDE.md](CLAUDE.md)).
