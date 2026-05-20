export type BeatId =
  | 'whole_intro'
  | 'name_half'
  | 'name_quarter'
  | 'mix_half_quarter'
  | 'recall_name'
  | 'equiv_half_two_quarters'
  | 'equiv_paper_check';

export type LessonPhase = 'period_1_introduce' | 'period_2_recognize' | 'period_3_recall';

export type WholeConfig = {
  readonly kind: 'whole';
};

export type NamingConfig = {
  readonly kind: 'naming';
  readonly fractions: readonly ('half' | 'quarter')[];
  /** Retained for back-compat with old snapshots — completion no longer
   *  uses it. The new contract: tap each unique piece on the tray once,
   *  the beat advances when every piece has been tapped. */
  readonly masteryStreak?: number;
};

export type EquivalenceConfig = {
  readonly kind: 'equivalence';
  /** Number of quarter-tiles needed to fill the tray. 4 means "whole",
   *  2 means "half" (legacy — kept open as `number` rather than a
   *  literal so lessons can re-use the material at either size). */
  readonly targetCount: number;
};

export type PaperConfig = {
  readonly kind: 'paper';
  readonly targetFolds: readonly ('horizontal' | 'vertical')[];
};

/** Period-3 recall ("what is this?"). The kid sees one piece, says its name
 *  aloud, then reveals the tutor's confirmation. No speech capture — the
 *  saying-aloud is the recall; the reveal is the affirmation. */
export type RecallConfig = {
  readonly kind: 'recall';
  readonly fraction: 'half' | 'quarter';
};

export type ManipulativeConfig =
  | WholeConfig
  | NamingConfig
  | EquivalenceConfig
  | PaperConfig
  | RecallConfig;

export type WholeState = { readonly kind: 'whole'; readonly split: boolean };
/** Naming state tracks the *unique* region indices the kid has tapped on
 *  the tray. The beat completes when every piece has been tapped at
 *  least once — the kid physically explores every piece, not just hits
 *  a magic streak number. The old `streak` field is preserved as
 *  optional so legacy snapshots still hydrate cleanly. */
export type NamingState = {
  readonly kind: 'naming';
  readonly tapped: readonly number[];
  readonly streak?: number;
};
export type EquivalenceState = { readonly kind: 'equivalence'; readonly placedCount: number };
export type PaperState = {
  readonly kind: 'paper';
  readonly folds: readonly ('horizontal' | 'vertical')[];
};
export type RecallState = { readonly kind: 'recall'; readonly revealed: boolean };
export type ManipulativeState =
  | WholeState
  | NamingState
  | EquivalenceState
  | PaperState
  | RecallState;

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
