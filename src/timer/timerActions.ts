// What should happen, beyond changing timer state, when the user starts the
// timer or a phase runs out. Buttons and keyboard shortcuts both call these,
// so the behaviour is identical either way.

import { playChime, unlockAudio } from '../audio/chime';
import { requestNotificationPermission, showNotification } from '../lib/notifications';
import { useSettingsStore } from '../state/settingsStore';
import { useTimerStore } from '../state/timerStore';
import { PHASE_LABELS } from '../types';

/** Start or resume. Must run inside a click/key handler (unlocks audio). */
export function startTimer(): void {
  unlockAudio();
  if (useSettingsStore.getState().notifications) requestNotificationPermission();
  useTimerStore.getState().start();
}

/** Space bar / main button: start if stopped, pause if running. */
export function toggleTimer(): void {
  const timer = useTimerStore.getState();
  if (timer.status === 'running') timer.pause();
  else startTimer();
}

/** The current phase reached zero: chime, notify, move to the next phase. */
export function handlePhaseEnd(): void {
  const settings = useSettingsStore.getState();
  const finished = useTimerStore.getState().phase;

  useTimerStore.getState().complete();
  const next = useTimerStore.getState().phase;

  playChime(settings.chime, settings.chimeVolume);
  if (settings.notifications) {
    showNotification(
      `${PHASE_LABELS[finished]} finished`,
      next === 'focus' ? 'Time to focus.' : `Time for a ${PHASE_LABELS[next].toLowerCase()}.`,
    );
  }
}
