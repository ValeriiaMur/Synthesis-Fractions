import type {
  ManipulativeKind,
  ScaffoldMCOption,
  ScaffoldedMC,
} from './lessonAgent';
import type { BeatId } from '@/lib/lesson/types';

export type ScaffoldMCRequest = {
  readonly beatId: BeatId;
  readonly manipulativeKind: ManipulativeKind;
  readonly question: string;
  readonly options: readonly ScaffoldMCOption[];
  readonly correctOptionId: string;
};

export type FetchScaffoldedMCOptions = {
  readonly timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 2500;

function isScaffoldedMCPayload(v: unknown): v is ScaffoldedMC {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.paraphrasedQuestion !== 'string') return false;
  if (!Array.isArray(o.reducedOptions) || o.reducedOptions.length !== 2) {
    return false;
  }
  for (const item of o.reducedOptions) {
    if (typeof item !== 'object' || item === null) return false;
    const opt = item as Record<string, unknown>;
    if (typeof opt.id !== 'string' || typeof opt.label !== 'string') {
      return false;
    }
  }
  return true;
}

export async function fetchScaffoldedMC(
  request: ScaffoldMCRequest,
  options: FetchScaffoldedMCOptions = {},
): Promise<ScaffoldedMC | null> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const response = await fetch('/api/agent/scaffold-mc', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (!isScaffoldedMCPayload(data)) return null;
    // Defense in depth: verify the correct option survived the reduction.
    if (!data.reducedOptions.some((o) => o.id === request.correctOptionId)) {
      return null;
    }
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
