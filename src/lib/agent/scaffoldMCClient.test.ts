import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchScaffoldedMC, type ScaffoldMCRequest } from './scaffoldMCClient';

const req: ScaffoldMCRequest = {
  beatId: 'chocolate_check',
  manipulativeKind: 'chocolate',
  question: 'How many quarter-pieces covered the half-space?',
  options: [
    { id: 'one', label: 'One' },
    { id: 'two', label: 'Two' },
    { id: 'three', label: 'Three' },
    { id: 'four', label: 'Four' },
  ],
  correctOptionId: 'two',
};

describe('fetchScaffoldedMC', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns the parsed scaffolded MC on success', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          paraphrasedQuestion: 'Count the pieces on the half-tray.',
          reducedOptions: [
            { id: 'two', label: 'Two' },
            { id: 'three', label: 'Three' },
          ],
        }),
        { status: 200 },
      ),
    );
    const result = await fetchScaffoldedMC(req);
    expect(result?.paraphrasedQuestion).toBe(
      'Count the pieces on the half-tray.',
    );
    expect(result?.reducedOptions).toHaveLength(2);
  });

  it('returns null on a non-2xx response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('boom', { status: 500 }),
    );
    expect(await fetchScaffoldedMC(req)).toBeNull();
  });

  it('returns null on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    expect(await fetchScaffoldedMC(req)).toBeNull();
  });

  it('returns null when the response is malformed', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ foo: 'bar' }), { status: 200 }),
    );
    expect(await fetchScaffoldedMC(req)).toBeNull();
  });

  it('returns null when the correct option is missing from the reduction (defense)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          paraphrasedQuestion: 'Count again.',
          reducedOptions: [
            { id: 'one', label: 'One' },
            { id: 'three', label: 'Three' },
          ],
        }),
        { status: 200 },
      ),
    );
    expect(await fetchScaffoldedMC(req)).toBeNull();
  });
});
