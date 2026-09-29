import { describe, expect, it } from "vitest";
import { diffArtifact } from "./diffArtifact";

const req = (id: string, description: string) => ({ id, description });

describe("diffArtifact", () => {
  it("reports nothing for an unknown agent or identical drafts", () => {
    expect(diffArtifact("nope", { title: "a" }, { title: "b" })).toEqual([]);
    const draft = { title: "T", requirements: [req("R1", "one")] };
    expect(diffArtifact("distill", draft, draft)).toEqual([]);
  });

  it("reports added, removed and changed prose fields", () => {
    const changes = diffArtifact("distill", { title: "Old", scope: "s" }, { title: "New", objective: "o" });
    expect(changes).toEqual([
      { section: "Title", id: "title", kind: "changed", before: "Old", after: "New" },
      { section: "Objective", id: "objective", kind: "added", before: undefined, after: "o" },
      { section: "Scope", id: "scope", kind: "removed", before: "s", after: undefined },
    ]);
  });

  it("matches list items by id, so a reword is one change", () => {
    const changes = diffArtifact(
      "distill",
      { requirements: [req("R1", "old"), req("R2", "gone")] },
      { requirements: [req("R1", "new"), req("R3", "fresh")] },
    );
    expect(changes).toEqual([
      { section: "Requirements", id: "R1", kind: "changed", before: "old", after: "new" },
      { section: "Requirements", id: "R3", kind: "added", after: "fresh" },
      { section: "Requirements", id: "R2", kind: "removed", before: "gone" },
    ]);
  });

  it("diffs plain-string lists by value", () => {
    const changes = diffArtifact("distill", { open_questions: ["a", "b"] }, { open_questions: ["b", "c"] });
    expect(changes).toEqual([
      { section: "Open questions", id: "c", kind: "added", after: "c" },
      { section: "Open questions", id: "a", kind: "removed", before: "a" },
    ]);
  });

  it("labels boolean coverage as met / not met", () => {
    const changes = diffArtifact(
      "review",
      { coverage: [{ requirement_id: "R1", met: false }] },
      { coverage: [{ requirement_id: "R1", met: true }] },
    );
    expect(changes).toEqual([
      { section: "Requirement coverage", id: "R1", kind: "changed", before: "not met", after: "met" },
    ]);
  });
});
