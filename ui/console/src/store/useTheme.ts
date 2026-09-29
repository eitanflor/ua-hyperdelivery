import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function resolve(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function apply(mode: ThemeMode): void {
  document.documentElement.dataset.theme = resolve(mode);
}

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

/** Light is the default: it is what renders before this store rehydrates, so it must
 * match the CSS that ships in index.css or the first paint flashes. */
export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "light",
      setMode: (mode) => {
        apply(mode);
        set({ mode });
      },
    }),
    {
      name: "hyperdelivery:theme",
      onRehydrateStorage: () => (state) => apply(state?.mode ?? "light"),
    },
  ),
);

/** Applies the stored theme and keeps `system` following the OS. Call once at boot. */
export function initTheme(): void {
  apply(useTheme.getState().mode);
  window.matchMedia(DARK_QUERY).addEventListener("change", () => {
    if (useTheme.getState().mode === "system") apply("system");
  });
}

function subscribeResolved(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** The theme actually on screen, `system` resolved - what artwork picks its variant by. */
export function useResolvedTheme(): "light" | "dark" {
  return useSyncExternalStore(subscribeResolved, () =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
}
