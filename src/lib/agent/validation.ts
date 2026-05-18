// Shared validation primitives used by every /api/agent route. Kept in lib
// so the constants — beat-id and manipulative-kind whitelists — have one
// source of truth that the lesson schema feeds.

import type { BeatId } from '@/lib/lesson/types';
import type { ManipulativeKind } from './lessonAgent';

export const KNOWN_BEAT_IDS: ReadonlyArray<BeatId> = [
  'chocolate_intro',
  'chocolate_check',
  'pizza_explore',
  'pizza_check',
  'paper_fold_final',
  'fraction_box_explore',
];

export const KNOWN_KINDS: ReadonlyArray<ManipulativeKind> = [
  'chocolate',
  'pizza',
  'paper',
  'fractionbox',
];

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

export function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1;
}

export function isKnownBeatId(v: unknown): v is BeatId {
  return typeof v === 'string' && KNOWN_BEAT_IDS.includes(v as BeatId);
}

export function isKnownKind(v: unknown): v is ManipulativeKind {
  return typeof v === 'string' && KNOWN_KINDS.includes(v as ManipulativeKind);
}
