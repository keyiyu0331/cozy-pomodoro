// The user's settings, kept in a Zustand store and saved to localStorage
// automatically (the `persist` wrapper), so they survive a page reload.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  longBreakEvery: 4,
  autoStart: false,
  notifications: true,
  chime: 'soft',
  chimeVolume: 0.6,
  ambientMode: 'focusOnly',
  layerVolumes: {},
  masterVolume: 0.7,
  muted: false,
  theme: { season: 'spring', weather: 'clear', timeOfDay: 'auto' },
  surpriseWeather: false,
  reducedMotion: false,
  keepHistoryDays: 0,
  popUpWindow: 'focusEnd',
  menuBarTimer: true,
};

interface SettingsStore extends Settings {
  /** Change one or more settings, e.g. update({ focusMin: 50 }). */
  update: (changes: Partial<Settings>) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (changes) => set(changes),
      resetToDefaults: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'cozy-pomodoro-settings', // the localStorage key
      version: 1, // schemaVersion: bump + add a `migrate` function when Settings changes shape
    },
  ),
);
