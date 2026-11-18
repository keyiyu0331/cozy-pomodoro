// The settings form. Reads values straight from the settings store and writes
// each change back with update(); the store saves them to localStorage.

import { CHIMES, playChime } from '../audio/chime';
import { requestNotificationPermission } from '../lib/notifications';
import { useSettingsStore } from '../state/settingsStore';
import { NumberField } from './NumberField';
import styles from './SettingsView.module.css';

export function SettingsView() {
  const s = useSettingsStore();
  const blocked = 'Notification' in window && Notification.permission === 'denied';

  return (
    <section className={styles.panel} aria-label="Settings">
      <h2 className={styles.heading}>Durations (minutes)</h2>
      <NumberField label="Focus" value={s.focusMin} min={0.1} max={180}
        onChange={(focusMin) => s.update({ focusMin })} />
      <NumberField label="Short break" value={s.shortBreakMin} min={0.1} max={180}
        onChange={(shortBreakMin) => s.update({ shortBreakMin })} />
      <NumberField label="Long break" value={s.longBreakMin} min={0.1} max={180}
        onChange={(longBreakMin) => s.update({ longBreakMin })} />
      <NumberField label="Long break every … sessions" value={s.longBreakEvery} min={1} max={12}
        onChange={(n) => s.update({ longBreakEvery: Math.round(n) })} />

      <h2 className={styles.heading}>Behaviour</h2>
      <label className={styles.row}>
        <span>Auto-start next phase</span>
        <input type="checkbox" checked={s.autoStart}
          onChange={(e) => s.update({ autoStart: e.target.checked })} />
      </label>
      <label className={styles.row}>
        <span>Notifications</span>
        <input type="checkbox" checked={s.notifications}
          onChange={(e) => {
            s.update({ notifications: e.target.checked });
            if (e.target.checked) requestNotificationPermission();
          }} />
      </label>
      {s.notifications && blocked && (
        <p className={styles.note}>
          Notifications are blocked for this site in your browser settings.
        </p>
      )}

      <h2 className={styles.heading}>Chime</h2>
      <label className={styles.row}>
        <span>Sound</span>
        <select className={styles.select} value={s.chime}
          onChange={(e) => {
            s.update({ chime: e.target.value });
            playChime(e.target.value, s.chimeVolume);
          }}>
          {Object.entries(CHIMES).map(([id, chime]) => (
            <option key={id} value={id}>{chime.label}</option>
          ))}
        </select>
      </label>
      <label className={styles.row}>
        <span>Volume</span>
        <input type="range" min={0} max={1} step={0.05} value={s.chimeVolume}
          onChange={(e) => s.update({ chimeVolume: Number(e.target.value) })} />
      </label>

      <div className={styles.actions}>
        <button className={styles.button} onClick={() => playChime(s.chime, s.chimeVolume)}>
          Test chime
        </button>
        <button className={styles.button} onClick={s.resetToDefaults}>
          Restore defaults
        </button>
      </div>
    </section>
  );
}
