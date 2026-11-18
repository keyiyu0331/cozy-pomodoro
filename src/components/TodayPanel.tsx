// Today's summary: session count, total focus minutes, and the list of
// today's sessions with their intention, tag, rating and note.

import { dayKey, formatMinutes, sessionsOnDay, totalMinutes } from '../lib/stats';
import { useHistoryStore } from '../state/historyStore';
import { useTagStore } from '../state/tagStore';
import styles from './TodayPanel.module.css';

function clockTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function TodayPanel() {
  const sessions = useHistoryStore((s) => s.sessions);
  const tags = useTagStore((s) => s.tags);

  const today = sessionsOnDay(sessions, dayKey(Date.now()));
  const completedCount = today.filter((s) => s.completed).length;

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
        <ul className={styles.list}>
          {today.map((s) => {
            const tag = tags.find((t) => t.id === s.tagId);
            return (
              <li key={s.id} className={styles.item}>
                <div className={styles.line}>
                  <span className={styles.when}>{clockTime(s.startedAt)}</span>
                  <span className={styles.intention}>{s.intention ?? 'Focus session'}</span>
                  <span className={styles.minutes}>{formatMinutes(s.actualMinutes)} min</span>
                </div>
                <div className={styles.meta}>
                  {tag && (
                    <span className={styles.tag}>
                      <span className={styles.swatch} style={{ background: tag.color }} />
                      {tag.name}
                    </span>
                  )}
                  {s.rating && (
                    <span className={styles.rating} aria-label={`${s.rating} of 3 hearts`}>
                      {'♥'.repeat(s.rating)}
                    </span>
                  )}
                  {!s.completed && <span className={styles.stopped}>stopped early</span>}
                </div>
                {s.note && <p className={styles.note}>{s.note}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
