// The "Sound" panel: mute, master volume, when ambient sound plays, and one
// slider per sound layer for the current weather. It only changes settings;
// useAmbientAudio notices the change and updates what you hear.

import { useState } from 'react';
import { layerLevels, mixKey, resetWeatherMix, shouldPlayAmbient } from '../audio/mix';
import { LAYER_ORDER, SOUND_LAYERS } from '../audio/soundConfig';
import { useTimeOfDay } from '../scene/sceneHooks';
import { WEATHERS } from '../scene/themeConfig';
import { useSettingsStore } from '../state/settingsStore';
import { useTimerStore } from '../state/timerStore';
import type { Settings } from '../types';
import styles from './Mixer.module.css';

const MODES: { id: Settings['ambientMode']; label: string }[] = [
  { id: 'always', label: 'Always' },
  { id: 'focusOnly', label: 'Only during focus' },
  { id: 'off', label: 'Off' },
];

export function Mixer() {
  const s = useSettingsStore();
  const phase = useTimerStore((t) => t.phase);
  const status = useTimerStore((t) => t.status);
  const timeOfDay = useTimeOfDay();
  const [open, setOpen] = useState(false);

  const weather = s.theme.weather;
  const levels = layerLevels(weather, timeOfDay, s.layerVolumes);
  const playing = shouldPlayAmbient(s.ambientMode, s.muted, phase, status);
  const waitingForFocus = !s.muted && s.ambientMode === 'focusOnly' && !playing;

  function setLayer(id: string, value: number) {
    const latest = useSettingsStore.getState().layerVolumes;
    s.update({ layerVolumes: { ...latest, [mixKey(weather, id)]: value } });
  }

  return (
    <section className={styles.panel} aria-label="Sound">
      <div className={styles.header}>
        <h2 className={styles.heading}>Sound</h2>
        <button
          className={s.muted ? styles.toggleOn : styles.toggle}
          aria-pressed={s.muted}
          onClick={() => s.update({ muted: !s.muted })}
        >
          {s.muted ? 'Muted' : 'Mute'}
        </button>
      </div>

      <label className={styles.row}>
        <span>Volume</span>
        <input
          type="range" min={0} max={1} step={0.05}
          value={s.masterVolume}
          onChange={(e) => s.update({ masterVolume: Number(e.target.value) })}
        />
      </label>

      <label className={styles.row}>
        <span>Play</span>
        <select
          className={styles.select}
          value={s.ambientMode}
          onChange={(e) => s.update({ ambientMode: e.target.value as Settings['ambientMode'] })}
        >
          {MODES.map((mode) => (
            <option key={mode.id} value={mode.id}>{mode.label}</option>
          ))}
        </select>
      </label>
      {waitingForFocus && <p className={styles.note}>Sound starts when a focus session is running.</p>}

      <button className={styles.expand} aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? '▾' : '▸'} Mixer for {WEATHERS[weather].label}
      </button>

      {open && (
        <div>
          {LAYER_ORDER.map((id) => (
            <label key={id} className={styles.row}>
              <span className={levels[id] > 0 ? undefined : styles.silent}>{SOUND_LAYERS[id].label}</span>
              <input
                type="range" min={0} max={1} step={0.05}
                value={levels[id]}
                onChange={(e) => setLayer(id, Number(e.target.value))}
              />
            </label>
          ))}
          <button
            className={styles.toggle}
            onClick={() => s.update({ layerVolumes: resetWeatherMix(s.layerVolumes, weather) })}
          >
            Reset this mix
          </button>
        </div>
      )}
    </section>
  );
}
