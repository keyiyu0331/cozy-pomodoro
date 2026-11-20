// Glue between the app and the desktop wrapper (Tauri). Everything here is
// skipped on the website: `isDesktopApp` is false there.
//
// The desktop app adds one thing: when a phase ends, the native side (see
// src-tauri/src/lib.rs) brings the window to the front. For that it needs to
// know when the current phase ends, so we tell it whenever that changes.

import { useSettingsStore } from '../state/settingsStore';
import { useTimerStore } from '../state/timerStore';
import { handlePhaseEnd } from '../timer/timerActions';
import { isFinished } from '../timer/timerEngine';
import { shouldPopUp } from './popUp';

/** True when running inside the desktop app rather than a browser. */
export const isDesktopApp = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/** Call once at startup. Does nothing on the website. */
export async function initDesktop(): Promise<void> {
  if (!isDesktopApp) return;
  // Loaded only here, so the website never downloads the desktop-only code.
  const { invoke } = await import('@tauri-apps/api/core');
  const { listen } = await import('@tauri-apps/api/event');

  // Tell the native side when the running phase ends (or that nothing is running).
  let lastSent = '';
  function syncAlarm(): void {
    const timer = useTimerStore.getState();
    const running = timer.status === 'running' && timer.endTimestamp !== null;
    const popUp = shouldPopUp(useSettingsStore.getState().popUpWindow, timer.phase);
    const message = running ? `${timer.endTimestamp}|${popUp}` : 'none';
    if (message === lastSent) return; // nothing changed since last time
    lastSent = message;
    if (running) void invoke('schedule_alarm', { endMs: Math.round(timer.endTimestamp!), popUp });
    else void invoke('cancel_alarm');
  }
  useTimerStore.subscribe(syncAlarm);
  useSettingsStore.subscribe(syncAlarm);
  syncAlarm();

  // The native side says the phase is over: finish it right now, without
  // waiting for the page's own ticker (which macOS may slow down while the
  // window is hidden).
  await listen('phase-alarm', () => {
    if (isFinished(useTimerStore.getState(), Date.now())) handlePhaseEnd();
  });
}
