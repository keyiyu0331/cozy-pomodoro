// Pure helpers that summarise session history: per day, per week, per tag,
// and streaks. Days are always "YYYY-MM-DD" strings in local time.

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

// ---------- calendar helpers ----------

/** "2026-03-07" → a Date at local midnight of that day. */
export function parseDay(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

/** Move a day forwards (or, with a negative n, backwards) by n days. */
export function addDays(day: string, n: number): string {
  const date = parseDay(day);
  date.setDate(date.getDate() + n); // Date handles month ends and clock changes
  return dayKey(date.getTime());
}

/** The Monday of the week that `day` is in. */
export function weekStart(day: string): string {
  const daysSinceMonday = (parseDay(day).getDay() + 6) % 7; // getDay(): Sunday = 0
  return addDays(day, -daysSinceMonday);
}

// ---------- history view ----------

/** Total focused minutes for every day that has sessions. */
export function minutesByDay(sessions: SessionRecord[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const s of sessions) {
    const day = dayKey(s.startedAt);
    totals[day] = (totals[day] ?? 0) + s.actualMinutes;
  }
  return totals;
}

/** How "grown" a day's crop is: 0 = bare soil ... 4 = bearing fruit. */
export function growthLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 25) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

export interface HeatCell {
  day: string;
  minutes: number;
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean; // later this week — nothing to show yet
}

/**
 * The calendar heatmap: the last `weeks` weeks, oldest first, ending with the
 * current week. Each week is 7 cells, Monday to Sunday.
 */
export function heatmapWeeks(sessions: SessionRecord[], now: number, weeks = 12): HeatCell[][] {
  const totals = minutesByDay(sessions);
  const today = dayKey(now);
  const firstMonday = addDays(weekStart(today), -7 * (weeks - 1));
  const grid: HeatCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const week: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const day = addDays(firstMonday, w * 7 + d);
      const minutes = Math.round((totals[day] ?? 0) * 10) / 10;
      week.push({ day, minutes, level: growthLevel(minutes), future: day > today });
    }
    grid.push(week);
  }
  return grid;
}

export interface DayBar {
  day: string;
  total: number;
  /** Minutes per tag id. Sessions without a tag are under the key ''. */
  byTag: Record<string, number>;
}

/** Minutes per tag for each of the 7 days of the week starting on `monday`. */
export function weekByTag(sessions: SessionRecord[], monday: string): DayBar[] {
  const bars: DayBar[] = [];
  for (let d = 0; d < 7; d++) bars.push({ day: addDays(monday, d), total: 0, byTag: {} });
  for (const s of sessions) {
    const bar = bars.find((b) => b.day === dayKey(s.startedAt));
    if (!bar) continue;
    const key = s.tagId ?? '';
    bar.byTag[key] = (bar.byTag[key] ?? 0) + s.actualMinutes;
    bar.total += s.actualMinutes;
  }
  return bars;
}

/**
 * How many days in a row have at least one completed session, counting back
 * from today. A day that isn't over yet doesn't break the streak: if today
 * has none, the count starts from yesterday.
 */
export function currentStreak(sessions: SessionRecord[], now: number): number {
  const days = new Set(sessions.filter((s) => s.completed).map((s) => dayKey(s.startedAt)));
  let day = dayKey(now);
  if (!days.has(day)) day = addDays(day, -1);
  let streak = 0;
  while (days.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}
