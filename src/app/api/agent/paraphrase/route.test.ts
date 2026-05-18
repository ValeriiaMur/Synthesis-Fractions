import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/agent/lessonAgent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/agent/lessonAgent')>();
  return {
    ...actual,
    runLessonAgent: vi.fn(),
  };
});
vi.mock('@/lib/agent/anthropicClient', () => ({
  getHintLLM: vi.fn(() => ({ invoke: vi.fn() })),
}));

import { POST } from './route';
import { runLessonAgent } from '@/lib/agent/lessonAgent';

const validBody = {
  beatId: 'chocolate_intro',
  originalProse: 'Here is a chocolate bar.',
};

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/agent/paraphrase', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/agent/paraphrase', () => {
  beforeEach(() => {
    vi.mocked(runLessonAgent).mockReset();
  });

  it('returns 200 + { paraphrasedProse } when the agent succeeds', async () => {
    vi.mocked(runLessonAgent).mockResolvedValue({
      paraphrasedProse: 'A chocolate bar sits in front of you.',
    });
    const response = await POST(jsonRequest(validBody));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      paraphrasedProse: 'A chocolate bar sits in front of you.',
    });
  });

  it('routes the agent with task=paraphrase', async () => {
    vi.mocked(runLessonAgent).mockResolvedValue({
      paraphrasedProse: 'rewritten.',
    });
    await POST(jsonRequest(validBody));
    const [input] = vi.mocked(runLessonAgent).mock.calls[0];
    expect(input.task).toBe('paraphrase');
  });

  it('returns 400 when beatId is missing', async () => {
    const { beatId: _omit, ...bad } = validBody;
    void _omit;
    const response = await POST(jsonRequest(bad));
    expect(response.status).toBe(400);
  });

  it('returns 400 when beatId is not a known beat', async () => {
    const response = await POST(jsonRequest({ ...validBody, beatId: 'not-a-beat' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when originalProse is empty', async () => {
    const response = await POST(jsonRequest({ ...validBody, originalProse: '' }));
    expect(response.status).toBe(400);
  });

  it('returns 500 when the agent throws', async () => {
    vi.mocked(runLessonAgent).mockRejectedValue(new Error('boom'));
    const response = await POST(jsonRequest(validBody));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'paraphrase-failed' });
  });
});
