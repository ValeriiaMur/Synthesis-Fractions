export type BeatId =
  | 'chocolate_intro'
  | 'chocolate_check'
  | 'pizza_explore'
  | 'pizza_check'
  | 'paper_fold_final'
  | 'fraction_box_explore';

export type LessonPhase =
  | 'period_1_introduce'
  | 'period_2_recognize'
  | 'period_3_recall';

export type ChocolateBarConfig = {
  readonly kind: 'chocolate';
  readonly totalPieces: 4;
  readonly referenceFraction: { readonly numerator: 1; readonly denominator: 2 };
};

export type PizzaConfig = {
  readonly kind: 'pizza';
  readonly initialSlices: 2;
  readonly targetSlices: 4;
};

export type PaperConfig = {
  readonly kind: 'paper';
  readonly targetFolds: readonly ('horizontal' | 'vertical')[];
};

export type FractionBoxPaletteEntry = {
  readonly num: 1;
  readonly den: number;
};

export type FractionBoxConfig = {
  readonly kind: 'fractionbox';
  /** Unit fractions available in the palette. */
  readonly palette: readonly FractionBoxPaletteEntry[];
  /** Minimum number of distinct full-fill combinations required to complete. */
  readonly minCombos: number;
};

export type BlockStudioStepId = 'play' | 'compare' | 'quest';
export type BlockStudioQuestId = 'q1' | 'q2' | 'q3';

export type BlockStudioConfig = {
  readonly kind: 'blockstudio';
  /** Available unit fractions in the palette. */
  readonly palette: readonly FractionBoxPaletteEntry[];
  /** Step ids to include. Default ['play','compare','quest']. */
  readonly steps: readonly BlockStudioStepId[];
  /** Quest ids to include, in order. */
  readonly quests: readonly BlockStudioQuestId[];
};

export type ManipulativeConfig =
  | ChocolateBarConfig
  | PizzaConfig
  | PaperConfig
  | FractionBoxConfig
  | BlockStudioConfig;

export type MCOption = {
  readonly id: string;
  readonly label: string;
};

export type MCConfig = {
  readonly question: string;
  readonly options: readonly MCOption[];
  readonly correctOptionId: string;
  readonly canonicalHints: readonly string[];
};

export type Beat = {
  readonly id: BeatId;
  readonly phase: LessonPhase;
  /** Caps tag shown inside the cell-kind row. */
  readonly kindLabel: string;
  /** Prose with inline highlight tokens — {y}…{/y}, {r}{b}{g}…{/r|b|g}. */
  readonly prose: string;
  readonly manipulative?: ManipulativeConfig;
  readonly mc?: MCConfig;
  readonly reflectionPrompt?: string;
};

export type Lesson = {
  readonly id: 'fraction-equivalence-v1';
  readonly beats: readonly Beat[];
};

export type BeatStatus = 'locked' | 'active' | 'done' | 'completed';

export type ChocolateState = {
  readonly kind: 'chocolate';
  readonly piecesOnReference: number;
};

export type PizzaState = {
  readonly kind: 'pizza';
  readonly sliceCount: number;
};

export type PaperState = {
  readonly kind: 'paper';
  readonly folds: readonly ('horizontal' | 'vertical')[];
};

export type FractionBoxBar = {
  readonly id: string;
  readonly num: number;
  readonly den: number;
  readonly color: string;
};

export type FractionBoxState = {
  readonly kind: 'fractionbox';
  /** Bars currently in the workspace, left-to-right. */
  readonly bars: readonly FractionBoxBar[];
  /** Count of unique combinations the student has built that sum to 1. */
  readonly combos: number;
};

export type BlockStudioRailSnapshot = {
  readonly id: string;
  readonly bars: readonly FractionBoxBar[];
};

export type BlockStudioState = {
  readonly kind: 'blockstudio';
  readonly stepIdx: number;
  readonly questIdx: number;
  readonly maxStepReached: number;
  readonly rails: readonly BlockStudioRailSnapshot[];
  readonly questsDone: number;
  readonly completed: boolean;
};

export type ManipulativeState =
  | ChocolateState
  | PizzaState
  | PaperState
  | FractionBoxState
  | BlockStudioState;

export type LessonState = {
  readonly currentBeatId: BeatId;
  readonly beatHistory: readonly BeatId[];
  readonly beatStatus: Readonly<Record<BeatId, BeatStatus>>;
  readonly mcSelections: Readonly<Partial<Record<BeatId, string>>>;
  readonly hintAttempts: Readonly<Partial<Record<BeatId, number>>>;
  readonly manipulativeStates: Readonly<Partial<Record<BeatId, ManipulativeState>>>;
};

export type MCValidation = {
  readonly correct: boolean;
  readonly correctOptionId: string;
};

export type ManipulativeValidation = {
  readonly correct: boolean;
  readonly reason?: string;
};
