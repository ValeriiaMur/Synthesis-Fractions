import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { streamChat, type ChatRequest } from './chatClient';

const sampleReq: ChatRequest = {
  studentName: 'Ben',
  studentMessage: "i'm stuck",
  currentBeatId: 'chocolate_intro',
  currentBeatProse: 'Here is a chocolate bar.',
  currentBeatKindLabel: 'manipulative — chocolate bar',
  manipulativeKind: 'chocolate',
  recentChat: [{ from: 'ari', text: 'Hi Ben.' }],
};

function sseStream(chunks: readonly string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) {
        controller.enqueue(encoder.encode(c));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  });
}

async function collect(it: AsyncIterable<string>): Promise<readonly string[]> {
  const out: string[] = [];
  for await (const t of it) out.push(t);
  return out;
}

describe('streamChat', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('yields tokens in order until [DONE]', async () => {
    vi.mocked(fetch).mockResolvedValue(
      sseStream([
        'data: Tap \n\n',
        'data: two \n\n',
        'data: squares.\n\n',
        'data: [DONE]\n\n',
      ]),
    );
    const tokens = await collect(streamChat(sampleReq));
    expect(tokens.join('')).toBe('Tap two squares.');
  });

  it('handles tokens that arrive split across reader chunks', async () => {
    vi.mocked(fetch).mockResolvedValue(
      sseStream(['data: Tap', ' two\n\n', 'data: more\n\n', 'data: [DONE]\n\n']),
    );
    const tokens = await collect(streamChat(sampleReq));
    expect(tokens).toEqual(['Tap two', 'more']);
  });

  it('yields no tokens and silently ends on a non-2xx response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('error', { status: 500 }),
    );
    const tokens = await collect(streamChat(sampleReq));
    expect(tokens).toEqual([]);
  });

  it('yields no tokens on a network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    const tokens = await collect(streamChat(sampleReq));
    expect(tokens).toEqual([]);
  });

  it('stops yielding as soon as [DONE] is seen, even if more data follows', async () => {
    vi.mocked(fetch).mockResolvedValue(
      sseStream([
        'data: hello\n\n',
        'data: [DONE]\n\n',
        'data: should-not-arrive\n\n',
      ]),
    );
    const tokens = await collect(streamChat(sampleReq));
    expect(tokens).toEqual(['hello']);
  });
});
