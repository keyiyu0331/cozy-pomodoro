// The app used to be called "hearth", and saved its data in the browser under
// names starting with "hearth-". This file moves that data to the new
// "cozy-pomodoro-" names the first time the renamed app opens, so nothing is
// lost. It is safe to delete once every browser you use has opened the app
// at least once since the rename.

const RENAMED_LOCAL_STORAGE_KEYS: Record<string, string> = {
  'hearth-settings': 'cozy-pomodoro-settings',
  'hearth-tags': 'cozy-pomodoro-tags',
  'hearth-review-prompted': 'cozy-pomodoro-review-prompted',
};

/** Where session history used to live in IndexedDB (moved by historyStore.load). */
export const OLD_HISTORY_KEY = 'hearth-history';

// Runs as soon as this file is imported. main.tsx imports it first, before
// the stores read their saved values.
try {
  for (const [oldKey, newKey] of Object.entries(RENAMED_LOCAL_STORAGE_KEYS)) {
    const value = localStorage.getItem(oldKey);
    if (value === null) continue;
    if (localStorage.getItem(newKey) === null) localStorage.setItem(newKey, value);
    localStorage.removeItem(oldKey);
  }
} catch {
  // No localStorage (e.g. blocked by the browser): nothing to move.
}
