// "What will you focus on?" — shown before a focus session starts.
// Both fields are optional: pressing Enter straight away just starts.

import { useMemo, useState, type FormEvent } from 'react';
import { recentIntentions } from '../lib/stats';
import { useHistoryStore } from '../state/historyStore';
import { useTagStore } from '../state/tagStore';
import { useTimerStore } from '../state/timerStore';
import { useUiStore } from '../state/uiStore';
import { beginFocus } from '../timer/timerActions';
import { Dialog } from './Dialog';
import styles from './Dialog.module.css';

export function IntentionDialog() {
  const sessions = useHistoryStore((s) => s.sessions);
  const tags = useTagStore((s) => s.tags);
  const lastTagId = useTimerStore((s) => s.lastFocus.tagId);
  const close = useUiStore((s) => s.closeDialog);

  const recents = useMemo(() => recentIntentions(sessions), [sessions]);

  const [intention, setIntention] = useState('');
  // Start with the tag used last time, if it still exists.
  const [tagId, setTagId] = useState<string | undefined>(() => {
    const previous = lastTagId ?? sessions[sessions.length - 1]?.tagId;
    return tags.some((t) => t.id === previous) ? previous : undefined;
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    beginFocus(intention, tagId);
  }

  return (
    <Dialog title="What will you focus on?" onClose={close}>
      <form onSubmit={handleSubmit}>
        <input
          className={styles.input}
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder="Optional — e.g. Read chapter 3"
          maxLength={120}
          data-autofocus
          aria-label="Intention"
        />

        {recents.length > 0 && (
          <div className={styles.chips} aria-label="Recent intentions">
            {recents.map((text) => (
              <button key={text} type="button" className={styles.chip} onClick={() => setIntention(text)}>
                {text}
              </button>
            ))}
          </div>
        )}

        {tags.length > 0 && (
          <>
            <span className={styles.label}>Tag (optional)</span>
            <div className={styles.chips}>
              {tags.map((tag) => {
                const selected = tag.id === tagId;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={selected ? styles.chipSelected : styles.chip}
                    aria-pressed={selected}
                    onClick={() => setTagId(selected ? undefined : tag.id)}
                  >
                    <span className={styles.swatch} style={{ background: tag.color }} />
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={close}>
            Cancel
          </button>
          <button type="submit" className={styles.primary}>
            Start focus
          </button>
        </div>
      </form>
    </Dialog>
  );
}
