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

/**
 * Drag-source payload attached to each draggable via `data` on useDraggable.
 * dnd-kit gives us this back in onDragEnd via `active.data.current`.
 */
export type DragSourcePalette = {
  readonly source: 'palette';
  readonly frac: PaletteFrac;
};

export type DragSourceWorkspace = {
  readonly source: 'workspace';
  readonly fromRailId: string;
  readonly barId: string;
  readonly frac: PaletteFrac;
};

export type DragSource = DragSourcePalette | DragSourceWorkspace;

/**
 * Tiny snapshot of the currently-active drag, kept in BlockStudio state so
 * subcomponents (the rail in particular) can hide a brick that's being
 * dragged out of it. Cleared on drag-end / drag-cancel.
 */
export type ActiveDrag = {
  readonly source: DragSource;
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
