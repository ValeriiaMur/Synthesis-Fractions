import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAdvanceLine, type AdvanceRequest } from './advanceClient';

const req: AdvanceRequest = {
  fromBeatId: 'chocolate_check',
  toBeatId: 'pizza_explore',
  toBeatKindLabel: 'manipulative — moon-pizza',
  studentName: 'Ben',
};

describe('fetchAdvanceLine', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns the line on success', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ advanceLine: 'The moon outpost comes into view.' }),
        { status: 200 },
      ),
    );
    expect(await fetchAdvanceLine(req)).toBe(
      'The moon outpost comes into view.',
    );
  });

  it('returns null on a non-2xx response', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('x', { status: 500 }));
    expect(await fetchAdvanceLine(req)).toBeNull();
  });

  it('returns null on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    expect(await fetchAdvanceLine(req)).toBeNull();
  });

  it('returns null on missing or empty advanceLine', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ advanceLine: '' }), { status: 200 }),
    );
    expect(await fetchAdvanceLine(req)).toBeNull();
  });
});
