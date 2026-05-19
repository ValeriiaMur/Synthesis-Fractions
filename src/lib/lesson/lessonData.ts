import type { Lesson } from './types';

/**
 * Six-beat equivalent-fractions lesson, framed as one continuous cosmos
 * adventure for a 9-year-old.
 *
 * Story arc — you and Ari are on a small ship called the Spirit, running a
 * delivery to a moon outpost. Every stop turns into a fraction puzzle:
 *
 *   01  chocolate_intro      The Spirit's snack-ration tray needs to be half-filled.
 *   02  chocolate_check      Ari logs how many ration squares it took.
 *   03  pizza_explore        At the outpost, the cook's moon-pizza is split for
 *                            two — and four more friends just landed.
 *   04  pizza_check          Ari double-checks the share is fair.
 *   05  paper_fold_final     The outpost engineer hands over a star-map. The
 *                            folds reveal the way home.
 *   06  fraction_box_explore Back on the Spirit, the warp-drive's fraction-lock
 *                            needs *two* matching brick patterns to start.
 *
 * Prose carries highlight tokens:
 *   {y}…{/y}  yellow emphasis
 *   {r}…{/r}  red numeral
 *   {b}…{/b}  blue numeral
 *   {g}…{/g}  green numeral
 */
export const lesson: Lesson = {
  id: 'fraction-equivalence-v1',
  beats: [
    {
      id: 'chocolate_intro',
      phase: 'period_1_introduce',
      kindLabel: 'manipulative — ration bar',
      prose:
        "Loading the Spirit. The snack-ration is a chocolate bar in {y}four equal squares{/y}; the tray below holds exactly {y}half the bar{/y}. Tap squares onto the tray until it fits.",
      manipulative: {
        kind: 'chocolate',
        totalPieces: 4,
        referenceFraction: { numerator: 1, denominator: 2 },
      },
    },
    {
      id: 'chocolate_check',
      phase: 'period_2_recognize',
      kindLabel: 'check — flight log',
      prose:
        "Flight log needs a number. Count the squares on the tray.",
      mc: {
        question: 'How many quarter-squares ended up on the half-tray?',
        options: [
          { id: 'one', label: 'One' },
          { id: 'two', label: 'Two' },
          { id: 'three', label: 'Three' },
          { id: 'four', label: 'Four' },
        ],
        correctOptionId: 'two',
        canonicalHints: [
          'Look at the tray again. Slide the quarter-squares so they sit side by side, then count.',
          'Try lining up two quarter-squares in a row on the half-tray. See if they fit.',
          'Place two quarter-squares next to each other on the tray. Count what is there.',
        ],
      },
    },
    {
      id: 'pizza_explore',
      phase: 'period_2_recognize',
      kindLabel: 'manipulative — moon-pizza',
      prose:
        "Touchdown. The cook pulls a moon-pizza from the oven — sliced into {y}two equal halves{/y}. Four more friends just landed. Drag the knife to {y}cut each half in two{/y} — a slice for everyone.",
      manipulative: {
        kind: 'pizza',
        initialSlices: 2,
        targetSlices: 4,
      },
    },
    {
      id: 'pizza_check',
      phase: 'period_3_recall',
      kindLabel: 'check — fair share',
      prose:
        "Before anyone bites in, check the share is fair. Hold one half against {b}two{/b} of the new slices.",
      mc: {
        question: 'Is two slices out of four the same amount of pizza as one half?',
        options: [
          { id: 'yes', label: 'Yes' },
          { id: 'no', label: 'No' },
        ],
        correctOptionId: 'yes',
        canonicalHints: [
          'Place two of the four slices next to one of the halves. Compare the amounts.',
          'Look at the pizza. Two of the four slices together — do they cover the same shape as one half?',
        ],
      },
    },
    {
      id: 'paper_fold_final',
      phase: 'period_3_recall',
      kindLabel: 'manipulative + check — star-map',
      prose:
        "Heading home. The engineer hands you a square of star-paper. Fold it across the middle — that crease marks {y}one half{/y} of the sky. Fold the other way — the new crease splits each half into {y}quarter-coordinates{/y}.",
      manipulative: {
        kind: 'paper',
        targetFolds: ['horizontal', 'vertical'],
      },
      mc: {
        question: 'What do the folds on the star-map show you?',
        options: [
          {
            id: 'half-equals-two-quarters',
            label: 'One half is the same as two quarters.',
          },
          {
            id: 'half-equals-one-quarter',
            label: 'One half is the same as one quarter.',
          },
          {
            id: 'quarter-bigger-than-half',
            label: 'One quarter is bigger than one half.',
          },
        ],
        correctOptionId: 'half-equals-two-quarters',
        canonicalHints: [
          'Look at the creases on the map. Count the quarter-sections inside one half-section.',
          'Trace one half of the map with your finger. Count how many quarter-sections fit inside it.',
        ],
      },
    },
    {
      id: 'fraction_box_explore',
      phase: 'period_3_recall',
      kindLabel: 'manipulative — warp-drive fraction-lock',
      prose:
        "Back on the Spirit. The warp-drive's fraction-lock fires through {y}three checkpoints{/y} — play with the bricks, build {y}one whole{/y} two different ways, then take on three short quests. Each rail is one whole.",
      manipulative: {
        kind: 'blockstudio',
        palette: [
          { num: 1, den: 2 },
          { num: 1, den: 3 },
          { num: 1, den: 4 },
          { num: 1, den: 6 },
          { num: 1, den: 8 },
        ],
        steps: ['play', 'compare', 'quest'],
        quests: ['q1', 'q2', 'q3'],
      },
    },
  ],
};
