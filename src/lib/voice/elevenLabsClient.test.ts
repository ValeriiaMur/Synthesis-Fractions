import { describe, it, expect, vi } from 'vitest';
import { synthesizeSpeech } from './elevenLabsClient';

function jsonBody(init: RequestInit | undefined): Record<string, unknown> {
  if (!init || typeof init.body !== 'string') {
    throw new Error('expected string body');
  }
  return JSON.parse(init.body) as Record<string, unknown>;
}

describe('synthesizeSpeech', () => {
  it('POSTs to the ElevenLabs TTS endpoint with text + api key and returns the audio bytes', async () => {
    const audio = new Uint8Array([1, 2, 3, 4]);
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(audio, { status: 200, headers: { 'content-type': 'audio/mpeg' } }),
    );

    const bytes = await synthesizeSpeech('hello world', {
      apiKey: 'test-key',
      voiceId: 'voice-x',
      fetchImpl,
    });

    expect(new Uint8Array(bytes)).toEqual(audio);
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/api\.elevenlabs\.io\/v1\/text-to-speech\/voice-x/);
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['xi-api-key']).toBe('test-key');
    expect(headers['content-type']).toBe('application/json');
    expect(headers['accept']).toBe('audio/mpeg');
    expect(jsonBody(init).text).toBe('hello world');
  });

  it('uses the configured conversational default voice and the flash model when not overridden', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(new Uint8Array(), { status: 200 }));
    await synthesizeSpeech('hi', { apiKey: 'k', fetchImpl });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('Nhs7eitvQWFTQBsf0yiT');
    expect(jsonBody(init).model_id).toBe('eleven_flash_v2_5');
  });

  it('throws when the upstream returns a non-2xx response', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response('rate-limited', { status: 429 }));
    await expect(
      synthesizeSpeech('hi', { apiKey: 'k', fetchImpl }),
    ).rejects.toThrow(/429/);
  });
});
