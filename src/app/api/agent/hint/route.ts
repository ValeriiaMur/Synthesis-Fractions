import { generateHint, type HintInput, type ManipulativeKind } from '@/lib/agent/generateHint';
import { getHintLLM } from '@/lib/agent/anthropicClient';

const KINDS: ReadonlyArray<ManipulativeKind> = ['chocolate', 'pizza', 'paper'];

type ValidationResult =
  | { readonly ok: true; readonly input: HintInput }
  | { readonly ok: false; readonly reason: string };

function isString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1;
}

function validate(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, reason: 'body-not-object' };
  }
  const body = raw as Record<string, unknown>;
  const kind = body.manipulativeKind;
  if (typeof kind !== 'string' || !KINDS.includes(kind as ManipulativeKind)) {
    return { ok: false, reason: 'manipulativeKind-invalid' };
  }
  if (!isString(body.question)) return { ok: false, reason: 'question-invalid' };
  if (!isString(body.correctOptionLabel)) {
    return { ok: false, reason: 'correctOptionLabel-invalid' };
  }
  if (!isString(body.selectedOptionLabel)) {
    return { ok: false, reason: 'selectedOptionLabel-invalid' };
  }
  if (!isPositiveInt(body.attemptCount)) {
    return { ok: false, reason: 'attemptCount-invalid' };
  }
  return {
    ok: true,
    input: {
      manipulativeKind: kind as ManipulativeKind,
      question: body.question,
      correctOptionLabel: body.correctOptionLabel,
      selectedOptionLabel: body.selectedOptionLabel,
      attemptCount: body.attemptCount,
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
    const hint = await generateHint(validation.input, { llm: getHintLLM() });
    return Response.json({ hint });
  } catch {
    return Response.json({ error: 'hint-generation-failed' }, { status: 500 });
  }
}
