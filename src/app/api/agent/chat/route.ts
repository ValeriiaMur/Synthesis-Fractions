// Server-only. Streaming chat endpoint for the lesson chat rail.
//
// SSE protocol:
//   - Each token chunk: `data: <token>\n\n`
//   - Stream terminator: `data: [DONE]\n\n`
//   - On any model error after the stream has started, the stream closes
//     with `data: [DONE]\n\n` and the client falls back to canonical copy.
//
// Body shape lives in `chatClient.ts` and `buildChatMessages` in
// `lessonAgent.ts` — one source of truth for the prompt.

import { buildChatMessages, isPraiseBombing } from '@/lib/agent/lessonAgent';
import type { ChatPayload, ManipulativeKind } from '@/lib/agent/lessonAgent';
import { getStreamingLLM } from '@/lib/agent/anthropicClient';
import {
  isKnownBeatId,
  isKnownKind,
  isNonEmptyString,
} from '@/lib/agent/validation';

type ValidationResult =
  | { readonly ok: true; readonly input: ChatPayload }
  | { readonly ok: false; readonly reason: string };

const FROM_VALUES = new Set(['ari', 'user', 'system']);

function validate(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, reason: 'body-not-object' };
  }
  const body = raw as Record<string, unknown>;

  if (!isNonEmptyString(body.studentName)) {
    return { ok: false, reason: 'studentName-invalid' };
  }
  if (!isNonEmptyString(body.studentMessage)) {
    return { ok: false, reason: 'studentMessage-invalid' };
  }

  let currentBeatId: ChatPayload['currentBeatId'] = null;
  if (body.currentBeatId != null) {
    if (!isKnownBeatId(body.currentBeatId)) {
      return { ok: false, reason: 'currentBeatId-invalid' };
    }
    currentBeatId = body.currentBeatId;
  }

  let manipulativeKind: ManipulativeKind | null = null;
  if (body.manipulativeKind != null) {
    if (!isKnownKind(body.manipulativeKind)) {
      return { ok: false, reason: 'manipulativeKind-invalid' };
    }
    manipulativeKind = body.manipulativeKind;
  }

  const currentBeatProse =
    typeof body.currentBeatProse === 'string' ? body.currentBeatProse : null;
  const currentBeatKindLabel =
    typeof body.currentBeatKindLabel === 'string'
      ? body.currentBeatKindLabel
      : null;

  type RecentTurn = ChatPayload['recentChat'][number];
  let recentChat: ChatPayload['recentChat'] = [];
  if (Array.isArray(body.recentChat)) {
    const validated: RecentTurn[] = [];
    for (const item of body.recentChat) {
      if (typeof item !== 'object' || item === null) continue;
      const m = item as Record<string, unknown>;
      if (
        typeof m.from === 'string' &&
        FROM_VALUES.has(m.from) &&
        typeof m.text === 'string' &&
        m.text.length > 0
      ) {
        validated.push({
          from: m.from as 'ari' | 'user' | 'system',
          text: m.text,
        });
      }
    }
    // Cap at last 12 turns so prompts stay short.
    recentChat = validated.slice(-12);
  }

  return {
    ok: true,
    input: {
      studentName: body.studentName,
      studentMessage: body.studentMessage,
      currentBeatId,
      currentBeatProse,
      currentBeatKindLabel,
      manipulativeKind,
      recentChat,
    },
  };
}

function sseChunk(text: string): string {
  // SSE data lines must not contain raw newlines; split on \n if needed.
  const safe = text.replace(/\r/g, '');
  const lines = safe.split('\n');
  return lines.map((l) => `data: ${l}`).join('\n') + '\n\n';
}

const ENCODER = new TextEncoder();

export async function POST(req: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: 'invalid-json' }, { status: 400 });
  }
  const validation = validate(raw);
  if (!validation.ok) {
    return Response.json({ error: validation.reason }, { status: 400 });
  }

  const messages = buildChatMessages(validation.input);
  const llm = getStreamingLLM();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = '';
      try {
        const tokenStream = await llm.stream(messages);
        for await (const chunk of tokenStream) {
          // chunk.content may be string or content-block array.
          const content = chunk.content;
          let text = '';
          if (typeof content === 'string') {
            text = content;
          } else if (Array.isArray(content)) {
            for (const block of content) {
              if (typeof block === 'string') {
                text += block;
              } else if (
                block != null &&
                typeof block === 'object' &&
                (block as { type?: string }).type === 'text' &&
                typeof (block as { text?: string }).text === 'string'
              ) {
                text += (block as { text: string }).text;
              }
            }
          }
          if (!text) continue;
          buffer += text;
          // Defense-in-depth: if praise leaks in mid-stream, kill the stream
          // and let the client fall back to canonical copy.
          if (isPraiseBombing(buffer)) {
            controller.enqueue(ENCODER.encode('data: [DONE]\n\n'));
            controller.close();
            return;
          }
          controller.enqueue(ENCODER.encode(sseChunk(text)));
        }
        controller.enqueue(ENCODER.encode('data: [DONE]\n\n'));
        controller.close();
      } catch {
        // Best-effort close; the client treats an empty stream the same as
        // a network error and falls back.
        try {
          controller.enqueue(ENCODER.encode('data: [DONE]\n\n'));
        } catch {
          // controller may already be closed; ignore.
        }
        try {
          controller.close();
        } catch {
          // ignore double-close
        }
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
}
