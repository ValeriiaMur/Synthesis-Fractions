// Server-only. POST /api/agent/scaffold-mc — fires when a learner has
// answered the same MC wrong three times. Returns a shorter question +
// exactly two options (the correct one + one plausible distractor).
//
// Defense-in-depth: the lessonAgent scaffold_mc node already enforces
// keepOptionId ≠ correctOptionId, so by the time the response leaves this
// route the correct option is guaranteed to survive the reduction.

import {
  runLessonAgent,
  type ManipulativeKind,
  type ScaffoldMCOption,
  type ScaffoldMCPayload,
} from '@/lib/agent/lessonAgent';
import { getHintLLM } from '@/lib/agent/anthropicClient';
import {
  isKnownBeatId,
  isKnownKind,
  isNonEmptyString,
} from '@/lib/agent/validation';
import type { BeatId } from '@/lib/lesson/types';

type ValidationResult =
  | { readonly ok: true; readonly input: ScaffoldMCPayload }
  | { readonly ok: false; readonly reason: string };

function validateOptions(
  raw: unknown,
): readonly ScaffoldMCOption[] | null {
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const out: ScaffoldMCOption[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) return null;
    const o = item as Record<string, unknown>;
    if (!isNonEmptyString(o.id) || !isNonEmptyString(o.label)) return null;
    out.push({ id: o.id, label: o.label });
  }
  return out;
}

function validate(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, reason: 'body-not-object' };
  }
  const body = raw as Record<string, unknown>;

  const beatId: unknown = body.beatId;
  if (!isKnownBeatId(beatId)) {
    return { ok: false, reason: 'beatId-invalid' };
  }
  const manipulativeKind: unknown = body.manipulativeKind;
  if (!isKnownKind(manipulativeKind)) {
    return { ok: false, reason: 'manipulativeKind-invalid' };
  }
  if (!isNonEmptyString(body.question)) {
    return { ok: false, reason: 'question-invalid' };
  }
  if (!isNonEmptyString(body.correctOptionId)) {
    return { ok: false, reason: 'correctOptionId-invalid' };
  }
  const options = validateOptions(body.options);
  if (!options) {
    return { ok: false, reason: 'options-invalid' };
  }
  if (!options.some((o) => o.id === body.correctOptionId)) {
    return { ok: false, reason: 'correctOptionId-not-in-options' };
  }
  return {
    ok: true,
    input: {
      beatId: beatId as BeatId,
      manipulativeKind: manipulativeKind as ManipulativeKind,
      question: body.question,
      options,
      correctOptionId: body.correctOptionId,
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
      { task: 'scaffold_mc', payload: validation.input },
      { llm: getHintLLM() },
    );
    if (!result.scaffoldedMC) {
      return Response.json({ error: 'scaffold-failed' }, { status: 500 });
    }
    return Response.json({
      paraphrasedQuestion: result.scaffoldedMC.paraphrasedQuestion,
      reducedOptions: result.scaffoldedMC.reducedOptions,
    });
  } catch {
    return Response.json({ error: 'scaffold-failed' }, { status: 500 });
  }
}
