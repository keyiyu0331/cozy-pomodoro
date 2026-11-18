// Pure function that turns an in-progress focus session into the
// SessionRecord we save when it ends.

import type { ActiveSession, SessionRecord } from '../types';

/**
 * @param remainingMs time still left on the timer when the session ended
 * @param completed   true if the timer ran out, false if reset/skipped early
 */
export function buildSessionRecord(
  id: string,
  active: ActiveSession,
  endedAt: number,
  remainingMs: number,
  completed: boolean,
): SessionRecord {
  const plannedMs = active.plannedMinutes * 60_000;
  // Focused time = planned minus what was left. Pauses don't count, because
  // the timer's remaining time doesn't move while paused.
  const actualMs = completed ? plannedMs : Math.min(plannedMs, Math.max(0, plannedMs - remainingMs));

  return {
    id,
    startedAt: active.startedAt,
    endedAt,
    plannedMinutes: active.plannedMinutes,
    actualMinutes: Math.round(actualMs / 6000) / 10, // one decimal place
    completed,
    intention: active.intention,
    tagId: active.tagId,
    theme: active.theme,
  };
}
