import type { Lesson } from './types';

/**
 * Six-beat equivalent-fractions lesson, framed as one continuous cosmos
 * adventure for a 9-year-old.
 *
 * Story arc — you and Ari are on a small ship called the Skiff, running a
 * delivery to a moon outpost. Every stop turns into a fraction puzzle:
 *
 *   01  chocolate_intro      The Skiff's snack-ration tray needs to be half-filled.
 *   02  chocolate_check      Ari logs how many ration squares it took.
 *   03  pizza_explore        At the outpost, the cook's moon-pizza is split for
 *                            two — and four more friends just landed.
 *   04  pizza_check          Ari double-checks the share is fair.
 *   05  paper_fold_final     The outpost engineer hands over a star-map. The
 *                            folds reveal the way home.
 *   06  fraction_box_explore Back on the Skiff, the warp-drive's fraction-lock
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
        "We're loading the Skiff for takeoff. The snack-ration is a chocolate bar broken into {y}four equal squares{/y}, and the tray below it is shaped like exactly {y}half the bar{/y}. Tap squares onto the tray. Stop when it looks like it fits.",
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
        "Ari's flight log needs a number. Look at the tray you just filled and count the squares sitting on it.",
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
        "We touch down. The outpost cook pulls a moon-pizza out of the oven — sliced into {y}two equal halves{/y}, one for each of us. But four more friends just landed. Drag the knife across the pizza to {y}cut each half in two{/y}, so there's a slice for everyone.",
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
        "Before anyone bites in, Ari wants to make sure the share is fair. Look at one half of the pizza, then look at {b}two{/b} of the new slices side by side.",
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
        "Time to head home. The outpost engineer presses a square of star-paper into your hand. Fold it once across the middle — that crease marks the route to {y}one half{/y} of the sky. Fold it again the other way — and the new crease splits each half into {y}quarter-coordinates{/y}.",
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
        "Back on the Skiff. The warp-drive is dim — its fraction-lock won't fire until you fill the {y}one whole{/y} key with bricks. Catch — it only unlocks when you've shown it {y}two different ways{/y} to fill the whole. Drag bricks from the rack into the row. Clear it. Try again with different ones.",
      manipulative: {
        kind: 'fractionbox',
        palette: [
          { num: 1, den: 2 },
          { num: 1, den: 3 },
          { num: 1, den: 4 },
          { num: 1, den: 6 },
          { num: 1, den: 8 },
        ],
        minCombos: 2,
      },
    },
  ],
};
