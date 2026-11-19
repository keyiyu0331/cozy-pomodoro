// "How did it go?" — shown when a focus session finishes. The session is
// already saved by then; this dialog only adds a mood (Distracted / Neutral /
// Focused) and a note to it.

import { useState, type FormEvent } from 'react';
import { MOODS } from '../lib/moods';
import { useHistoryStore } from '../state/historyStore';
import { useUiStore } from '../state/uiStore';
import type { SessionRecord } from '../types';
import { Dialog } from './Dialog';
import styles from './Dialog.module.css';
import { MoodFace } from './MoodFace';

export function ReflectionDialog({ sessionId }: { sessionId: string }) {
  const session = useHistoryStore((s) => s.sessions.find((r) => r.id === sessionId));
  const updateSession = useHistoryStore((s) => s.updateSession);
  const close = useUiStore((s) => s.closeDialog);

  const [rating, setRating] = useState<SessionRecord['rating']>(undefined);
  const [note, setNote] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateSession(sessionId, { rating, note: note.trim() || undefined });
    close();
  }

  return (
    <Dialog title="How did it go?" onClose={close}>
      <form onSubmit={handleSubmit}>
        {session?.intention && <p className={styles.context}>“{session.intention}”</p>}

        <span className={styles.label}>How focused were you?</span>
        <div className={styles.moods}>
          {MOODS.map((mood) => (
            <button
              key={mood.rating}
              type="button"
              className={rating === mood.rating ? styles.moodOn : styles.mood}
              aria-pressed={rating === mood.rating}
              onClick={() => setRating(rating === mood.rating ? undefined : mood.rating)}
            >
              <MoodFace rating={mood.rating} size={36} />
              {mood.label}
            </button>
          ))}
        </div>

        <label className={styles.label} htmlFor="reflection-note">
          What did you get done / learn?
        </label>
        <textarea
          id="reflection-note"
          className={styles.textarea}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          data-autofocus
        />

        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={close}>
            Skip
          </button>
          <button type="submit" className={styles.primary}>
            Save
          </button>
        </div>
      </form>
    </Dialog>
  );
}
