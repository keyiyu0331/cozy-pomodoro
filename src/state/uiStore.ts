// Which pop-up dialog (if any) is open right now. Not saved anywhere.

import { create } from 'zustand';

export type OpenDialog =
  | { kind: 'intention' }
  | { kind: 'reflection'; sessionId: string }
  | { kind: 'review'; date: string } // date is "YYYY-MM-DD"
  | null;

interface UiStore {
  dialog: OpenDialog;
  openIntention: () => void;
  openReflection: (sessionId: string) => void;
  openReview: (date: string) => void;
  closeDialog: () => void;
}

export const useUiStore = create<UiStore>()((set) => ({
  dialog: null,
  openIntention: () => set({ dialog: { kind: 'intention' } }),
  openReflection: (sessionId) => set({ dialog: { kind: 'reflection', sessionId } }),
  openReview: (date) => set({ dialog: { kind: 'review', date } }),
  closeDialog: () => set({ dialog: null }),
}));
