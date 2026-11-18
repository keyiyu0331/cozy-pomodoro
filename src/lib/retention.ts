// "Keep history for N days": works out which sessions and reviews are old
// enough to delete. Pure — it returns new lists and deletes nothing itself.

import type { DailyReview, SessionRecord } from '../types';
import { dayKey } from './stats';

/** Choices offered in Settings. 0 means keep everything. */
export const KEEP_HISTORY_OPTIONS: { days: number; label: string }[] = [
  { days: 1, label: 'Today only' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 0, label: 'Forever' },
];

/**
 * Keep only the last `keepDays` calendar days, counting today as day 1.
 * So keepDays = 1 keeps today only; keepDays = 0 keeps everything.
 */
export function pruneHistory(
  sessions: SessionRecord[],
  reviews: DailyReview[],
  keepDays: number,
  now: number,
): { sessions: SessionRecord[]; reviews: DailyReview[] } {
  if (!(keepDays > 0)) return { sessions, reviews };

  const oldest = new Date(now);
  oldest.setHours(0, 0, 0, 0);
  oldest.setDate(oldest.getDate() - (Math.floor(keepDays) - 1));
  const oldestDay = dayKey(oldest.getTime()); // "YYYY-MM-DD" strings sort correctly

  return {
    sessions: sessions.filter((s) => dayKey(s.startedAt) >= oldestDay),
    reviews: reviews.filter((r) => r.date >= oldestDay),
  };
}
