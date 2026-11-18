// React hook that opens the daily review dialog by itself once the time set
// in Settings has passed. Call it once, in App.
//
// It waits for a quiet moment: never while a focus session is running or
// another dialog is open. It asks at most once a day (see lib/review.ts).

import { useEffect, useState } from 'react';
import { useHistoryStore } from '../state/historyStore';
import { useSettingsStore } from '../state/settingsStore';
import { useTimerStore } from '../state/timerStore';
import { useUiStore } from '../state/uiStore';
import { getPromptedDay, isReviewDue, markPrompted } from './review';
import { dayKey } from './stats';

export function useReviewPrompt(): void {
  const reviewTime = useSettingsStore((s) => s.reviewTime);
  const loaded = useHistoryStore((s) => s.loaded);
  const reviews = useHistoryStore((s) => s.reviews);
  const dialogOpen = useUiStore((s) => s.dialog !== null);
  const focusing = useTimerStore((s) => s.phase === 'focus' && s.status === 'running');

  // Re-check the clock every 30 seconds.
  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setClockTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!loaded || dialogOpen || focusing) return;
    const now = new Date();
    const today = dayKey(now.getTime());
    const hasReviewToday = reviews.some((r) => r.date === today);
    if (!isReviewDue(reviewTime, now, hasReviewToday, getPromptedDay())) return;
    markPrompted(today);
    useUiStore.getState().openReview(today);
  }, [reviewTime, loaded, reviews, dialogOpen, focusing, clockTick]);
}
