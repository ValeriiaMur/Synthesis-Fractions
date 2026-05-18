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
  manipulativeKind: 'chocolate',
  reflectionText: 'The two pieces look the same size as the big piece.',
};

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/agent/classify-reflection', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/agent/classify-reflection', () => {
  beforeEach(() => {
    vi.mocked(runLessonAgent).mockReset();
  });

  it('returns 200 + { category, reaction } when the agent succeeds', async () => {
    vi.mocked(runLessonAgent).mockResolvedValue({
      reflectionCategory: 'on-topic',
      reflectionReaction: 'You noticed two smaller pieces taking up the same room as one bigger piece.',
    });
    const response = await POST(jsonRequest(validBody));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      category: 'on-topic',
      reaction:
        'You noticed two smaller pieces taking up the same room as one bigger piece.',
    });
  });

  it('routes the agent with task=classify_reflection', async () => {
    vi.mocked(runLessonAgent).mockResolvedValue({
      reflectionCategory: 'on-topic',
      reflectionReaction: 'ok',
    });
    await POST(jsonRequest(validBody));
    const [input] = vi.mocked(runLessonAgent).mock.calls[0];
    expect(input.task).toBe('classify_reflection');
  });

  it('returns 400 when reflectionText is empty', async () => {
    const response = await POST(jsonRequest({ ...validBody, reflectionText: '' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when manipulativeKind is invalid', async () => {
    const response = await POST(jsonRequest({ ...validBody, manipulativeKind: 'donut' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when beatId is unknown', async () => {
    const response = await POST(jsonRequest({ ...validBody, beatId: 'not-a-beat' }));
    expect(response.status).toBe(400);
  });

  it('returns 500 when the agent throws', async () => {
    vi.mocked(runLessonAgent).mockRejectedValue(new Error('boom'));
    const response = await POST(jsonRequest(validBody));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'classify-reflection-failed' });
  });
});
