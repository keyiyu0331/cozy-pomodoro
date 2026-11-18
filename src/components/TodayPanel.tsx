// Today's summary: session count, total focus minutes, the list of today's
// sessions, and today's review (with a button to write or edit it).

import { dayKey, formatMinutes, sessionsOnDay, totalMinutes } from '../lib/stats';
import { useHistoryStore } from '../state/historyStore';
import { useUiStore } from '../state/uiStore';
import { ReviewText } from './ReviewText';
import { SessionList } from './SessionList';
import styles from './TodayPanel.module.css';

export function TodayPanel() {
  const sessions = useHistoryStore((s) => s.sessions);
  const reviews = useHistoryStore((s) => s.reviews);
  const openReview = useUiStore((s) => s.openReview);

  const day = dayKey(Date.now());
  const today = sessionsOnDay(sessions, day);
  const completedCount = today.filter((s) => s.completed).length;
  const review = reviews.find((r) => r.date === day);

  return (
    <section className={styles.panel} aria-label="Today">
      <h2 className={styles.heading}>Today</h2>

      <div className={styles.summary}>
        <div>
          <strong>{completedCount}</strong> {completedCount === 1 ? 'session' : 'sessions'}
        </div>
        <div>
          <strong>{formatMinutes(totalMinutes(today))}</strong> focus min
        </div>
      </div>

      {today.length === 0 ? (
        <p className={styles.empty}>No sessions yet today. Press Start to begin one.</p>
      ) : (
        <SessionList sessions={today} />
      )}

      <ReviewText review={review} />
      <button className={styles.button} onClick={() => openReview(day)}>
        {review ? 'Edit today’s review' : 'Write today’s review'}
      </button>
    </section>
  );
}
