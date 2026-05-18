import { runLessonAgent } from '@/lib/agent/lessonAgent';
import { getHintLLM } from '@/lib/agent/anthropicClient';
import { isKnownBeatId, isNonEmptyString } from '@/lib/agent/validation';
import type { BeatId } from '@/lib/lesson/types';

type ValidationResult =
  | {
      readonly ok: true;
      readonly input: { readonly beatId: BeatId; readonly originalProse: string };
    }
  | { readonly ok: false; readonly reason: string };

function validate(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, reason: 'body-not-object' };
  }
  const body = raw as Record<string, unknown>;
  if (!isKnownBeatId(body.beatId)) {
    return { ok: false, reason: 'beatId-invalid' };
  }
  if (!isNonEmptyString(body.originalProse)) {
    return { ok: false, reason: 'originalProse-invalid' };
  }
  return {
    ok: true,
    input: {
      beatId: body.beatId,
      originalProse: body.originalProse,
    },
  };
}

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

  try {
    const result = await runLessonAgent(
      { task: 'paraphrase', payload: validation.input },
      { llm: getHintLLM() },
    );
    if (!result.paraphrasedProse) {
      return Response.json({ error: 'paraphrase-failed' }, { status: 500 });
    }
    return Response.json({ paraphrasedProse: result.paraphrasedProse });
  } catch {
    return Response.json({ error: 'paraphrase-failed' }, { status: 500 });
  }
}
