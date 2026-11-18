// Glue between the stores and lib/storage.ts: gathers everything for an
// export file, and puts imported data back into the stores.

import { DEFAULT_SETTINGS, useSettingsStore } from '../state/settingsStore';
import { useHistoryStore } from '../state/historyStore';
import { DEFAULT_TAGS, useTagStore } from '../state/tagStore';
import { useTimerStore } from '../state/timerStore';
import type { Settings } from '../types';
import { buildExport, parseImport } from './storage';
import { dayKey } from './stats';

/** Just the Settings fields of the settings store (drops its functions). */
function currentSettings(): Settings {
  const { update: _update, resetToDefaults: _reset, ...settings } = useSettingsStore.getState();
  return settings;
}

/** Download every piece of app data as hearth-backup-YYYY-MM-DD.json. */
export function exportAll(): void {
  const history = useHistoryStore.getState();
  const file = buildExport(
    {
      settings: currentSettings(),
      tags: useTagStore.getState().tags,
      sessions: history.sessions,
      reviews: history.reviews,
    },
    Date.now(),
  );
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hearth-backup-${dayKey(Date.now())}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Replace all app data with the contents of an export file.
 * Returns how many sessions were imported; throws if the file is invalid.
 */
export function importAll(text: string): number {
  const file = parseImport(text, DEFAULT_SETTINGS);
  useSettingsStore.getState().update(file.settings);
  useTagStore.getState().replaceTags(file.tags);
  useHistoryStore.getState().replaceAll(file.sessions, file.reviews);
  useHistoryStore.getState().prune(file.settings.keepHistoryDays);
  return file.sessions.length;
}

/** Wipe history, tags and settings back to a fresh install. */
export function resetAll(): void {
  useTimerStore.getState().setActiveSession(null);
  useTimerStore.getState().reset();
  useHistoryStore.getState().replaceAll([], []);
  useTagStore.getState().replaceTags(DEFAULT_TAGS);
  useSettingsStore.getState().resetToDefaults();
}
