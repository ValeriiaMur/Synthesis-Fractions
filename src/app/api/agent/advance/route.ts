// Server-only. POST /api/agent/advance — produces Ari's one-line in-world
// acknowledgement when the lesson auto-advances to a new beat. Falls back
// to the canonical "▸ cell NN unlocked" system message on failure.

import {
  runLessonAgent,
  type AdvancePayload,
} from '@/lib/agent/lessonAgent';
import { getHintLLM } from '@/lib/agent/anthropicClient';
import { isKnownBeatId, isNonEmptyString } from '@/lib/agent/validation';

type ValidationResult =
  | { readonly ok: true; readonly input: AdvancePayload }
  | { readonly ok: false; readonly reason: string };

function validate(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, reason: 'body-not-object' };
  }
  const body = raw as Record<string, unknown>;
  // fromBeatId is nullable — first advance has no prior beat.
  let fromBeatId: AdvancePayload['fromBeatId'] = null;
  if (body.fromBeatId != null) {
    if (!isKnownBeatId(body.fromBeatId)) {
      return { ok: false, reason: 'fromBeatId-invalid' };
    }
    fromBeatId = body.fromBeatId;
  }
  if (!isKnownBeatId(body.toBeatId)) {
    return { ok: false, reason: 'toBeatId-invalid' };
  }
  if (!isNonEmptyString(body.toBeatKindLabel)) {
    return { ok: false, reason: 'toBeatKindLabel-invalid' };
  }
  if (!isNonEmptyString(body.studentName)) {
    return { ok: false, reason: 'studentName-invalid' };
  }
  return {
    ok: true,
    input: {
      fromBeatId,
      toBeatId: body.toBeatId,
      toBeatKindLabel: body.toBeatKindLabel,
      studentName: body.studentName,
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
      { task: 'advance_to_beat', payload: validation.input },
      { llm: getHintLLM() },
    );
    if (!result.advanceLine) {
      return Response.json({ error: 'advance-failed' }, { status: 500 });
    }
    return Response.json({ advanceLine: result.advanceLine });
  } catch {
    return Response.json({ error: 'advance-failed' }, { status: 500 });
  }
}
