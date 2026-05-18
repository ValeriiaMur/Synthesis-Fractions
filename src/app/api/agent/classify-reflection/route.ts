import { runLessonAgent, type ManipulativeKind } from '@/lib/agent/lessonAgent';
import { getHintLLM } from '@/lib/agent/anthropicClient';
import type { BeatId } from '@/lib/lesson/types';

const KNOWN_BEAT_IDS: ReadonlyArray<BeatId> = [
  'chocolate_intro',
  'chocolate_check',
  'pizza_explore',
  'pizza_check',
  'paper_fold_final',
];

const KNOWN_KINDS: ReadonlyArray<ManipulativeKind> = ['chocolate', 'pizza', 'paper'];

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
  if (
    typeof body.manipulativeKind !== 'string' ||
    !KNOWN_KINDS.includes(body.manipulativeKind as ManipulativeKind)
  ) {
    return { ok: false, reason: 'manipulativeKind-invalid' };
  }
  if (!isString(body.reflectionText)) {
    return { ok: false, reason: 'reflectionText-invalid' };
  }
  return {
    ok: true,
    input: {
      beatId: body.beatId as BeatId,
      manipulativeKind: body.manipulativeKind as ManipulativeKind,
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
