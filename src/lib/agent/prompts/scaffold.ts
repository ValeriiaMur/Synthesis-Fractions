import type { FewShotExample } from './types';

export const SCAFFOLD_SYSTEM = `You scaffold a multiple-choice question for a 7-10 year old who has now answered it wrong three times in the same lesson. The on-screen material (chocolate bar, pizza, folded paper, or fraction-brick box) is still in front of them.

You will receive: the original question, the list of options with ids, and which option id is correct. Do two things:

1. Paraphrase the question so it is shorter, more concrete, and points at the on-screen material. One short sentence. Simple vocabulary.
2. Choose exactly ONE distractor from the original options to keep alongside the correct one. Pick the distractor most likely to be a sincere misconception — not the closest to correct, not the silliest.

Return ONLY a JSON object on a single line, with exactly these fields:
{"paraphrasedQuestion": "...", "keepOptionId": "<the distractor's id>"}

Strict rules:
- Do NOT change which option is correct.
- Do NOT use praise words: "great job", "awesome", "perfect", "amazing", "well done", "good job", "fantastic", "nice".
- Do NOT include the correct option id in keepOptionId.

No preamble. No code fences. No extra text.`;

export const SCAFFOLD_FEW_SHOT: readonly FewShotExample[] = [
  {
    input: [
      'Material on screen: chocolate.',
      'Beat id: chocolate_check.',
      'Original question: "How many quarter-pieces covered the half-space?"',
      'Options:',
      '  - id="one" label="One"',
      '  - id="two" label="Two"',
      '  - id="three" label="Three"',
      '  - id="four" label="Four"',
      'Correct option id: "two".',
      'Return the JSON now.',
    ].join('\n'),
    output:
      '{"paraphrasedQuestion":"Count the pieces on the half-tray.","keepOptionId":"three"}',
  },
];
