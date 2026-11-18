// The "almanac": pick the season, weather and time of day. The buttons are
// built from the lists in themeConfig, so new entries there show up here by
// themselves. Weathers that don't suit the season are dimmed but still work.

import { SEASON_ORDER, SEASONS, SKIES, TIME_ORDER, WEATHER_ORDER, WEATHERS } from '../scene/themeConfig';
import { useSettingsStore } from '../state/settingsStore';
import type { Settings } from '../types';
import styles from './ThemePicker.module.css';

type ThemeSetting = Settings['theme'];

export function ThemePicker() {
  const theme = useSettingsStore((s) => s.theme);
  const surprise = useSettingsStore((s) => s.surpriseWeather);
  const suggested = SEASONS[theme.season].suggestedWeather;

  // Read the latest theme at click time, so two quick clicks can't undo each other.
  function set(changes: Partial<ThemeSetting>) {
    const { theme: latest, update } = useSettingsStore.getState();
    update({ theme: { ...latest, ...changes } });
  }

  const times: { id: ThemeSetting['timeOfDay']; label: string }[] = [
    { id: 'auto', label: 'Auto' },
    ...TIME_ORDER.map((id) => ({ id, label: SKIES[id].label })),
  ];

  return (
    <section className={styles.panel} aria-label="Almanac">
      <h2 className={styles.heading}>Almanac</h2>

      <div className={styles.row} role="group" aria-label="Season">
        {SEASON_ORDER.map((id) => (
          <button
            key={id}
            className={theme.season === id ? styles.optionOn : styles.option}
            aria-pressed={theme.season === id}
            onClick={() => set({ season: id })}
          >
            <span className={styles.swatch} style={{ background: SEASONS[id].ground }} />
            {SEASONS[id].label}
          </button>
        ))}
      </div>

      <div className={styles.row} role="group" aria-label="Weather">
        {WEATHER_ORDER.map((id) => {
          const fits = suggested.includes(id);
          const selected = theme.weather === id;
          return (
            <button
              key={id}
              className={`${selected ? styles.optionOn : styles.option} ${fits ? '' : styles.offSeason}`}
              aria-pressed={selected}
              title={fits ? undefined : `Unusual for ${SEASONS[theme.season].label.toLowerCase()}`}
              onClick={() => set({ weather: id })}
            >
              {WEATHERS[id].label}
            </button>
          );
        })}
      </div>

      <div className={styles.row} role="group" aria-label="Time of day">
        {times.map((time) => (
          <button
            key={time.id}
            className={theme.timeOfDay === time.id ? styles.optionOn : styles.option}
            aria-pressed={theme.timeOfDay === time.id}
            onClick={() => set({ timeOfDay: time.id })}
            title={time.id === 'auto' ? 'Follows the real clock' : undefined}
          >
            {time.label}
          </button>
        ))}
      </div>

      <label className={styles.check}>
        <input
          type="checkbox"
          checked={surprise}
          onChange={(e) => useSettingsStore.getState().update({ surpriseWeather: e.target.checked })}
        />
        Surprise me: new weather each focus session
      </label>
    </section>
  );
}
