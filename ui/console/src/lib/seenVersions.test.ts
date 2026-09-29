import { beforeEach, describe, expect, it, vi } from "vitest";

const data = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => data.get(k) ?? null,
  setItem: (k: string, v: string) => void data.set(k, v),
  removeItem: (k: string) => void data.delete(k),
});

const { lastSeenVersion, markSeen } = await import("./seenVersions");

beforeEach(() => data.clear());

describe("seenVersions", () => {
  it("is undefined on a first look, then remembers the version per project and agent", () => {
    expect(lastSeenVersion("p1", "distill")).toBeUndefined();
    markSeen("p1", "distill", 2);
    expect(lastSeenVersion("p1", "distill")).toBe(2);
    expect(lastSeenVersion("p1", "blueprint")).toBeUndefined();
    expect(lastSeenVersion("p2", "distill")).toBeUndefined();
  });

  it("keeps only the 300 most recently seen documents", () => {
    for (let i = 0; i < 305; i++) markSeen(`p${i}`, "distill", 1);
    expect(lastSeenVersion("p0", "distill")).toBeUndefined();
    expect(lastSeenVersion("p5", "distill")).toBe(1);
    expect(lastSeenVersion("p304", "distill")).toBe(1);
  });

  it("recovers from corrupt stored data", () => {
    data.set("hyperdelivery:seen-versions", "{not json");
    expect(lastSeenVersion("p1", "distill")).toBeUndefined();
    markSeen("p1", "distill", 3);
    expect(lastSeenVersion("p1", "distill")).toBe(3);
  });
});
