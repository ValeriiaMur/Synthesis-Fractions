import { generateHint, type HintInput } from '@/lib/agent/generateHint';
import { getHintLLM } from '@/lib/agent/anthropicClient';
import {
  isKnownKind,
  isNonEmptyString,
  isPositiveInt,
} from '@/lib/agent/validation';

type ValidationResult =
  | { readonly ok: true; readonly input: HintInput }
  | { readonly ok: false; readonly reason: string };

function validate(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, reason: 'body-not-object' };
  }
  const body = raw as Record<string, unknown>;
  if (!isKnownKind(body.manipulativeKind)) {
    return { ok: false, reason: 'manipulativeKind-invalid' };
  }
  if (!isNonEmptyString(body.question)) {
    return { ok: false, reason: 'question-invalid' };
  }
  if (!isNonEmptyString(body.correctOptionLabel)) {
    return { ok: false, reason: 'correctOptionLabel-invalid' };
  }
  if (!isNonEmptyString(body.selectedOptionLabel)) {
    return { ok: false, reason: 'selectedOptionLabel-invalid' };
  }
  if (!isPositiveInt(body.attemptCount)) {
    return { ok: false, reason: 'attemptCount-invalid' };
  }
  return {
    ok: true,
    input: {
      manipulativeKind: body.manipulativeKind,
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
