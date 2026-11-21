import { describe, expect, it } from 'vitest';
import { initialTimerState } from '../timer/timerEngine';
import { menuBarInfo } from './menuBar';

const FULL = 25 * 60_000;

describe('menuBarInfo', () => {
  it('idle: the full time, standing still', () => {
    expect(menuBarInfo(initialTimerState, FULL, 1000, true)).toEqual({
      show: true, label: 'Focus', endMs: null, remainingMs: FULL, totalMs: FULL, paused: false,
    });
  });

  it('running: passes on the end time so the native side can count down', () => {
    const timer = { ...initialTimerState, status: 'running' as const, endTimestamp: 90_000.4 };
    const info = menuBarInfo(timer, FULL, 30_000, true);
    expect(info.endMs).toBe(90_000);
    expect(info.paused).toBe(false);
  });

  it('paused: the frozen time left, on a break', () => {
    const timer = {
      ...initialTimerState, phase: 'longBreak' as const, status: 'paused' as const, pausedRemainingMs: 61_000,
    };
    const info = menuBarInfo(timer, 15 * 60_000, 0, false);
    expect(info).toMatchObject({ show: false, label: 'Long break', endMs: null, remainingMs: 61_000, paused: true });
  });
});
