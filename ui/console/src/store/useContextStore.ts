import { create } from "zustand";
import { api } from "../api/client";
import { describeError, type FriendlyError } from "../lib/errors";

/** The repo, database, design system or conventions every agent should already know -
 * global, like a system prompt, not scoped to any one project. */
interface ContextState {
  context: string;
  updatedBy: string | null;
  updatedAt: string | null;
  loading: boolean;
  error: FriendlyError | null;
  load: () => Promise<void>;
  save: (context: string) => Promise<void>;
  clearError: () => void;
}

export const useContextStore = create<ContextState>()((set) => ({
  context: "",
  updatedBy: null,
  updatedAt: null,
  loading: true,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const result = await api.getContext();
      set({ context: result.context, updatedBy: result.updated_by, updatedAt: result.updated_at });
    } catch (err) {
      set({ error: describeError(err) });
    } finally {
      set({ loading: false });
    }
  },

  save: async (context: string) => {
    set({ error: null });
    try {
      const result = await api.setContext(context);
      set({ context: result.context, updatedBy: result.updated_by, updatedAt: result.updated_at });
    } catch (err) {
      set({ error: describeError(err) });
    }
  },

  clearError: () => set({ error: null }),
}));
