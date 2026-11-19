import { describe, expect, it } from 'vitest';
import {
  advance,
  formatTime,
  initialTimerState,
  isFinished,
  nextPhase,
  pause,
  phaseDurationMs,
  remainingMs,
  reset,
  sessionRange,
  start,
  type TimerState,
} from './timerEngine';

const MIN = 60_000;
const FULL = 25 * MIN;
const T0 = 1_000_000; // an arbitrary "now"

describe('phaseDurationMs', () => {
  const durations = { focusMin: 25, shortBreakMin: 5, longBreakMin: 15 };
  it('converts each phase from minutes to ms', () => {
    expect(phaseDurationMs('focus', durations)).toBe(25 * MIN);
    expect(phaseDurationMs('shortBreak', durations)).toBe(5 * MIN);
    expect(phaseDurationMs('longBreak', durations)).toBe(15 * MIN);
  });
});

describe('start / remainingMs', () => {
  it('shows the full duration while idle', () => {
    expect(remainingMs(initialTimerState, FULL, T0)).toBe(FULL);
  });

  it('stores an end timestamp instead of counting down', () => {
    const running = start(initialTimerState, FULL, T0);
    expect(running.status).toBe('running');
    expect(running.endTimestamp).toBe(T0 + FULL);
  });

  it('stays accurate after 10 minutes with no ticks at all (background tab)', () => {
    const running = start(initialTimerState, FULL, T0);
    expect(remainingMs(running, FULL, T0 + 10 * MIN)).toBe(15 * MIN);
  });

  it('never goes below zero', () => {
    const running = start(initialTimerState, FULL, T0);
    expect(remainingMs(running, FULL, T0 + 60 * MIN)).toBe(0);
  });

  it('does nothing if already running', () => {
    const running = start(initialTimerState, FULL, T0);
    expect(start(running, FULL, T0 + 5000)).toBe(running);
  });
});

describe('pause / resume', () => {
  it('freezes the remaining time while paused', () => {
    const running = start(initialTimerState, FULL, T0);
    const paused = pause(running, T0 + 10 * MIN);
    expect(paused.status).toBe('paused');
    expect(paused.endTimestamp).toBeNull();
    // An hour later, still 15 minutes left.
    expect(remainingMs(paused, FULL, T0 + 70 * MIN)).toBe(15 * MIN);
  });

  it('resumes from where it was paused', () => {
    const paused = pause(start(initialTimerState, FULL, T0), T0 + 10 * MIN);
    const resumed = start(paused, FULL, T0 + 70 * MIN);
    expect(resumed.endTimestamp).toBe(T0 + 70 * MIN + 15 * MIN);
  });

  it('ignores pause when not running', () => {
    expect(pause(initialTimerState, T0)).toBe(initialTimerState);
  });
});

describe('reset', () => {
  it('returns to idle with the full duration, keeping phase and count', () => {
    const running: TimerState = { ...start(initialTimerState, FULL, T0), focusCount: 2 };
    const state = reset(running);
    expect(state.status).toBe('idle');
    expect(state.phase).toBe('focus');
    expect(state.focusCount).toBe(2);
    expect(remainingMs(state, FULL, T0 + 5 * MIN)).toBe(FULL);
  });
});

describe('isFinished', () => {
  it('is true only when running and past the end', () => {
    const running = start(initialTimerState, FULL, T0);
    expect(isFinished(running, T0 + FULL - 1)).toBe(false);
    expect(isFinished(running, T0 + FULL)).toBe(true);
    expect(isFinished(initialTimerState, T0 + FULL)).toBe(false);
    expect(isFinished(pause(running, T0 + 1000), T0 + 2 * FULL)).toBe(false);
  });
});

