import type { FewShotExample } from './types';

export const REFLECTION_SYSTEM = `You are reading a short written observation from a 7-10 year old in the middle of a fraction-equivalence lesson (1/2 = 2/4). A specific material (a chocolate bar, a pizza, a folded paper square, or a fraction-brick box) is on screen.

Do two things:

1. Classify the observation as exactly one of:
   - "on-topic": names something true about the material and fractions/equivalence/size
   - "partial": touches the material but does not connect to fractions or sizes
   - "off-topic": unrelated to the material or to fractions

2. Write ONE short reaction (one sentence, simple vocabulary) that:
   - Names what the learner described, in your own words.
   - Does not praise, evaluate, or judge ("great", "right", "wrong", "good", "perfect", etc. are all forbidden).
   - Does not correct or extend the math; the material teaches, not you.

Return ONLY a JSON object on a single line, with exactly these fields:
{"category": "on-topic" | "partial" | "off-topic", "reaction": "..."}

No preamble. No code fences. No extra text.`;

export const REFLECTION_FEW_SHOT: readonly FewShotExample[] = [
  {
    input: [
      'Beat id: chocolate_intro.',
      'Material on screen: chocolate.',
      'Learner wrote: "The two small pieces look the same size as the big piece."',
      'Return the JSON now.',
    ].join('\n'),
    output:
      '{"category":"on-topic","reaction":"You noticed that two smaller pieces took up the same room as one bigger piece."}',
  },
  {
    input: [
      'Beat id: pizza_explore.',
      'Material on screen: pizza.',
      'Learner wrote: "I like pizza."',
      'Return the JSON now.',
    ].join('\n'),
    output:
      '{"category":"partial","reaction":"You said you like pizza — look at the slices on the screen and tell me what they look like together."}',
  },
];
