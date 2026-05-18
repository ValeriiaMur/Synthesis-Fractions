import { runLessonAgent } from '@/lib/agent/lessonAgent';
import { getHintLLM } from '@/lib/agent/anthropicClient';
import type { BeatId } from '@/lib/lesson/types';

const KNOWN_BEAT_IDS: ReadonlyArray<BeatId> = [
  'chocolate_intro',
  'chocolate_check',
  'pizza_explore',
  'pizza_check',
  'paper_fold_final',
];

type ValidationResult =
  | {
      readonly ok: true;
      readonly input: { readonly beatId: BeatId; readonly originalProse: string };
    }
  | { readonly ok: false; readonly reason: string };

function isString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function validate(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, reason: 'body-not-object' };
  }
  const body = raw as Record<string, unknown>;
  if (
    typeof body.beatId !== 'string' ||
    !KNOWN_BEAT_IDS.includes(body.beatId as BeatId)
  ) {
    return { ok: false, reason: 'beatId-invalid' };
  }
  if (!isString(body.originalProse)) {
    return { ok: false, reason: 'originalProse-invalid' };
  }
  return {
    ok: true,
    input: {
      beatId: body.beatId as BeatId,
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
