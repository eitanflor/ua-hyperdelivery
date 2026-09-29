import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useProjectsStore } from "./useProjectsStore";

export type Role = "requester" | "approver" | "sme" | "analyst" | "developer" | "leadership";

export const ROLES: { value: Role; label: string; prompt: string }[] = [
  { value: "requester", label: "Requester", prompt: "I have something I need built" },
  { value: "approver", label: "Approver", prompt: "I review and approve the work" },
  { value: "sme", label: "Subject expert", prompt: "I answer questions about my area" },
  { value: "analyst", label: "Analyst", prompt: "I read and check the details" },
  { value: "developer", label: "Developer", prompt: "I build or run the line" },
  { value: "leadership", label: "Leadership", prompt: "I keep track of the portfolio" },
];

interface PreferencesState {
  role: Role | null;
  /** Answered or skipped - either way, Home stops asking. */
  roleAsked: boolean;
  /** The first-project kickoff has played in this browser; it is a once-only moment. */
  kickoffSeen: boolean;
  setRole: (role: Role) => void;
  skipRoleQuestion: () => void;
  markKickoffSeen: () => void;
}

/** Per-browser preferences. The role only shapes what Home shows first and the default
 * detail level; it grants nothing, so it does not need the server. */
export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      role: null,
      roleAsked: false,
      kickoffSeen: false,
      setRole: (role) => {
        useProjectsStore.getState().setViewMode(role === "developer" ? "developer" : "pm");
        set({ role, roleAsked: true });
      },
      skipRoleQuestion: () => set({ roleAsked: true }),
      markKickoffSeen: () => set({ kickoffSeen: true }),
    }),
    { name: "hyperdelivery:preferences" },
  ),
);
