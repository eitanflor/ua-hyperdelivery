import { create } from "zustand";

export interface Notice {
  id: string;
  title: string;
  detail?: string;
  /** Where "Open" goes. Absent for a notice with nothing to open. */
  to?: string;
}

interface NoticesState {
  notices: Notice[];
  push: (notice: Omit<Notice, "id">) => void;
  dismiss: (id: string) => void;
}

/** At most this many receipts on screen - older ones make way rather than stacking up. */
const LIMIT = 3;

/** Receipts for things that finished somewhere the user is not looking. Not errors -
 * those have their own surface (ErrorToast) because they may need action. */
export const useNotices = create<NoticesState>()((set) => ({
  notices: [],
  push: (notice) =>
    set((state) => ({
      notices: [...state.notices, { ...notice, id: crypto.randomUUID() }].slice(-LIMIT),
    })),
  dismiss: (id) => set((state) => ({ notices: state.notices.filter((n) => n.id !== id) })),
}));
