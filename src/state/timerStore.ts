// Holds the live timer state and exposes the actions the UI can call.
// All the actual rules live in timer/timerEngine.ts; this file just feeds the
// engine the current time and settings and stores what it returns.

import { create } from 'zustand';
import * as engine from '../timer/timerEngine';
import type { TimerState } from '../timer/timerEngine';
import { useSettingsStore } from './settingsStore';

interface TimerActions {
  start: () => void; // also resumes from pause
  pause: () => void;
  reset: () => void;
  skip: () => void;
  /** Called when the phase runs out: move on, and auto-start if enabled. */
  complete: () => void;
}

/** Full length of the current phase, read from settings. */
export function currentFullMs(state: TimerState): number {
  return engine.phaseDurationMs(state.phase, useSettingsStore.getState());
}

export const useTimerStore = create<TimerState & TimerActions>()((set) => ({
  ...engine.initialTimerState,

  start: () => set((s) => engine.start(s, currentFullMs(s), Date.now())),
  pause: () => set((s) => engine.pause(s, Date.now())),
  reset: () => set((s) => engine.reset(s)),
  skip: () => set((s) => engine.advance(s, useSettingsStore.getState().longBreakEvery)),

  complete: () =>
    set((s) => {
      const settings = useSettingsStore.getState();
      const next = engine.advance(s, settings.longBreakEvery);
      return settings.autoStart ? engine.start(next, currentFullMs(next), Date.now()) : next;
    }),
}));
