// The user's list of tags (categories), saved to localStorage like settings.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TAG_PALETTE, nextTagColor, recolorOldDefaults } from '../lib/tagColors';
import type { Tag } from '../types';

export const DEFAULT_TAGS: Tag[] = [
  { id: 'coursework', name: 'Coursework', color: TAG_PALETTE[0] },
  { id: 'job-prep', name: 'Job prep', color: TAG_PALETTE[1] },
  { id: 'side-project', name: 'Side project', color: TAG_PALETTE[2] },
];

interface TagStore {
  tags: Tag[];
  addTag: () => void;
  updateTag: (id: string, changes: Partial<Omit<Tag, 'id'>>) => void;
  removeTag: (id: string) => void;
  replaceTags: (tags: Tag[]) => void; // used by import and "reset all data"
}

export const useTagStore = create<TagStore>()(
  persist(
    (set) => ({
      tags: DEFAULT_TAGS,
      addTag: () =>
        set((s) => ({
          tags: [...s.tags, { id: crypto.randomUUID(), name: 'New tag', color: nextTagColor(s.tags.length) }],
        })),
      updateTag: (id, changes) =>
        set((s) => ({ tags: s.tags.map((t) => (t.id === id ? { ...t, ...changes } : t)) })),
      removeTag: (id) => set((s) => ({ tags: s.tags.filter((t) => t.id !== id) })),
      replaceTags: (tags) => set({ tags }),
    }),
    {
      name: 'cozy-pomodoro-tags',
      version: 2,
      // Version 1 → 2: the starter tags changed to the new colour palette.
      migrate: (saved, version) => {
        const state = saved as { tags?: Tag[] };
        if (version < 2 && Array.isArray(state.tags)) state.tags = recolorOldDefaults(state.tags);
        return state as TagStore;
      },
    },
  ),
);
