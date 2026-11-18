// Pure helpers that summarise session history. (Phase 5 adds per-tag and
// per-week numbers here.)

import type { SessionRecord } from '../types';

/** Local calendar day of a timestamp, as "YYYY-MM-DD". */
export function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Sessions that started on the given day, oldest first. */
export function sessionsOnDay(sessions: SessionRecord[], day: string): SessionRecord[] {
  return sessions
    .filter((s) => dayKey(s.startedAt) === day)
    .sort((a, b) => a.startedAt - b.startedAt);
}

/** Total focused minutes (abandoned sessions count for the time they ran). */
export function totalMinutes(sessions: SessionRecord[]): number {
  const sum = sessions.reduce((total, s) => total + s.actualMinutes, 0);
  return Math.round(sum * 10) / 10;
}

/** The most recently used intentions, newest first, without repeats. */
export function recentIntentions(sessions: SessionRecord[], limit = 5): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const newestFirst = [...sessions].sort((a, b) => b.startedAt - a.startedAt);
  for (const s of newestFirst) {
    const text = s.intention?.trim();
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    result.push(text);
    if (result.length >= limit) break;
  }
  return result;
}

/** 25 → "25", 0.1 → "0.1", 12.4 → "12". Keeps a decimal only for tiny values. */
export function formatMinutes(minutes: number): string {
  return minutes < 10 && !Number.isInteger(minutes) ? minutes.toFixed(1) : String(Math.round(minutes));
}
