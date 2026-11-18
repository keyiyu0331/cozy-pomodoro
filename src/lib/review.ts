// The end-of-day review prompt: decides when it is time to ask
// "What went well today?". Pure, plus two tiny helpers that remember (in
// localStorage) that we already asked today, so skipping it doesn't nag.

import { dayKey } from './stats';

/**
 * @param reviewTime  the chosen time as "HH:MM", or undefined if the prompt is off
 * @param promptedDay the last day we showed the prompt ("YYYY-MM-DD"), or null
 */
export function isReviewDue(
  reviewTime: string | undefined,
  now: Date,
  hasReviewToday: boolean,
  promptedDay: string | null,
): boolean {
  if (!reviewTime) return false;
  const match = /^(\d{1,2}):(\d{2})$/.exec(reviewTime);
  if (!match) return false;
  if (hasReviewToday || promptedDay === dayKey(now.getTime())) return false;

  const dueMinutes = Number(match[1]) * 60 + Number(match[2]);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= dueMinutes;
}

const PROMPTED_KEY = 'hearth-review-prompted';

export function getPromptedDay(): string | null {
  try {
    return localStorage.getItem(PROMPTED_KEY);
  } catch {
    return null;
  }
}

export function markPrompted(day: string): void {
  try {
    localStorage.setItem(PROMPTED_KEY, day);
  } catch {
    // Storage unavailable: worst case the prompt shows again after a reload.
  }
}
