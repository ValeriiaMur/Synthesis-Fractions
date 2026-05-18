// Server-only. Thin wrapper around ElevenLabs' text-to-speech REST endpoint.
//
// Usage from a Next.js route:
//   const bytes = await synthesizeSpeech(text, { apiKey: process.env.ELEVENLABS_API_KEY! })
//   return new Response(bytes, { headers: { 'content-type': 'audio/mpeg' } })
//
// The fetchImpl + apiKey options are injected for tests.

/** Ari's voice — soft female from ElevenLabs' Conversational category.
 *  Picked from the user's voice library; tied to their account. */
export const DEFAULT_VOICE_ID = 'Nhs7eitvQWFTQBsf0yiT';
/** Flash v2.5 — lowest-latency multilingual model, ideal for in-app dialogue. */
export const DEFAULT_MODEL_ID = 'eleven_flash_v2_5';

export type SynthesizeOptions = {
  readonly apiKey: string;
  readonly voiceId?: string;
  readonly modelId?: string;
  readonly fetchImpl?: typeof fetch;
};

export async function synthesizeSpeech(
  text: string,
  opts: SynthesizeOptions,
): Promise<ArrayBuffer> {
  const voiceId = opts.voiceId ?? DEFAULT_VOICE_ID;
  const modelId = opts.modelId ?? DEFAULT_MODEL_ID;
  const f = opts.fetchImpl ?? fetch;

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const res = await f(url, {
    method: 'POST',
    headers: {
      'xi-api-key': opts.apiKey,
      'content-type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${body.slice(0, 200)}`);
  }

  return res.arrayBuffer();
}
