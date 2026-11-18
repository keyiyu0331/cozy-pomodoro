// The user's list of tags (categories), saved to localStorage like settings.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tag } from '../types';

export const DEFAULT_TAGS: Tag[] = [
  { id: 'coursework', name: 'Coursework', color: '#3d76a6' },
  { id: 'job-prep', name: 'Job prep', color: '#d2603a' },
  { id: 'side-project', name: 'Side project', color: '#4d8a4a' },
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
          tags: [...s.tags, { id: crypto.randomUUID(), name: 'New tag', color: '#8a6bb0' }],
        })),
      updateTag: (id, changes) =>
        set((s) => ({ tags: s.tags.map((t) => (t.id === id ? { ...t, ...changes } : t)) })),
      removeTag: (id) => set((s) => ({ tags: s.tags.filter((t) => t.id !== id) })),
      replaceTags: (tags) => set({ tags }),
    }),
    { name: 'hearth-tags', version: 1 },
  ),
);
