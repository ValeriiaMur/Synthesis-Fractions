import type { Lesson } from './types';

/**
 * Seven short naming-first lessons on halves and quarters.
 *
 *   00  whole_intro                what is one whole (tap to split in half)
 *   01  name_half                  what is one half
 *   02  name_quarter               what is one quarter
 *   03  mix_half_quarter           halves and quarters together
 *   04  recall_name                Period-3 recall — "what is this?" (say it aloud)
 *   05  equiv_half_two_quarters    one whole = four quarters (build the whole + hammer-break it)
 *   06  equiv_paper_check          transfer check            (paper-fold)
 *
 * Each beat is one concept. No story arc, no characters. Beats 0–5 use the
 * chocolate bar as the single material (continuity across whole → naming →
 * recall → equivalence). The recall beat is the canonical Montessori third
 * period: the kid says the name aloud, then reveals the confirmation — no
 * speech capture. Beat 6 is a Period-3 *transfer* check: prove the same
 * equivalence in a new representation by folding a square of paper twice.
 * See montessori-plan.md.
 */
export const lesson: Lesson = {
  id: 'fractions-naming-v1',
  beats: [
    {
      id: 'whole_intro',
      phase: 'period_1_introduce',
      kindLabel: 'one whole',
      prose: 'This is one whole. Tap to split it in half.',
      manipulative: { kind: 'whole' },
    },
    {
      id: 'name_half',
      phase: 'period_1_introduce',
      kindLabel: 'one half',
      prose: 'Tap each half.',
      manipulative: { kind: 'naming', fractions: ['half'] },
    },
    {
      id: 'name_quarter',
      phase: 'period_1_introduce',
      kindLabel: 'one quarter',
      prose: 'Tap each quarter.',
      manipulative: { kind: 'naming', fractions: ['quarter'] },
    },
    {
      id: 'mix_half_quarter',
      phase: 'period_2_recognize',
      kindLabel: 'halves and quarters',
      prose: 'Tap the half. Then tap each quarter.',
      manipulative: { kind: 'naming', fractions: ['half', 'quarter'] },
    },
    {
      id: 'recall_name',
      phase: 'period_3_recall',
      kindLabel: 'what is this?',
      prose: 'What is this? Say it out loud — then show me.',
      manipulative: { kind: 'recall', fraction: 'half' },
    },
    {
      id: 'equiv_half_two_quarters',
      phase: 'period_3_recall',
      kindLabel: 'whole = four quarters',
      prose: 'Place four quarters to fill the whole. Then break it with the hammer.',
      manipulative: { kind: 'equivalence', targetCount: 4 },
    },
    {
      id: 'equiv_paper_check',
      phase: 'period_3_recall',
      kindLabel: 'check: half = two quarters',
      prose: 'Notice what we just saw: a whole can be named as halves and as quarters. Now show that same idea by folding the paper.',
      manipulative: { kind: 'paper', targetFolds: ['horizontal', 'vertical'] },
    },
  ],
};
