// A list of sessions with their intention, tag, mood and note.
// Used by the Today panel and by the day detail in History.

import { moodFor } from '../lib/moods';
import { formatMinutes } from '../lib/stats';
import { useTagStore } from '../state/tagStore';
import type { SessionRecord } from '../types';
import { MoodFace } from './MoodFace';
import styles from './SessionList.module.css';

function clockTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function SessionList({ sessions }: { sessions: SessionRecord[] }) {
  const tags = useTagStore((s) => s.tags);

  return (
    <ul className={styles.list}>
      {sessions.map((s) => {
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
                <span className={styles.tag}>
                  <MoodFace rating={s.rating} size={12} />
                  {moodFor(s.rating).label}
                </span>
              )}
              {!s.completed && <span className={styles.stopped}>stopped early</span>}
            </div>
            {s.note && <p className={styles.note}>{s.note}</p>}
          </li>
        );
      })}
    </ul>
  );
}
