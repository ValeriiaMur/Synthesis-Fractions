# Montessori Fractions — Curriculum Plan

Status: DRAFT for sign-off. No code changes until val approves.

---

## What the cognitive-load article tells us, applied here

The Hinten et al. 2025 meta-analysis (1,400+ children, ages 1.5–6, extending to 4–8) found that **fantastical content — not pace — is what damages young children's executive function**. A talking pencil costs more cognition than a fast-paced video of a real hand writing letters. The child's brain spends working-memory cycles processing "wait, pencils don't talk" instead of processing the letter.

This is the precise indictment of the current lesson. The Cosmos / Spirit / Ari / warp-drive narrative isn't decoration — it's extraneous cognitive load. Every time the kid hears "moon-pizza," their brain has to ask "what's a moon-pizza?" That's bandwidth stolen from the math.

The article's other relevant findings:

- **Aesthetic Paradox.** Kids report enjoying decorative aesthetics more, but learn LESS from them. Visual elements must clarify, not entertain.
- **L = M × G(C) × T.** Cognitive load follows an inverted U; motivation multiplies the effect. High motivation on bad design still produces bad learning.
- **For ages 4–8, competence beats badges.** The feeling of "I did it" is the most powerful intrinsic motivator. Mastery Learning over rewards.
- **Off-ramp matters.** Real-world transfer is the success metric, not in-app metrics.

Everything below is built around these findings + the five commitments val signed off on:

1. Naming first, equivalence later.
2. One material per concept.
3. Voice is quiet by default.
4. Auto-correction in the material; no verbal hints.
5. Strip the narrative; keep the cosmos visual identity.

---

## Design principles (the rules every lesson follows)

**Cognitive coherence.** The material is a realistic object the kid recognizes. No invented sci-fi props. No "Spirit's ration tray" — just a chocolate bar.

**Subtract, don't add.** Every visual either clarifies the math or is removed. No decorative animations, no celebration sparkles, no character art.

**Mastery, not progress.** No "3 of 6" UI. The kid moves on when they demonstrate competence — when the material accepts the action. No segmented progress bar.

**Quiet voice.** Voice says one short line on lesson entry, then silence. Re-enters only if the kid stalls 30+ seconds, or asks. No co-pilot chatter, no praise, no celebration lines.

