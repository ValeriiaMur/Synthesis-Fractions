import type { BeatId } from '@/lib/lesson/types';
import type {
  ManipulativeKind,
  ReflectionCategory,
} from './lessonAgent';

export type ReflectionRequest = {
  readonly beatId: BeatId;
  readonly manipulativeKind: ManipulativeKind;
  readonly reflectionText: string;
};

export type ReflectionResult = {
  readonly category: ReflectionCategory;
  readonly reaction: string;
};

export type FetchReflectionOptions = {
  readonly timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 1500;
const KNOWN_CATEGORIES: ReadonlyArray<ReflectionCategory> = [
  'on-topic',
  'partial',
  'off-topic',
];

function parseBody(data: unknown): ReflectionResult | null {
  if (typeof data !== 'object' || data === null) return null;
  const record = data as Record<string, unknown>;
  if (
    typeof record.category !== 'string' ||
    !KNOWN_CATEGORIES.includes(record.category as ReflectionCategory)
  ) {
    return null;
  }
  if (typeof record.reaction !== 'string' || record.reaction.length === 0) {
    return null;
  }
  return {
    category: record.category as ReflectionCategory,
    reaction: record.reaction,
  };
}

export async function fetchReflectionReaction(
  request: ReflectionRequest,
  options: FetchReflectionOptions = {},
): Promise<ReflectionResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const response = await fetch('/api/agent/classify-reflection', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    return parseBody(data);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