describe('nextPhase', () => {
  it('goes back to focus after any break', () => {
    expect(nextPhase('shortBreak', 1, 4)).toBe('focus');
    expect(nextPhase('longBreak', 4, 4)).toBe('focus');
  });

  it('gives a long break after every Nth focus, short otherwise', () => {
    expect(nextPhase('focus', 1, 4)).toBe('shortBreak');
    expect(nextPhase('focus', 3, 4)).toBe('shortBreak');
    expect(nextPhase('focus', 4, 4)).toBe('longBreak');
    expect(nextPhase('focus', 5, 4)).toBe('shortBreak');
    expect(nextPhase('focus', 8, 4)).toBe('longBreak');
  });

  it('survives a nonsense interval', () => {
    expect(nextPhase('focus', 1, 0)).toBe('longBreak');
  });
});

describe('advance', () => {
  it('walks through a full default cycle', () => {
    let state = initialTimerState;
    const seen: string[] = [];
    for (let i = 0; i < 8; i++) {
      state = advance(state, 4);
      seen.push(state.phase);
    }
    expect(seen).toEqual([
      'shortBreak', 'focus', 'shortBreak', 'focus',
      'shortBreak', 'focus', 'longBreak', 'focus',
    ]);
    expect(state.focusCount).toBe(4);
  });

  it('leaves the timer idle and cleared', () => {
    const state = advance(start(initialTimerState, FULL, T0), 4);
    expect(state.status).toBe('idle');
    expect(state.endTimestamp).toBeNull();
    expect(state.pausedRemainingMs).toBeNull();
  });
});

describe('formatTime', () => {
  it('formats as mm:ss', () => {
    expect(formatTime(25 * MIN)).toBe('25:00');
    expect(formatTime(61_000)).toBe('01:01');
    expect(formatTime(0)).toBe('00:00');
  });

  it('rounds partial seconds up', () => {
    expect(formatTime(25 * MIN - 1)).toBe('25:00');
    expect(formatTime(1)).toBe('00:01');
  });

  it('handles more than an hour and negatives', () => {
    expect(formatTime(90 * MIN)).toBe('90:00');
    expect(formatTime(-500)).toBe('00:00');
  });
});

describe('phaseStartedAt', () => {
  it('is set on a fresh start and kept through pause and resume', () => {
    const running = start(initialTimerState, FULL, T0);
    expect(running.phaseStartedAt).toBe(T0);
    const paused = pause(running, T0 + 5 * MIN);
    expect(paused.phaseStartedAt).toBe(T0);
    expect(start(paused, FULL, T0 + 9 * MIN).phaseStartedAt).toBe(T0);
  });

  it('is cleared by reset and when moving to the next phase', () => {
    const running = start(initialTimerState, FULL, T0);
    expect(reset(running).phaseStartedAt).toBeNull();
    expect(advance(running, 4).phaseStartedAt).toBeNull();
  });
});

describe('sessionRange', () => {
  it('before starting: from now until now + the full length', () => {
    expect(sessionRange(initialTimerState, FULL, T0)).toEqual({ start: T0, end: T0 + FULL });
    expect(sessionRange(initialTimerState, FULL, T0 + MIN)).toEqual({ start: T0 + MIN, end: T0 + MIN + FULL });
  });

  it('while running: fixed, from the start time to the end time', () => {
    const running = start(initialTimerState, FULL, T0);
    expect(sessionRange(running, FULL, T0 + 10 * MIN)).toEqual({ start: T0, end: T0 + FULL });
  });

  it('while paused: the end slides later, the start stays', () => {
    const paused = pause(start(initialTimerState, FULL, T0), T0 + 10 * MIN); // 15 min left
    expect(sessionRange(paused, FULL, T0 + 10 * MIN)).toEqual({ start: T0, end: T0 + FULL });
    expect(sessionRange(paused, FULL, T0 + 20 * MIN)).toEqual({ start: T0, end: T0 + 35 * MIN });
  });

  it('after resuming: ends later by however long the pause was', () => {
    const paused = pause(start(initialTimerState, FULL, T0), T0 + 10 * MIN);
    const resumed = start(paused, FULL, T0 + 14 * MIN); // paused for 4 minutes
    expect(sessionRange(resumed, FULL, T0 + 15 * MIN)).toEqual({ start: T0, end: T0 + FULL + 4 * MIN });
  });
});
