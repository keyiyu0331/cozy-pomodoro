// The timer's rules, as pure functions: each one takes the current state (and
// the current time) and returns a NEW state. Nothing here reads the clock,
// touches the screen or plays sound, which is what makes it easy to test.
//
// Accuracy rule (SPEC §3.1): while running we only remember WHEN the phase
// ends (`endTimestamp`). Time left is always "end minus now", so it stays
// correct even if the browser pauses our code in a background tab.

import type { Phase, Settings } from '../types';

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface TimerState {
  phase: Phase;
  status: TimerStatus;
  /** Epoch ms when the current phase ends. Only set while running. */
  endTimestamp: number | null;
  /** Time left, frozen at the moment of pausing. Only set while paused. */
  pausedRemainingMs: number | null;
  /** Epoch ms when the current phase was first started. null until it starts. */
  phaseStartedAt: number | null;
  /** How many focus sessions have ended so far (decides long breaks). */
  focusCount: number;
}

export const initialTimerState: TimerState = {
  phase: 'focus',
  status: 'idle',
  endTimestamp: null,
  pausedRemainingMs: null,
  phaseStartedAt: null,
  focusCount: 0,
};

type Durations = Pick<Settings, 'focusMin' | 'shortBreakMin' | 'longBreakMin'>;

/** Full length of a phase in milliseconds, from the user's settings. */
export function phaseDurationMs(phase: Phase, durations: Durations): number {
  const minutes =
    phase === 'focus'
      ? durations.focusMin
      : phase === 'shortBreak'
        ? durations.shortBreakMin
        : durations.longBreakMin;
  return Math.round(minutes * 60_000);
}

/** Time left in the current phase. `fullMs` is the phase's full length. */
export function remainingMs(state: TimerState, fullMs: number, now: number): number {
  if (state.status === 'running' && state.endTimestamp !== null) {
    return Math.max(0, state.endTimestamp - now);
  }
  if (state.status === 'paused' && state.pausedRemainingMs !== null) {
    return state.pausedRemainingMs;
  }
  return fullMs; // idle: nothing has been used up yet
}

/** True once a running phase has reached its end time. */
export function isFinished(state: TimerState, now: number): boolean {
  return state.status === 'running' && state.endTimestamp !== null && now >= state.endTimestamp;
}

/** Start from idle, or resume from paused. */
export function start(state: TimerState, fullMs: number, now: number): TimerState {
  if (state.status === 'running') return state;
  return {
    ...state,
    status: 'running',
    endTimestamp: now + remainingMs(state, fullMs, now),
    pausedRemainingMs: null,
    // A fresh start sets the start time; resuming from a pause keeps it.
    phaseStartedAt: state.status === 'idle' ? now : state.phaseStartedAt,
  };
}

export function pause(state: TimerState, now: number): TimerState {
  if (state.status !== 'running' || state.endTimestamp === null) return state;
  return {
    ...state,
    status: 'paused',
    endTimestamp: null,
    pausedRemainingMs: Math.max(0, state.endTimestamp - now),
  };
}

/** Back to the full length of the current phase, stopped. */
export function reset(state: TimerState): TimerState {
  return { ...state, status: 'idle', endTimestamp: null, pausedRemainingMs: null, phaseStartedAt: null };
}

/**
 * Which phase follows `phase`. `focusCount` must already include the focus
 * session that just ended.
 */
export function nextPhase(phase: Phase, focusCount: number, longBreakEvery: number): Phase {
  if (phase !== 'focus') return 'focus';
  const every = Math.max(1, Math.floor(longBreakEvery));
  return focusCount % every === 0 ? 'longBreak' : 'shortBreak';
}

/** Move on to the next phase (used when a phase ends and when it is skipped). */
export function advance(state: TimerState, longBreakEvery: number): TimerState {
  const focusCount = state.phase === 'focus' ? state.focusCount + 1 : state.focusCount;
  return {
    phase: nextPhase(state.phase, focusCount, longBreakEvery),
    status: 'idle',
    endTimestamp: null,
    pausedRemainingMs: null,
    phaseStartedAt: null,
    focusCount,
  };
}

/**
 * The clock times the current phase runs from and to, e.g. 11:45 → 12:10.
 *  - not started yet: from now until now + the full length ("if you start now")
 *  - running:         from when it started until its end time
 *  - paused:          from when it started until now + the time left (the end
 *                     keeps sliding later for as long as you stay paused)
 */
export function sessionRange(state: TimerState, fullMs: number, now: number): { start: number; end: number } {
  const end = now + remainingMs(state, fullMs, now);
  if (state.status === 'idle') return { start: now, end };
  return { start: state.phaseStartedAt ?? now, end: state.endTimestamp ?? end };
}

/** 1_500_000 → "25:00". Rounds up so "00:00" only shows when time is truly up. */
export function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
