import type { BeatId } from '@/lib/lesson/types';

export type AdvanceRequest = {
  readonly fromBeatId: BeatId | null;
  readonly toBeatId: BeatId;
  readonly toBeatKindLabel: string;
  readonly studentName: string;
};

export type FetchAdvanceOptions = {
  readonly timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 1500;

export async function fetchAdvanceLine(
  request: AdvanceRequest,
  options: FetchAdvanceOptions = {},
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const response = await fetch('/api/agent/advance', {
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
      'advanceLine' in data &&
      typeof (data as { advanceLine: unknown }).advanceLine === 'string' &&
      (data as { advanceLine: string }).advanceLine.length > 0
    ) {
      return (data as { advanceLine: string }).advanceLine;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
