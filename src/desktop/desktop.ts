// Glue between the app and the desktop wrapper (Tauri). Everything here is
// skipped on the website: `isDesktopApp` is false there.
//
// The desktop app adds two things, both done by the native side (src-tauri):
//   - when a phase ends, it brings the window to the front (lib.rs). For that
//     it needs to know when the current phase ends;
//   - it shows the timer in the Mac menu bar (menubar.rs). For that it needs
//     to know the phase, the time left and whether the timer is running.
// So we tell it about the timer whenever something changes.

import { useSettingsStore } from '../state/settingsStore';
import { currentFullMs, useTimerStore } from '../state/timerStore';
import { handlePhaseEnd } from '../timer/timerActions';
import { isFinished } from '../timer/timerEngine';
import { menuBarInfo } from './menuBar';
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

  // Tell the native side what the menu bar item should show.
  let lastMenuBar = '';
  function syncMenuBar(): void {
    const timer = useTimerStore.getState();
    const show = useSettingsStore.getState().menuBarTimer;
    const info = menuBarInfo(timer, currentFullMs(timer), Date.now(), show);
    const message = JSON.stringify(info);
    if (message === lastMenuBar) return; // nothing changed since last time
    lastMenuBar = message;
    void invoke('set_menu_bar', { info });
  }

  function sync(): void {
    syncAlarm();
    syncMenuBar();
  }
  useTimerStore.subscribe(sync);
  useSettingsStore.subscribe(sync);
  sync();

  // The native side says the phase is over: finish it right now, without
  // waiting for the page's own ticker (which macOS may slow down while the
  // window is hidden).
  await listen('phase-alarm', () => {
    if (isFinished(useTimerStore.getState(), Date.now())) handlePhaseEnd();
  });
}
