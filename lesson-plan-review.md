# Lesson Plan Review — "The Skiff Run"

A short story-driven lesson on equivalent fractions for a 9-year-old, built on top of the existing Synthesis Tutor codebase. Six beats, one continuous through-line, ends on the new Fraction Box (Lego-brick) exercise.

---

## Story arc (one breath)

You and Ari (your AI co-pilot) are flying a small delivery ship called the **Skiff** out to a moon outpost. Four stops, one trip home. Every stop is a small fraction puzzle:

1. **Load the snack-ration** — chocolate bar split into four squares; the tray it goes in is the size of half the bar.
2. **Log the ration** — Ari needs a number for the flight log.
3. **Share the moon-pizza** — cook split it for two; four more friends just landed.
4. **Check the share** — Ari double-checks the math before anyone bites in.
5. **Read the star-map** — the engineer hands you a square paper map; the folds mark the route home.
6. **Start the warp-drive** *(climax — the new Fraction Box)* — the warp-lock won't fire unless you've shown it two different brick-combinations that fill "one whole."

The reveal at the end: **the snack tray, the half-pizza, the half-map, and the brick row are all the same amount. Equivalent fractions are just one amount with more than one name.**

This frame keeps the math identical to the original lesson — the prose has been story-fied, not the manipulatives.

## Why this frame works for a 9-year-old

- **Concrete stakes that compound.** Each stop is a thing you can picture (a snack, a slice, a fold, a glowing brick). The hero isn't told fractions are useful; they keep needing fractions to keep going.
- **One protagonist, one helper.** You pilot; Ari co-pilots. Ari narrates observationally ("you put two squares on the tray — they covered the same space as one half") instead of evaluating ("good job!"). That's the Montessori "description, not praise" principle, intact.
- **One ship, one trip.** No new world-building per beat. The setting is established in the Intro and never has to be reintroduced.
- **The math is the climax, not a detour.** The warp-drive lock literally requires equivalence. Two different brick-combos that fill the same row = two equivalent expressions of "one whole." The kid will see it before being told it.

## Math arc (what they actually learn)

| # | Beat                  | Concept                                                                  |
|---|-----------------------|--------------------------------------------------------------------------|
| 1 | chocolate_intro       | A whole can be split into equal pieces; a half is two of those quarters. |
| 2 | chocolate_check       | Count what's actually in front of you. Two.                              |
| 3 | pizza_explore         | Cutting halves in half makes quarters — pizza didn't change.             |
| 4 | pizza_check           | Two quarters cover the same space as one half. (Words match the picture.) |
| 5 | paper_fold_final      | Folds *prove* ½ = ²⁄₄ — you can trace it with a finger.                  |
| 6 | fraction_box_explore  | Many *different* combos can sum to the same whole. Generalization.       |

Beats 1–5 are the original lesson's math, unchanged. Beat 6 generalizes: it's no longer "is this equal to a half?" but "find more than one way to fill the same whole." That's the leap from a specific equivalence (½ = ²⁄₄) to the concept of equivalence itself.

## Why a Fraction Box is the right climax

- **Concrete-but-flexible.** The other three manipulatives each lock you into one comparison (½ vs ²⁄₄ on the chocolate; the two halves of one pizza; the four quarters of one folded square). The Fraction Box opens the door — pick *any* unit fractions, find *any* combination, as long as it adds to one. The child stops solving and starts exploring.
- **Equivalence becomes visible.** Both combos fill the **same plate**. The picture is identical even when the bricks are completely different. That's equivalence in its purest form.
- **The completion rule trains generalization.** `minCombos = 2` is the smallest number that forces the child to ask "is there *another* way?" — which is exactly the question the whole lesson is trying to install.
- **It scales.** With the palette `½, ⅓, ¼, ⅙, ⅛`, the same component can drop into a Grade 4 lesson at `minCombos: 3` or higher without touching code.

## Pedagogy notes (in line with `synthesis_tutor_presearch.md`)

