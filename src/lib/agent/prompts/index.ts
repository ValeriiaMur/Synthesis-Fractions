// Barrel for the per-task prompt modules. Each module exports SYSTEM
// (the system message) and, where useful, FEW_SHOT (an array of canonical
// {input, output} pairs the node uses as a prelude).
//
// Centralising the prompts here gives us:
//   - one source of truth for tone + discipline + format,
//   - room to add LangSmith-eval-friendly few-shots without touching the
//     graph wiring,
//   - an easy place to bump prompts independently of code logic.

export {
  HINT_SYSTEM,
  HINT_FEW_SHOT,
  type FewShotExample,
} from './hint';
export { PARAPHRASE_SYSTEM, PARAPHRASE_FEW_SHOT } from './paraphrase';
export { REFLECTION_SYSTEM, REFLECTION_FEW_SHOT } from './reflection';
export { SCAFFOLD_SYSTEM, SCAFFOLD_FEW_SHOT } from './scaffold';
export { ADVANCE_SYSTEM, ADVANCE_FEW_SHOT } from './advance';
export { CHAT_SYSTEM, CHAT_FEW_SHOT } from './chat';
