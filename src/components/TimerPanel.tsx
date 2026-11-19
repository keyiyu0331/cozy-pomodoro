// The wooden sign with the clock and the Start / Reset / Skip buttons.
// A "dumb" component: it only shows the values it is given and reports
// clicks back through the on... callbacks. It knows nothing about stores.

import type { TimerStatus } from '../timer/timerEngine';
import styles from './TimerPanel.module.css';

interface Props {
  phaseLabel: string;
  status: TimerStatus;
  timeText: string; // already formatted, e.g. "24:59"
  rangeText: string; // clock times from → to, e.g. "11:45 AM → 12:10 PM"
  cycleDone: number; // focus sessions finished in this cycle
  cycleLength: number; // sessions per cycle (long break after the last)
  onToggle: () => void;
  onReset: () => void;
  onSkip: () => void;
}

const TOGGLE_LABEL: Record<TimerStatus, string> = {
  idle: 'Start',
  running: 'Pause',
  paused: 'Resume',
};

export function TimerPanel(props: Props) {
  const dots = Array.from({ length: props.cycleLength }, (_, i) => i < props.cycleDone);

  return (
    <section className={styles.sign} aria-label="Timer">
      <div className={styles.paper}>
        <div className={styles.phase}>{props.phaseLabel}</div>
        {/* Each character sits in its own fixed-width box, so the clock
            doesn't wobble when a narrow "1" replaces a wide "0". */}
        <div className={styles.time} role="timer" aria-label={props.timeText}>
          {[...props.timeText].map((char, i) => (
            <span key={i} className={char === ':' ? styles.colon : styles.digit} aria-hidden="true">
              {char}
            </span>
          ))}
        </div>
        <div
          className={styles.dots}
          aria-label={`${props.cycleDone} of ${props.cycleLength} focus sessions until a long break`}
        >
          {dots.map((filled, i) => (
            <span key={i} className={filled ? styles.dotFilled : styles.dot} />
          ))}
        </div>
        <div className={styles.range} aria-label={`Runs from ${props.rangeText.replace('→', 'to')}`}>
          {props.rangeText}
        </div>
      </div>

      <div className={styles.controls}>
        <button className={styles.primary} onClick={props.onToggle} title="Space">
          {TOGGLE_LABEL[props.status]}
        </button>
        <button className={styles.button} onClick={props.onReset} title="R">
          Reset
        </button>
        <button className={styles.button} onClick={props.onSkip} title="S">
          Skip
        </button>
      </div>

      <p className={styles.hint}>Space start/pause · R reset · S skip</p>
    </section>
  );
}
