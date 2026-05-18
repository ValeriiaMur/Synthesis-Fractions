import type { BeatId } from '@/lib/lesson/types';

export type ParaphraseRequest = {
  readonly beatId: BeatId;
  readonly originalProse: string;
};

export type FetchParaphraseOptions = {
  readonly timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 1500;

export async function fetchParaphrase(
  request: ParaphraseRequest,
  options: FetchParaphraseOptions = {},
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const response = await fetch('/api/agent/paraphrase', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (
      typeof data === 'object' &&
      data !== null &&
      'paraphrasedProse' in data &&
      typeof (data as { paraphrasedProse: unknown }).paraphrasedProse === 'string'
    ) {
      return (data as { paraphrasedProse: string }).paraphrasedProse;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
