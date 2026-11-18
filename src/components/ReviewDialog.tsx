// The daily review: "What went well today?" and "What would you improve?".
// Opens by itself at the time set in Settings, or from the Today / History
// panels. Saving with both boxes empty removes the review.

import { useState, type FormEvent } from 'react';
import { formatMinutes, parseDay, sessionsOnDay, totalMinutes } from '../lib/stats';
import { useHistoryStore } from '../state/historyStore';
import { useUiStore } from '../state/uiStore';
import { Dialog } from './Dialog';
import styles from './Dialog.module.css';

export function ReviewDialog({ date }: { date: string }) {
  const sessions = useHistoryStore((s) => s.sessions);
  const existing = useHistoryStore((s) => s.reviews.find((r) => r.date === date));
  const saveReview = useHistoryStore((s) => s.saveReview);
  const close = useUiStore((s) => s.closeDialog);

  const [wentWell, setWentWell] = useState(existing?.wentWell ?? '');
  const [improve, setImprove] = useState(existing?.improve ?? '');

  const daySessions = sessionsOnDay(sessions, date);
  const dateText = parseDay(date).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    saveReview({
      date,
      wentWell: wentWell.trim() || undefined,
      improve: improve.trim() || undefined,
    });
    close();
  }

  return (
    <Dialog title="Daily review" onClose={close}>
      <form onSubmit={handleSubmit}>
        <p className={styles.context}>
          {dateText} · {daySessions.length} {daySessions.length === 1 ? 'session' : 'sessions'} ·{' '}
          {formatMinutes(totalMinutes(daySessions))} min
        </p>

        <label className={styles.label} htmlFor="review-well">
          What went well today?
        </label>
        <textarea
          id="review-well"
          className={styles.textarea}
          value={wentWell}
          onChange={(e) => setWentWell(e.target.value)}
          maxLength={1000}
          data-autofocus
        />

        <label className={styles.label} htmlFor="review-improve">
          What would you improve?
        </label>
        <textarea
          id="review-improve"
          className={styles.textarea}
          value={improve}
          onChange={(e) => setImprove(e.target.value)}
          maxLength={1000}
        />

        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={close}>
            Not now
          </button>
          <button type="submit" className={styles.primary}>
            Save
          </button>
        </div>
      </form>
    </Dialog>
  );
}
