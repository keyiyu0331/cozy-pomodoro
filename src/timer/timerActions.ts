// Everything the user can do to the timer, in one place. Buttons and keyboard
// shortcuts both call these, so the behaviour is identical either way.
//
// Each action changes the timer state (via timerStore) AND does the things
// around it: open the intention/reflection dialog, save the session to
// history, play the chime, show a notification.

import { playChime, unlockAudio } from '../audio/chime';
import { requestNotificationPermission, showNotification } from '../lib/notifications';
import { buildSessionRecord } from '../lib/sessionRecord';
import { timeOfDayAt } from '../lib/timeOfDay';
import { useHistoryStore } from '../state/historyStore';
import { useSettingsStore } from '../state/settingsStore';
import { useTimerStore } from '../state/timerStore';
import { useUiStore } from '../state/uiStore';
import { PHASE_LABELS, type ActiveSession } from '../types';
import { remainingMs } from './timerEngine';

/** Abandoned sessions shorter than this are not saved (accidental starts). */
const MIN_ABANDONED_MS = 60_000;

function newActiveSession(intention?: string, tagId?: string): ActiveSession {
  const settings = useSettingsStore.getState();
  const { season, weather, timeOfDay } = settings.theme;
  return {
    startedAt: Date.now(),
    plannedMinutes: settings.focusMin,
    intention: intention?.trim() || undefined,
    tagId: tagId || undefined,
    theme: {
      season,
      weather,
      timeOfDay: timeOfDay === 'auto' ? timeOfDayAt(new Date()) : timeOfDay,
    },
  };
}

/** Start or resume the clock. Must run inside a click/key handler (unlocks audio). */
function startClock(): void {
  unlockAudio();
  if (useSettingsStore.getState().notifications) requestNotificationPermission();
  useTimerStore.getState().start();
}

/**
 * If a focus session is in progress, save it to history and forget it.
 * Returns the saved record's id, or null if nothing was saved.
 */
function saveFocusSession(completed: boolean): string | null {
  const timer = useTimerStore.getState();
  const active = timer.activeSession;
  if (timer.phase !== 'focus' || !active) return null;
  timer.setActiveSession(null);

  const now = Date.now();
  const plannedMs = active.plannedMinutes * 60_000;
  const left = remainingMs(timer, plannedMs, now);
  if (!completed && plannedMs - left < MIN_ABANDONED_MS) return null;

  const record = buildSessionRecord(crypto.randomUUID(), active, now, left, completed);
  useHistoryStore.getState().addSession(record);
  return record.id;
}

/** Space bar / main button. */
export function toggleTimer(): void {
  const timer = useTimerStore.getState();
  if (timer.status === 'running') {
    timer.pause();
  } else if (timer.phase === 'focus' && timer.status === 'idle') {
    useUiStore.getState().openIntention(); // ask "What will you focus on?" first
  } else {
    startClock(); // resume, or start a break
  }
}

/** The intention dialog was confirmed: start the focus session. */
export function beginFocus(intention: string, tagId: string | undefined): void {
  useTimerStore.getState().setActiveSession(newActiveSession(intention, tagId));
  useUiStore.getState().closeDialog();
  startClock();
}

export function resetTimer(): void {
  saveFocusSession(false);
  useTimerStore.getState().reset();
}

export function skipTimer(): void {
  saveFocusSession(false);
  useTimerStore.getState().skip();
}

/** The current phase reached zero. */
export function handlePhaseEnd(): void {
  const settings = useSettingsStore.getState();
  const finished = useTimerStore.getState().phase;

  const savedId = saveFocusSession(true);
  useTimerStore.getState().complete();

  const after = useTimerStore.getState();
  if (after.phase === 'focus' && after.status === 'running') {
    // Auto-start went straight into a new focus session, so there was no
    // dialog: carry on with the same intention and tag as last time.
    after.setActiveSession(newActiveSession(after.lastFocus.intention, after.lastFocus.tagId));
  }
  if (savedId) useUiStore.getState().openReflection(savedId); // "How did it go?"

  playChime(settings.chime, settings.chimeVolume);
  if (settings.notifications) {
    showNotification(
      `${PHASE_LABELS[finished]} finished`,
      after.phase === 'focus' ? 'Time to focus.' : `Time for a ${PHASE_LABELS[after.phase].toLowerCase()}.`,
    );
  }
}
