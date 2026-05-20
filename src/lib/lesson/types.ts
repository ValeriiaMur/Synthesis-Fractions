export type BeatId =
  | 'whole_intro'
  | 'name_half'
  | 'name_quarter'
  | 'mix_half_quarter'
  | 'equiv_half_two_quarters'
  | 'equiv_paper_check';

export type LessonPhase = 'period_1_introduce' | 'period_2_recognize' | 'period_3_recall';

export type WholeConfig = {
  readonly kind: 'whole';
};

export type NamingConfig = {
  readonly kind: 'naming';
  readonly fractions: readonly ('half' | 'quarter')[];
  readonly masteryStreak: number;
};

export type EquivalenceConfig = {
  readonly kind: 'equivalence';
  readonly targetCount: 2;
};

export type PaperConfig = {
  readonly kind: 'paper';
  readonly targetFolds: readonly ('horizontal' | 'vertical')[];
};

export type ManipulativeConfig =
  | WholeConfig
  | NamingConfig
  | EquivalenceConfig
  | PaperConfig;

export type WholeState = { readonly kind: 'whole'; readonly split: boolean };
export type NamingState = { readonly kind: 'naming'; readonly streak: number };
export type EquivalenceState = { readonly kind: 'equivalence'; readonly placedCount: number };
export type PaperState = {
  readonly kind: 'paper';
  readonly folds: readonly ('horizontal' | 'vertical')[];
};
export type ManipulativeState =
  | WholeState
  | NamingState
  | EquivalenceState
  | PaperState;

export type Beat = {
  readonly id: BeatId;
  readonly phase: LessonPhase;
  readonly kindLabel: string;
  readonly prose: string;
  readonly manipulative: ManipulativeConfig;
};

export type Lesson = {
  readonly id: 'fractions-naming-v1';
  readonly beats: readonly Beat[];
};

export type BeatStatus = 'locked' | 'active' | 'done' | 'completed';
