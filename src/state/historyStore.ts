// Session history and daily reviews. Kept in memory in a Zustand store and
// written to IndexedDB (the browser's larger database) after every change.
// localStorage is fine for small settings but history can grow for years.

import { get as idbGet, set as idbSet } from 'idb-keyval';
import { create } from 'zustand';
import { pruneHistory } from '../lib/retention';
import type { DailyReview, SessionRecord } from '../types';

const DB_KEY = 'hearth-history';
const SCHEMA_VERSION = 1;

interface StoredHistory {
  schemaVersion: number;
  sessions: SessionRecord[];
  reviews: DailyReview[];
}

interface HistoryStore {
  sessions: SessionRecord[];
  reviews: DailyReview[];
  /** true once saved history has been read from IndexedDB. */
  loaded: boolean;
  /** Read saved history from IndexedDB. Call once when the app opens. */
  load: () => Promise<void>;
  addSession: (record: SessionRecord) => void;
  /** Change fields of a saved session (used to add the rating + note). */
  updateSession: (id: string, changes: Partial<SessionRecord>) => void;
  /** Swap in a whole new history (import), or empty arrays (reset). */
  replaceAll: (sessions: SessionRecord[], reviews: DailyReview[]) => void;
  /** Delete everything older than `keepDays` days (0 = keep all). */
  prune: (keepDays: number) => void;
  /** Add or replace the review for its date. An empty review is removed. */
  saveReview: (review: DailyReview) => void;
}

function save(sessions: SessionRecord[], reviews: DailyReview[]): void {
  const data: StoredHistory = { schemaVersion: SCHEMA_VERSION, sessions, reviews };
  idbSet(DB_KEY, data).catch((err) => console.warn('Could not save history', err));
}

export const useHistoryStore = create<HistoryStore>()((set, get) => ({
  sessions: [],
  reviews: [],
  loaded: false,

  load: async () => {
    try {
      const stored = await idbGet<StoredHistory>(DB_KEY);
      if (!stored) return;
      // Keep anything recorded in the instant before loading finished.
      const savedIds = new Set(stored.sessions.map((s) => s.id));
      const fresh = get().sessions.filter((s) => !savedIds.has(s.id));
      set({ sessions: [...stored.sessions, ...fresh], reviews: stored.reviews ?? [] });
    } catch (err) {
      console.warn('Could not load history', err);
    } finally {
      set({ loaded: true });
    }
  },

  addSession: (record) => {
    set((s) => ({ sessions: [...s.sessions, record] }));
    save(get().sessions, get().reviews);
  },

  updateSession: (id, changes) => {
    set((s) => ({
      sessions: s.sessions.map((r) => (r.id === id ? { ...r, ...changes } : r)),
    }));
    save(get().sessions, get().reviews);
  },

  replaceAll: (sessions, reviews) => {
    set({ sessions, reviews });
    save(sessions, reviews);
  },

  saveReview: (review) => {
    const others = get().reviews.filter((r) => r.date !== review.date);
    const empty = !review.wentWell && !review.improve;
    get().replaceAll(get().sessions, empty ? others : [...others, review]);
  },

  prune: (keepDays) => {
    const before = get();
    const kept = pruneHistory(before.sessions, before.reviews, keepDays, Date.now());
    const changed =
      kept.sessions.length !== before.sessions.length || kept.reviews.length !== before.reviews.length;
    if (changed) get().replaceAll(kept.sessions, kept.reviews);
  },
}));
