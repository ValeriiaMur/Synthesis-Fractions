import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/agent/generateHint', () => ({
  generateHint: vi.fn(),
}));
vi.mock('@/lib/agent/anthropicClient', () => ({
  getHintLLM: vi.fn(() => ({ invoke: vi.fn() })),
}));

import { POST } from './route';
import { generateHint } from '@/lib/agent/generateHint';

const validBody = {
  manipulativeKind: 'chocolate',
  question: 'How many quarter-pieces covered the half-space?',
  correctOptionLabel: 'Two',
  selectedOptionLabel: 'Three',
  attemptCount: 1,
} as const;

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/agent/hint', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/agent/hint', () => {
  beforeEach(() => {
    vi.mocked(generateHint).mockReset();
  });

  it('returns 200 + { hint } when generateHint succeeds', async () => {
    vi.mocked(generateHint).mockResolvedValue('Look at the chocolate bar.');
    const response = await POST(jsonRequest(validBody));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ hint: 'Look at the chocolate bar.' });
  });

  it('returns 400 when manipulativeKind is missing', async () => {
    const { manipulativeKind: _omit, ...bad } = validBody;
    void _omit;
    const response = await POST(jsonRequest(bad));
    expect(response.status).toBe(400);
  });

  it('returns 400 when manipulativeKind is not one of the three kinds', async () => {
    const response = await POST(jsonRequest({ ...validBody, manipulativeKind: 'donut' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when attemptCount is not a positive integer', async () => {
    const response = await POST(jsonRequest({ ...validBody, attemptCount: 0 }));
    expect(response.status).toBe(400);
  });

  it('returns 500 when generateHint throws', async () => {
    vi.mocked(generateHint).mockRejectedValue(new Error('boom'));
    const response = await POST(jsonRequest(validBody));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'hint-generation-failed' });
  });
});
