import type {
  ChatPayload,
  ManipulativeKind,
} from './lessonAgent';
import type { BeatId } from '@/lib/lesson/types';

export type ChatRequest = {
  readonly studentName: string;
  readonly studentMessage: string;
  readonly currentBeatId: BeatId | null;
  readonly currentBeatProse: string | null;
  readonly currentBeatKindLabel: string | null;
  readonly manipulativeKind: ManipulativeKind | null;
  readonly recentChat: ChatPayload['recentChat'];
};

export type StreamChatOptions = {
  /** Aborts the connection after this many ms. Default 8000. */
  readonly timeoutMs?: number;
  /** AbortSignal — caller can cancel mid-stream (e.g. on unmount). */
  readonly signal?: AbortSignal;
};

const DEFAULT_TIMEOUT_MS = 8000;
const SSE_DATA_PREFIX = 'data: ';
const SSE_TERMINATOR = '[DONE]';

/**
 * Streams Ari's reply from POST /api/agent/chat as an async iterable of
 * token chunks. Yields raw text fragments in the order they arrive. Ends
 * when the server sends `[DONE]` or the stream closes.
 *
 * Never throws — on network error / timeout the iterator simply ends. The
 * caller should treat an iterator that yields zero tokens as "no LLM
 * reply" and use the canonical fallback.
 */
export async function* streamChat(
  request: ChatRequest,
  options: StreamChatOptions = {},
): AsyncIterable<string> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Forward an external abort, if provided.
  const externalSignal = options.signal;
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', () => controller.abort());
  }

  let response: Response;
  try {
    response = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    return;
  }

  if (!response.ok || !response.body) {
    clearTimeout(timer);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let nlIdx: number;
      while ((nlIdx = buf.indexOf('\n\n')) !== -1) {
        const eventBlock = buf.slice(0, nlIdx);
        buf = buf.slice(nlIdx + 2);

        // An event can span multiple `data: ` lines — re-join with \n
        // (matches the sseChunk encoder on the server).
        const dataLines: string[] = [];
        for (const line of eventBlock.split('\n')) {
          if (line.startsWith(SSE_DATA_PREFIX)) {
            dataLines.push(line.slice(SSE_DATA_PREFIX.length));
          }
        }
        if (dataLines.length === 0) continue;
        const data = dataLines.join('\n');
        if (data === SSE_TERMINATOR) {
          clearTimeout(timer);
          return;
        }
        yield data;
      }
    }
  } catch {
    // Reader aborted or network error — silently end the stream.
  } finally {
    clearTimeout(timer);
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }
}
