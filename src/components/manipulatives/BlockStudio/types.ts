import type {
  BlockStudioQuestId,
  BlockStudioStepId,
  FractionBoxBar,
} from '@/lib/lesson/types';

export type Rail = {
  readonly id: string;
  readonly bars: readonly FractionBoxBar[];
};

export type PaletteFrac = {
  readonly num: number;
  readonly den: number;
  readonly color: string;
};

export type DragState =
  | {
      readonly source: 'palette';
      readonly frac: PaletteFrac;
      x: number;
      y: number;
      readonly gx: number;
      readonly gy: number;
      readonly w: number;
      readonly h: number;
    }
  | {
      readonly source: 'workspace';
      readonly fromRailId: string;
      readonly barId: string;
      readonly frac: PaletteFrac;
      x: number;
      y: number;
      readonly gx: number;
      readonly gy: number;
      readonly w: number;
      readonly h: number;
    };

export type ToastKind = 'good' | 'info';

export type Toast = {
  readonly msg: string;
  readonly kind: ToastKind;
};

export type StepDescriptor = {
  readonly id: BlockStudioStepId;
  readonly num: number;
  readonly label: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly blurb: string;
  readonly goal: string;
  readonly goalReady: string;
};

export type QuestDescriptor = {
  readonly id: BlockStudioQuestId;
  readonly task: string;
  readonly hint: string;
};
