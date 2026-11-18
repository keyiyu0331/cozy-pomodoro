// Holds the live timer state and exposes the actions that change it.
// All the actual rules live in timer/timerEngine.ts; this file just feeds the
// engine the current time and settings and stores what it returns.
//
// The UI doesn't call these directly — it goes through timer/timerActions.ts,
// which also handles the dialog, history, chime and notifications.

import { create } from 'zustand';
import * as engine from '../timer/timerEngine';
import type { TimerState } from '../timer/timerEngine';
import type { ActiveSession } from '../types';
import { useSettingsStore } from './settingsStore';

interface TimerExtras {
  /** Details of the focus session in progress (null during breaks / when idle). */
  activeSession: ActiveSession | null;
  /** Intention + tag of the latest focus session, reused when auto-starting. */
  lastFocus: { intention?: string; tagId?: string };
  setActiveSession: (session: ActiveSession | null) => void;

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

export const useTimerStore = create<TimerState & TimerExtras>()((set) => ({
  ...engine.initialTimerState,
  activeSession: null,
  lastFocus: {},

  setActiveSession: (session) =>
    set(
      session
        ? { activeSession: session, lastFocus: { intention: session.intention, tagId: session.tagId } }
        : { activeSession: null },
    ),

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
