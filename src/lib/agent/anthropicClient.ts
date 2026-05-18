// Server-only. Builds the production LLM(s) for the lesson agent.
// Tests inject a fake ChatModelLike and never call these.
//
// LangSmith tracing is automatic when LANGSMITH_TRACING=true and the
// LANGSMITH_API_KEY / LANGSMITH_PROJECT env vars are set
// (LangChain reads these at module load).

import { ChatAnthropic } from '@langchain/anthropic';
import type { ChatModelLike } from './generateHint';

const MODEL = 'claude-haiku-4-5';

/** Default LLM used by every blocking node in the agent (hint, paraphrase,
 *  classify_reflection, scaffold_mc, advance_to_beat, chat-blocking). */
export function getHintLLM(): ChatModelLike {
  return new ChatAnthropic({
    model: MODEL,
    temperature: 0.4,
    maxTokens: 150,
  });
}

/** Streaming LLM used by the SSE chat route — same model, slightly higher
 *  token cap so the model can finish a 1–2 sentence reply comfortably. */
export function getStreamingLLM(): ChatAnthropic {
  return new ChatAnthropic({
    model: MODEL,
    temperature: 0.5,
    maxTokens: 220,
  });
}
