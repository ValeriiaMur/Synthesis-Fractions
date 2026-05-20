import type { Lesson } from './types';

/**
 * Six short naming-first lessons on halves and quarters.
 *
 *   00  whole_intro                what is one whole (tap to split in half)
 *   01  name_half                  what is one half
 *   02  name_quarter               what is one quarter
 *   03  mix_half_quarter           halves and quarters together
 *   04  equiv_half_two_quarters    one half = two quarters  (chocolate tap-to-cover)
 *   05  equiv_paper_check          transfer check            (paper-fold)
 *
 * Each beat is one concept. No story arc, no characters. Beats 0–4 use the
 * chocolate bar as the single material (continuity across whole → naming →
 * equivalence). Beat 5 is a Period-3 *transfer* check: prove the same
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
      prose: 'Tap one half.',
      manipulative: { kind: 'naming', fractions: ['half'], masteryStreak: 3 },
    },
    {
      id: 'name_quarter',
      phase: 'period_1_introduce',
      kindLabel: 'one quarter',
      prose: 'Tap one quarter.',
      manipulative: { kind: 'naming', fractions: ['quarter'], masteryStreak: 3 },
    },
    {
      id: 'mix_half_quarter',
      phase: 'period_2_recognize',
      kindLabel: 'halves and quarters',
      prose: 'Tap the half. Then tap the quarter.',
      manipulative: { kind: 'naming', fractions: ['half', 'quarter'], masteryStreak: 4 },
    },
    {
      id: 'equiv_half_two_quarters',
      phase: 'period_3_recall',
      kindLabel: 'half = two quarters',
      prose: 'Place quarters on the half until it fits exactly.',
      manipulative: { kind: 'equivalence', targetCount: 2 },
    },
    {
      id: 'equiv_paper_check',
      phase: 'period_3_recall',
      kindLabel: 'check: half = two quarters',
      prose: 'Fold the paper. Then fold again.',
      manipulative: { kind: 'paper', targetFolds: ['horizontal', 'vertical'] },
    },
  ],
};
