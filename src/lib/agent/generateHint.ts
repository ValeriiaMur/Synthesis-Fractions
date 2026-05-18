// Server-only. Thin wrapper around the unified lessonAgent for the
// generate-hint task. Kept as a separate export for back-compat with the
// hint route handler; new tasks should call runLessonAgent directly.

import {
  runLessonAgent,
  type ChatModelLike,
  type HintPayload,
  type ManipulativeKind,
} from './lessonAgent';

export type { ManipulativeKind, ChatModelLike };

export type HintInput = HintPayload;

export type HintDeps = {
  readonly llm: ChatModelLike;
};

export async function generateHint(
  input: HintInput,
  deps: HintDeps,
): Promise<string> {
  const result = await runLessonAgent({ task: 'hint', payload: input }, deps);
  if (!result.hint) {
    throw new Error('generateHint: agent returned no hint');
  }
  return result.hint;
}
