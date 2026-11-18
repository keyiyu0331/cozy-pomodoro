// The calendar heatmap: one little plot of soil per day, 12 weeks across.
// The more you focused that day, the more its crop has grown.
// A "dumb" component: it gets the grid (from lib/stats.ts heatmapWeeks) and
// reports which day was clicked.

import { formatMinutes, parseDay, type HeatCell } from '../lib/stats';
import styles from './Heatmap.module.css';

// Each crop is an 8×8 pixel picture, one string per row:
//   s = soil   g = green   l = light green   f = fruit   . = empty
const CROPS: string[][] = [
  ['........', '........', '........', '........', '........', '........', '.s...s..', 'ssssssss'],
  ['........', '........', '........', '........', '...g....', '..lg....', '.s.g.s..', 'ssssssss'],
  ['........', '........', '...g....', '..lg.l..', '...gg...', '...g....', '.s.g.s..', 'ssssssss'],
  ['........', '..l.g...', '.lg.gl..', '..lggl..', '.l.gg.l.', '..lgg...', '.s.g.s..', 'ssssssss'],
  ['..f.g...', '.lg.gf..', '.fglgl..', '..lggl..', '.l.ggfl.', '..lgg...', '.s.g.s..', 'ssssssss'],
];
const PIXEL_CLASS: Record<string, string> = {
  s: styles.soil,
  g: styles.green,
  l: styles.light,
  f: styles.fruit,
};

/** Draws one crop picture as an SVG of small squares. */
export function Crop({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 8 8" className={styles.crop} shapeRendering="crispEdges" aria-hidden="true">
      {CROPS[level].flatMap((row, y) =>
        [...row].map((pixel, x) =>
          pixel === '.' ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} className={PIXEL_CLASS[pixel]} />
          ),
        ),
      )}
    </svg>
  );
}

function describe(cell: HeatCell): string {
  const date = parseDay(cell.day).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return cell.minutes > 0 ? `${date}: ${formatMinutes(cell.minutes)} min` : `${date}: no focus`;
}

interface Props {
  weeks: HeatCell[][];
  selectedDay: string;
  onSelect: (day: string) => void;
}

export function Heatmap({ weeks, selectedDay, onSelect }: Props) {
  return (
    <div>
      <div className={styles.months} aria-hidden="true">
        {weeks.map((week, i) => {
          // Label a column when its Monday is in a different month from the previous one.
          const month = parseDay(week[0].day).getMonth();
          const changed = i === 0 || parseDay(weeks[i - 1][0].day).getMonth() !== month;
          return (
            <span key={week[0].day}>
              {changed ? parseDay(week[0].day).toLocaleDateString(undefined, { month: 'short' }) : ''}
            </span>
          );
        })}
      </div>

      <div className={styles.grid} role="group" aria-label="Focus per day, last 12 weeks">
        {weeks.flat().map((cell) =>
          cell.future ? (
            <span key={cell.day} className={styles.future} />
          ) : (
            <button
              key={cell.day}
              className={cell.day === selectedDay ? styles.cellSelected : styles.cell}
              title={describe(cell)}
              aria-label={describe(cell)}
              aria-pressed={cell.day === selectedDay}
              onClick={() => onSelect(cell.day)}
            >
              <Crop level={cell.level} />
            </button>
          ),
        )}
      </div>

      <div className={styles.legend}>
        <span>Less</span>
        {CROPS.map((_, level) => (
          <span key={level} className={styles.legendCell}>
            <Crop level={level} />
          </span>
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