- **Concrete before abstract** — every beat starts with something physical to manipulate; only after the gesture does Ari name what was made.
- **Control of error in the material** — the half-tray, the cut pizza, the folded paper, and the brick row all visibly *don't fit* when wrong. Ari never tells the child "you're wrong"; the material does.
- **Three-period lesson** — beats 1, 3, 5, 6 are Period 1/2 (introduce / recognize via manipulation); beats 2 and 4 are explicit Period 3 (recall via MC). The Fraction Box stays Period 1/2 — the manipulation itself is the assessment, no MC needed.
- **Description, not praise** — every Ari response (initial chat, MC celebration, hints) describes what the child did, never how good they are. The "✓ filled" tag on the Fraction Box's plate is the same: it names the state, not the kid.
- **Self-paced reveal** — cells unlock only after the prior beat completes. The Outro doesn't appear until all six are done. No timers, no clocks, no streaks.
- **Redirect, never reprimand** — wrong-MC hints (canonical, three deep per MC) always point the child back to the material: *"look at the tray again,"* *"trace one half with your finger."*
- **Aesthetic minimalism** — the cosmos palette + JetBrains-Mono labels keep the surface calm. The Fraction Box deliberately mimics the existing Lego visual idiom (studs + body + 1px black border) so it reads as the same family of object as the other manipulatives.

## What I changed in the codebase to support this

1. **Added the Fraction Box.** A new drag-and-drop manipulative built with pointer events (works on mouse, trackpad, iPad), a Lego visual stack made of CSS-only `StudRow` + `LegoBrick` + `PaletteBrick`, a fraction-math helper in `src/lib/lesson/fractions.ts` (`gcd`, `lcm`, `fracSum`, `comboKey`), and a `validateFractionBox` rule that ticks `combos >= minCombos`.
2. **Widened the type system.** `BeatId` gained `'fraction_box_explore'`; `ManipulativeConfig` / `ManipulativeState` gained the fraction-box variants. `validateManipulative` and `isBeatComplete` both handle the new kind. Tests cover both predicates.
3. **Story-fied all six beats.** New prose in `src/lib/lesson/lessonData.ts` (preserving the `{y}/{r}/{b}/{g}` highlight tokens so the colored numerals still light up). The math underneath each beat is unchanged; only the wrapping fiction is new.
4. **Story-fied Intro + Outro.** Intro names the Skiff and sets the trip. Outro is a "warp-drive online" celebration with the ½ = ²⁄₄ equation and a one-line moral.
5. **Ari's opening lines** changed to be in-world ("Ari here, your co-pilot. Skiff's loaded…").

## Open questions for the curriculum / product side

- **Palette size.** Five unit fractions (`½, ⅓, ¼, ⅙, ⅛`) is rich but ⅓ and ⅙ can't share a denominator with most of the others without hitting LCM = 24. For Grade 3 this is fine — but if testing shows kids getting stuck, trimming to `½, ¼, ⅛` would still give multiple combos and a much easier mental model.
- **minCombos = 2.** The smallest number that proves equivalence. Worth confirming this is the curriculum target; Grade 4 might want 3+.
- **Persistence.** Fractions in `bars` and the combo *count* are serializable for `localStorage`, but the combo *keys* (Set) currently aren't persisted. If a kid reloads mid-puzzle, they'll keep their `combos` number but not the specific combinations. That's a follow-up.
- **No MC for the Fraction Box.** Intentional — the manipulation itself is the check (you literally cannot get to two different combos without internalizing equivalence). If curriculum wants a Period-3 cap, a single MC ("Did two ¼ bricks cover the same space as one ½?") would slot in next to the manipulative without disrupting the story.
- **TTS / Voice.** Out of scope this pass. When it lands, the story prose reads beautifully aloud — short sentences, active verbs, sensory detail.

## Suggested follow-ups (not in this PR)

- **Keyboard support for the Fraction Box.** Today it's pointer-only. Flagged in the handoff. The fix: focusable palette + workspace bricks, Enter/Space to add to the end, Delete/Backspace to remove.
- **An "ah-ha" beat between 5 and 6.** Optional. A 30-second pause-and-think: "look at the tray, the pizza, the map — what do they have in common?" Right now we leave that synthesis implicit and trust the Outro to land it.
- **A short epilogue.** When the warp-drive lights up, an extra Ari line that ties back to beat 1 ("remember the snack tray? same amount.") would compound the throughline.
- **Asset / illustration pass.** Right now the cosmos comes from the background doodles + palette only. A hand-drawn Skiff icon in the Intro and a glowing warp-drive in the Outro would sell the world in ~10 minutes of design work.

---

**TL;DR.** The new lesson is the old lesson with a coherent story wrapped around it, plus one more beat — the Fraction Box — that turns the lesson's specific equivalence (½ = ²⁄₄) into the general idea (many shapes, one whole). The math is unchanged; the narrative throughline gives a 9-year-old a reason to care about every step.
