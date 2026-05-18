import { runLessonAgent, type ManipulativeKind } from '@/lib/agent/lessonAgent';
import { getHintLLM } from '@/lib/agent/anthropicClient';
import {
  isKnownBeatId,
  isKnownKind,
  isNonEmptyString,
} from '@/lib/agent/validation';
import type { BeatId } from '@/lib/lesson/types';

type ValidationResult =
  | {
      readonly ok: true;
      readonly input: {
        readonly beatId: BeatId;
        readonly manipulativeKind: ManipulativeKind;
        readonly reflectionText: string;
      };
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
  if (!isKnownKind(body.manipulativeKind)) {
    return { ok: false, reason: 'manipulativeKind-invalid' };
  }
  if (!isNonEmptyString(body.reflectionText)) {
    return { ok: false, reason: 'reflectionText-invalid' };
  }
  return {
    ok: true,
    input: {
      beatId: body.beatId,
      manipulativeKind: body.manipulativeKind,
      reflectionText: body.reflectionText,
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
      { task: 'classify_reflection', payload: validation.input },
      { llm: getHintLLM() },
    );
    if (!result.reflectionCategory || !result.reflectionReaction) {
      return Response.json(
        { error: 'classify-reflection-failed' },
        { status: 500 },
      );
    }
    return Response.json({
      category: result.reflectionCategory,
      reaction: result.reflectionReaction,
    });
  } catch {
    return Response.json({ error: 'classify-reflection-failed' }, { status: 500 });
  }
}
