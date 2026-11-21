// Pure function: what the desktop app's menu bar item should be told about
// the timer. The native side (src-tauri/src/menubar.rs) turns this into the
// text "Focus - 24:22" and the little pie, and does the counting down itself.

import { remainingMs } from '../timer/timerEngine';
import type { TimerState } from '../timer/timerEngine';
import { PHASE_LABELS } from '../types';

export interface MenuBarInfo {
  /** The "Show timer in menu bar" setting. */
  show: boolean;
  /** "Focus", "Short break" or "Long break". */
  label: string;
  /** While running: the clock time the phase ends. Otherwise null. */
  endMs: number | null;
  /** While not running: the time left, which is standing still. */
  remainingMs: number;
  /** Full length of the phase, so the pie knows how full to be. */
  totalMs: number;
  paused: boolean;
}

/** `fullMs` is the full length of the current phase. */
export function menuBarInfo(timer: TimerState, fullMs: number, now: number, show: boolean): MenuBarInfo {
  const running = timer.status === 'running' && timer.endTimestamp !== null;
  return {
    show,
    label: PHASE_LABELS[timer.phase],
    endMs: running ? Math.round(timer.endTimestamp!) : null,
    remainingMs: Math.round(remainingMs(timer, fullMs, now)),
    totalMs: Math.round(fullMs),
    paused: timer.status === 'paused',
  };
}