**Auto-correction in the material.** Wrong placement: piece visually rejects (snaps back, shakes briefly, doesn't lock). Right placement: piece snaps cleanly. No verbal "look again" — the material IS the feedback.

**Real-world off-ramp.** Each lesson ends with one prompt that sends the kid back to physical reality: "find something at home you can split in half. Show your grown-up."

**Kid chooses.** Lesson picker instead of forced linear path. The kid decides what to work on.

---

## Material choice — recommendation: chocolate bar

Two viable options:

- **Chocolate bar** (rectangular grid, already implemented in `ChocolateBar.tsx`). Pros: high cognitive coherence (kid sees one weekly), simple rectangular snap geometry, code reuse, easy mastery checks. Cons: not the canonical Montessori shape.
- **Fraction circles** (canonical Montessori material — circle divided into halves, thirds, quarters). Pros: canonical, rotational symmetry teaches "equal parts" purely. Cons: kid has never seen a fraction circle inset in real life — they're a classroom object, lower cognitive coherence outside Montessori classrooms.

**Recommendation: chocolate bar.** The cognitive coherence argument wins for a screen app that the kid uses at home. Chocolate is in their kitchen. A fraction circle inset is not. The article's whole point is real-world schema alignment.

Open to flipping to fraction circles if you'd rather lean canonical.

---

## Curriculum — four short lessons

Each lesson is one concept. Target 3–5 minutes for a first pass, but timeless — kid can repeat.

### Lesson 1 — "What is one half?"

**Material on screen:** one chocolate bar, divided down the middle by a faint line. Two equal halves.

**Voice (once, on entry):** "Tap one half."

**Mechanic:** kid taps the bar. If they tap a half, that half lifts slightly + a soft chime. The other half stays dim. Voice (once, after first correct tap): "This is one half."

**Mastery check (Montessori three-period, period 3):** mat clears, two unlabeled halves appear. Voice asks "tap one half" — kid taps. Repeat 2-3 times. No score visible.

**Off-ramp:** small text card appears after mastery: "find something at home you can split in half. Show your grown-up."

### Lesson 2 — "What is one quarter?"

**Material on screen:** chocolate bar already divided into four equal pieces (each piece is one quarter).

**Voice (once, on entry):** "Tap one quarter."

**Mechanic:** kid taps a piece. Quarter lifts + soft chime. Voice (once, after first correct tap): "This is one quarter."

**Mastery check:** 2–3 unlabeled tap rounds, "tap one quarter."

**Off-ramp:** "show your grown-up what one quarter looks like."

### Lesson 3 — "Halves and quarters together"

**Material on screen:** mat with two pieces: one half-piece and one quarter-piece, side by side. Same chocolate bar source.

**Voice (once, on entry):** "Tap the half."

**Mechanic:** kid taps the half-piece — chime. Voice: "Tap the quarter." Kid taps the quarter — chime. Mixed sequence, 4–5 prompts in random order. Wrong tap: piece doesn't react, no error sound (silent auto-correction).

**Mastery check:** 4 correct in a row, mixed order.

**Off-ramp:** "tell your grown-up the difference between one half and one quarter."

### Lesson 4 — "One half is the same as two quarters"

The equivalence lesson — only after the names are fluent.

**Material on screen:** mat with one half-piece on the left, and a pile of four quarter-pieces on the right.

**Voice (once, on entry):** "Place quarters on the half until it fits exactly."

**Mechanic:** kid drags quarters onto the half. First quarter snaps onto the left half of the half-piece. Second quarter snaps onto the right half. When two quarters cover the half exactly, the half-piece briefly glows (the material confirming the equivalence visually — no text, no "great job"). Extra quarters cannot be placed (auto-correction — they snap back to the pile).

**No MC. No celebration text. The placement IS the proof.**

**Voice (once, after equivalence shown):** "One half is the same as two quarters."

**Off-ramp:** "cut a piece of paper in half. Then cut one half in half. How many quarters fit into the half?"

---

## Implementation tasks (sequenced, each a small PR)

The plan is to rebuild from the user-facing in, keeping the cosmos visual identity (Stars, GridBg, Doodles, palette) and the technical scaffolding (voice player, persistence, state machine), but replacing what the kid sees and hears.

**T1 — Strip the narrative from `lessonData.ts`.**
Replace the six narrative beats with four new beats (Lesson 1–4 above). Each beat gets a single sentence of prose, no character names, no story. No `enterLine` (the voice goes quiet between beats).

**T2 — Strip "Ari" from voice + UI.**
Voice becomes anonymous "instructor." Remove "Ari:" labels from `CelebrationBubble.tsx` (and delete the bubble entirely — see T5). Update `useLessonVoice.ts` and `useLessonStateMachine.ts` so voice is only called on lesson-entry, mastery completion, and stall (no per-step chatter).

**T3 — Rewrite `Intro.tsx`.**
Drop "the Spirit run / same amount, different pieces" headline. Drop the studentName interpolation in the body. Keep it to one neutral line: "fractions" or even nothing — let Lesson 1's first prompt do the work.

**T4 — Replace MCBlock with TapOneMastery component.**
New component: shows the mat with N pieces, prompts the kid to "tap [the half / a quarter / etc.]," tracks N-in-a-row correct, advances on mastery. No multiple-choice. No hint bubble.

**T5 — Delete `CelebrationBubble.tsx` + `HintBubble.tsx`.**
Both are anti-Montessori (external praise + adult-voice correction). Pure deletion + remove imports from `LessonBeatCell.tsx`.

**T6 — Build auto-correction into materials.**
For the chocolate bar: wrong placement → piece eases back to its origin with a 200ms transition, no sound. Right placement → piece snaps with a quiet chime. Same pattern for the equivalence lesson's quarter-onto-half drag.

**T7 — Strip the progress segments from `TopBar.tsx`.**
Remove `ProgressSegmentStatus`, the `progress` prop, and the `.progress` markup. Update `LessonPage.tsx` to stop computing/passing it.

**T8 — Remove the timer/grade tag from `Intro.tsx`.**
Already done in the iOS-fix PR. Keep it removed.

**T9 — Build the off-ramp card.**
Tiny component shown after each lesson's mastery is reached. One sentence + a "done" button that returns to the lesson picker.

**T10 — Build the lesson picker.**
Simple grid of four cards: Half / Quarter / Together / Equivalent. Each card is the entry point. Replaces the linear `LessonRoute` flow. Persistence remembers which lessons have been completed at least once, but doesn't gate access — the kid can re-do any lesson freely.

**T11 — iPad ergonomics pass.**
Touch targets ≥ 64px (preferably 72px). Drag tolerance generous. Snap zones large. Voice-mute toggle remains. Test on a real iPad with a real seven-year-old before declaring done.

**T12 — Persistence schema bump.**
The new beats have new ids; existing saved snapshots are incompatible. Bump `SCHEMA_VERSION`. Old snapshots return null on decode (kid starts fresh, which is correct — the lesson has changed).

**T13 — Test pass.**
Existing tests for the old branching / lessonData / persistence will fail or be irrelevant. Delete what's gone, write fresh tests for the new TapOneMastery component and the auto-correction logic. TDD per `CLAUDE.md`.

**T14 — Update `summary.md`.**
Rewrite the lesson section to describe the new four-lesson naming-first curriculum and the design principles. Remove references to "the Spirit run" and the cosmos delivery framing.

---

## Decisions to confirm before T1

1. **Material:** Chocolate bar (recommended) or fraction circles? — affects everything visual.
2. **Lesson count:** Four (above) or fewer/more? Could split Lesson 3 into "Halves" + "Quarters" naming and "Symbols ½ ¼" as separate.
3. **Symbol introduction:** Lesson 4 is equivalence, no written symbols. Should we add a Lesson 3.5 that introduces "½" and "¼" written notation? (Standard Montessori does this between naming and equivalence.)
4. **Scope:** Replace the existing six-beat lesson entirely (recommended — simpler maintenance), or keep it as a hidden "Adventure mode" and add the new curriculum as the default?
5. **Target age:** 6–8 (early elementary, my default), or different?
6. **Voice provider:** Same ElevenLabs setup, just with new (much shorter) prompts? Or do we want a different voice now that "Ari" is gone?

---

## What stays from the existing codebase

- Cosmos visual identity: `cosmos-bg` gradient, Stars, GridBg, Doodles. Pure decoration, no fantasy, cognitively neutral.
- Voice player: `voicePlayer.ts`, ElevenLabs route, mute toggle. Just used much less.
- Persistence machinery: `lessonPersistence.ts`, `useLessonPersistence`. Schema bumps but logic stays.
- The chocolate bar component (`ChocolateBar.tsx`) is the foundation of T6 — repurposed but kept.
- iOS fixes from earlier today (viewport, touch-action) — independent, stay.
- TypeScript-strict + TDD + ESLint config — `CLAUDE.md` rules unchanged.

## What goes

- All four narrative metaphors except chocolate (pizza, paper-fold, block studio components → deleted).
- Ari (character + voice persona, branding).
- Spirit run / moon outpost / delivery framing (lessonData, branching transition lines, Intro).
- CelebrationBubble, HintBubble.
- Progress segments, timer tag, mission tag.
- MCBlock (replaced by TapOneMastery).
- Branching scaffold ladder + per-wrong-option hints (no longer needed once auto-correction is the feedback).
