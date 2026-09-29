import { vi } from "vitest";

// The real client reads an MSAL token, and MSAL needs a browser `window`.
vi.mock("../auth/idToken", () => ({ getIdToken: async () => "tok" }));

// Node's own `localStorage` warns on access, and the store persists on every change.
const data = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => data.get(k) ?? null,
  setItem: (k: string, v: string) => void data.set(k, v),
  removeItem: (k: string) => void data.delete(k),
});
