// The History panel: streak, the calendar heatmap, the weekly chart for the
// selected day's week, and that day's sessions and review.
// It reads the stores, asks lib/stats.ts for the numbers, and passes them to
// the Heatmap and WeekChart components to draw.

import { useState } from 'react';
import { KEEP_HISTORY_OPTIONS } from '../lib/retention';
import {
  addDays,
  currentStreak,
  dayKey,
  formatMinutes,
  heatmapWeeks,
  parseDay,
  sessionsOnDay,
  totalMinutes,
  weekByTag,
  weekStart,
} from '../lib/stats';
import { useHistoryStore } from '../state/historyStore';
import { useSettingsStore } from '../state/settingsStore';
import { useTagStore } from '../state/tagStore';
import { useUiStore } from '../state/uiStore';
import { Heatmap } from './Heatmap';
import styles from './HistoryView.module.css';
import { ReviewText } from './ReviewText';
import { SessionList } from './SessionList';
import panel from './TodayPanel.module.css';
import { WeekChart } from './WeekChart';

function longDate(day: string): string {
  return parseDay(day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

function shortDate(day: string): string {
  return parseDay(day).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function HistoryView() {
  const sessions = useHistoryStore((s) => s.sessions);
  const reviews = useHistoryStore((s) => s.reviews);
  const tags = useTagStore((s) => s.tags);
  const keepDays = useSettingsStore((s) => s.keepHistoryDays);
  const openReview = useUiStore((s) => s.openReview);

  const now = Date.now();
  const today = dayKey(now);
  const [selectedDay, setSelectedDay] = useState(today);

  const streak = currentStreak(sessions, now);
  const monday = weekStart(selectedDay);
  const daySessions = sessionsOnDay(sessions, selectedDay);
  const review = reviews.find((r) => r.date === selectedDay);
  const keepLabel = KEEP_HISTORY_OPTIONS.find((o) => o.days === keepDays)?.label.toLowerCase();

  // The week arrows move the selected day a week at a time (never past today).
  const nextWeekDay = addDays(selectedDay, 7) > today ? today : addDays(selectedDay, 7);
  const onLatestWeek = weekStart(today) === monday;

  return (
    <section className={panel.panel} aria-label="History">
      <h2 className={panel.heading}>History</h2>

      <div className={panel.summary}>
        <div>
          <strong>{streak}</strong> day streak
        </div>
        <div>
          <strong>{formatMinutes(totalMinutes(sessions))}</strong> min in all
        </div>
      </div>

      {keepDays > 0 && (
        <p className={styles.note}>
          History is kept for {keepLabel} (Settings → Data), so older days are empty.
        </p>
      )}

      <h3 className={styles.subheading}>Last 12 weeks</h3>
      <Heatmap weeks={heatmapWeeks(sessions, now)} selectedDay={selectedDay} onSelect={setSelectedDay} />

      <div className={styles.weekNav}>
        <button
          className={styles.arrow}
          aria-label="Previous week"
          onClick={() => setSelectedDay(addDays(selectedDay, -7))}
        >
          ‹
        </button>
        <h3 className={styles.subheading}>
          Week of {shortDate(monday)} – {shortDate(addDays(monday, 6))}
        </h3>
        <button
          className={styles.arrow}
          aria-label="Next week"
          disabled={onLatestWeek}
          onClick={() => setSelectedDay(nextWeekDay)}
        >
          ›
        </button>
      </div>
      <WeekChart bars={weekByTag(sessions, monday)} tags={tags} today={today} />

      <h3 className={styles.subheading}>{longDate(selectedDay)}</h3>
      {daySessions.length === 0 ? (
        <p className={panel.empty}>No sessions this day.</p>
      ) : (
        <>
          <p className={styles.dayTotal}>
            {daySessions.length} {daySessions.length === 1 ? 'session' : 'sessions'} ·{' '}
            {formatMinutes(totalMinutes(daySessions))} min
          </p>
          <SessionList sessions={daySessions} />
        </>
      )}
      <ReviewText review={review} />
      <button className={panel.button} onClick={() => openReview(selectedDay)}>
        {review ? 'Edit review' : 'Write review'}
      </button>
    </section>
  );
}
