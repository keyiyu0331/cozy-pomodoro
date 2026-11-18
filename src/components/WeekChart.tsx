// Bar chart of one week: a bar per day, split into coloured segments by tag.
// A "dumb" component: it gets the numbers (from lib/stats.ts weekByTag) and
// the tag list, and draws them with plain boxes — no chart library.

import { formatMinutes, parseDay, type DayBar } from '../lib/stats';
import type { Tag } from '../types';
import styles from './WeekChart.module.css';

/** Sessions without a tag (or whose tag was deleted) are grouped under this. */
const UNTAGGED: Tag = { id: '', name: 'No tag', color: '#9a8f80' };

interface Props {
  bars: DayBar[];
  tags: Tag[];
  today: string;
}

export function WeekChart({ bars, tags, today }: Props) {
  // Fold minutes for deleted tags into "No tag", so nothing goes missing.
  const known = new Set(tags.map((t) => t.id));
  const series = [...tags, UNTAGGED];
  const minutesFor = (bar: DayBar, tagId: string) =>
    tagId !== ''
      ? (bar.byTag[tagId] ?? 0)
      : Object.entries(bar.byTag)
          .filter(([id]) => !known.has(id))
          .reduce((sum, [, minutes]) => sum + minutes, 0);

  // The tallest bar fills the chart; never zoom in closer than one hour.
  const scaleMax = Math.max(60, ...bars.map((b) => b.total));
  const weekTotals = series
    .map((tag) => ({ tag, minutes: bars.reduce((sum, b) => sum + minutesFor(b, tag.id), 0) }))
    .filter((entry) => entry.minutes > 0);

  return (
    <div>
      <div className={styles.chart} role="img" aria-label="Focus minutes per day this week, by tag">
        {bars.map((bar) => (
          <div key={bar.day} className={styles.column}>
            <span className={styles.value}>{bar.total > 0 ? formatMinutes(bar.total) : ''}</span>
            <div className={styles.track}>
              <div className={styles.bar} style={{ height: `${(bar.total / scaleMax) * 100}%` }}>
                {series.map((tag) => {
                  const minutes = minutesFor(bar, tag.id);
                  if (minutes <= 0) return null;
                  return (
                    <div
                      key={tag.id}
                      className={styles.segment}
                      style={{ flexGrow: minutes, background: tag.color }}
                      title={`${tag.name}: ${formatMinutes(minutes)} min`}
                    />
                  );
                })}
              </div>
            </div>
            <span className={bar.day === today ? styles.dayToday : styles.day}>
              {parseDay(bar.day).toLocaleDateString(undefined, { weekday: 'short' })}
            </span>
          </div>
        ))}
      </div>

      {weekTotals.length === 0 ? (
        <p className={styles.empty}>No focus time this week.</p>
      ) : (
        <ul className={styles.legend}>
          {weekTotals.map(({ tag, minutes }) => (
            <li key={tag.id}>
              <span className={styles.swatch} style={{ background: tag.color }} />
              {tag.name} · {formatMinutes(minutes)} min
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
