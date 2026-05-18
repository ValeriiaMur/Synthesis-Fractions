import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/voice/elevenLabsClient', () => ({
  synthesizeSpeech: vi.fn(),
  DEFAULT_VOICE_ID: '21m00Tcm4TlvDq8ikWAM',
  DEFAULT_MODEL_ID: 'eleven_flash_v2_5',
}));

import { POST } from './route';
import { synthesizeSpeech } from '@/lib/voice/elevenLabsClient';

const mockedSynth = synthesizeSpeech as unknown as ReturnType<typeof vi.fn>;

function postJSON(body: unknown): Request {
  return new Request('http://localhost/api/tts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/tts', () => {
  beforeEach(() => {
    mockedSynth.mockReset();
    process.env.ELEVENLABS_API_KEY = 'test-key';
  });

  it('returns audio/mpeg bytes from the synthesizer', async () => {
    const audio = new Uint8Array([10, 20, 30]).buffer;
    mockedSynth.mockResolvedValue(audio);

    const res = await POST(postJSON({ text: 'hello' }));

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('audio/mpeg');
    const body = new Uint8Array(await res.arrayBuffer());
    expect(Array.from(body)).toEqual([10, 20, 30]);
    expect(mockedSynth).toHaveBeenCalledOnce();
    expect(mockedSynth.mock.calls[0][0]).toBe('hello');
  });

  it('rejects empty / whitespace text with 400', async () => {
    const res = await POST(postJSON({ text: '   ' }));
    expect(res.status).toBe(400);
    expect(mockedSynth).not.toHaveBeenCalled();
  });

  it('rejects oversized text with 400 (keeps cost predictable)', async () => {
    const huge = 'a'.repeat(1001);
    const res = await POST(postJSON({ text: huge }));
    expect(res.status).toBe(400);
    expect(mockedSynth).not.toHaveBeenCalled();
  });

  it('returns 400 on invalid JSON', async () => {
    const req = new Request('http://localhost/api/tts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 500 when ELEVENLABS_API_KEY is missing', async () => {
    delete process.env.ELEVENLABS_API_KEY;
    const res = await POST(postJSON({ text: 'hi' }));
    expect(res.status).toBe(500);
    expect(mockedSynth).not.toHaveBeenCalled();
  });

  it('returns 502 when the upstream synthesizer throws', async () => {
    mockedSynth.mockRejectedValue(new Error('boom'));
    const res = await POST(postJSON({ text: 'hi' }));
    expect(res.status).toBe(502);
  });
});
