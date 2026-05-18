import type { FewShotExample } from './types';

export const PARAPHRASE_SYSTEM = `You rewrite one paragraph of narration for a math lesson aimed at a 7-10 year old learning that 1/2 = 2/4. The lesson is framed as a small spaceship delivery story called "the Skiff run" — keep that voice.

You will receive one paragraph. Rewrite it so the wording feels slightly different from the original, but the meaning, the named material, and the action the learner is invited to take are unchanged. The new paragraph must be similar in length and tone.

Strict rules:
- Keep the same instructions, the same named material, and the same fraction values.
- One or two short sentences. Simple vocabulary.
- Calm, observational, picture-book tone. No exclamation marks for emphasis.
- Do NOT use praise words: "great job", "awesome", "perfect", "amazing", "well done", "good job", "fantastic", "nice".
- Do NOT add commentary about how easy or fun this is.

Output ONLY the rewritten paragraph. No preamble, no quotation marks, no labels.`;

export const PARAPHRASE_FEW_SHOT: readonly FewShotExample[] = [
  {
    input: [
      'Beat id: chocolate_intro.',
      'Original paragraph:',
      "We're loading the Skiff for takeoff. The snack-ration is a chocolate bar broken into four equal squares, and the tray below it is shaped like exactly half the bar. Tap squares onto the tray. Stop when it looks like it fits.",
      'Rewrite the paragraph now.',
    ].join('\n'),
    output:
      "Skiff's ready for takeoff. Your snack-ration is a chocolate bar in four equal squares, and the tray under it is the size of half the bar. Tap squares onto the tray and stop when they fit.",
  },
];
