import { synthesizeSpeech } from '@/lib/voice/elevenLabsClient';

/** Hard cap on a single utterance — short tutor lines only. Keeps cost
 *  predictable and rejects pathological inputs. */
const MAX_TEXT_LEN = 1000;

type ValidationResult =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly reason: string };

function validate(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, reason: 'body-not-object' };
  }
  const body = raw as Record<string, unknown>;
  if (typeof body.text !== 'string') {
    return { ok: false, reason: 'text-missing' };
  }
  const trimmed = body.text.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: 'text-empty' };
  }
  if (body.text.length > MAX_TEXT_LEN) {
    return { ok: false, reason: 'text-too-long' };
  }
  return { ok: true, text: trimmed };
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

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'tts-not-configured' }, { status: 500 });
  }

  try {
    const bytes = await synthesizeSpeech(validation.text, { apiKey });
    return new Response(bytes, {
      status: 200,
      headers: {
        'content-type': 'audio/mpeg',
        'cache-control': 'private, max-age=86400',
      },
    });
  } catch {
    return Response.json({ error: 'tts-upstream-failed' }, { status: 502 });
  }
}
