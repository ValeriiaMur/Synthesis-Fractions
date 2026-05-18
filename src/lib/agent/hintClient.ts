import type { ManipulativeKind } from './generateHint';

export type HintRequest = {
  readonly manipulativeKind: ManipulativeKind;
  readonly question: string;
  readonly correctOptionLabel: string;
  readonly selectedOptionLabel: string;
  readonly attemptCount: number;
};

export type FetchHintOptions = {
  readonly timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 1200;

export async function fetchHint(
  request: HintRequest,
  options: FetchHintOptions = {},
): Promise<string | null> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('/api/agent/hint', {
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
      'hint' in data &&
      typeof (data as { hint: unknown }).hint === 'string'
    ) {
      return (data as { hint: string }).hint;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
