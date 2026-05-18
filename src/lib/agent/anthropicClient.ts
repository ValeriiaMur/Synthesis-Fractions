// Server-only. Builds the production LLM for the hint graph.
// Tests inject a fake ChatModelLike and never call this.
//
// LangSmith tracing is automatic when LANGSMITH_TRACING=true and the
// LANGSMITH_API_KEY / LANGSMITH_PROJECT env vars are set
// (LangChain reads these at module load).

import { ChatAnthropic } from '@langchain/anthropic';
import type { ChatModelLike } from './generateHint';

export function getHintLLM(): ChatModelLike {
  return new ChatAnthropic({
    model: 'claude-haiku-4-5',
    temperature: 0.4,
    maxTokens: 150,
  });
}
