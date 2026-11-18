// Export / import / reset buttons. Lives inside Settings. The real work is
// in lib/backup.ts; this only handles the buttons, file picker and messages.

import { useRef, useState, type ChangeEvent } from 'react';
import { exportAll, importAll, resetAll } from '../lib/backup';
import styles from './SettingsView.module.css';

export function DataSection() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // so picking the same file again still fires onChange
    if (!file) return;
    if (!window.confirm('Importing replaces all current sessions, tags and settings. Continue?')) return;
    try {
      const count = importAll(await file.text());
      setMessage(`Imported ${count} session${count === 1 ? '' : 's'}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Import failed.');
    }
  }

  function handleReset() {
    if (!window.confirm('Delete ALL sessions, tags and settings? This cannot be undone.')) return;
    resetAll();
    setMessage('All data reset.');
  }

  return (
    <div>
      <div className={styles.actions}>
        <button className={styles.button} onClick={exportAll}>
          Export JSON
        </button>
        <button className={styles.button} onClick={() => fileInput.current?.click()}>
          Import JSON
        </button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={handleFile}
      />
      <div className={styles.actions}>
        <button className={styles.dangerButton} onClick={handleReset}>
          Reset all data
        </button>
      </div>
      {message && (
        <p className={styles.note} role="status">
          {message}
        </p>
      )}
    </div>
  );
}
