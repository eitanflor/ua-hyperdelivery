import { describe, expect, it } from "vitest";
import { callSources, gerund, narrate, summarizeCalls, toolCallLabel } from "./narration";

describe("gerund", () => {
  it("doubles the final consonant for the listed verbs", () => {
    expect(gerund("Get")).toBe("Getting");
    expect(gerund("run")).toBe("running");
  });

  it("drops a trailing e, but not after another e, o or y", () => {
    expect(gerund("Create")).toBe("Creating");
    expect(gerund("See")).toBe("Seeing");
    expect(gerund("Tie")).toBe("Tying");
  });

  it("just adds ing otherwise", () => {
    expect(gerund("Read")).toBe("Reading");
    expect(gerund("Write")).toBe("Writing");
  });
});

describe("narrate", () => {
  it("names the file for a path argument and strips the upload prefix", () => {
    const key = `uploads/p1/${"a".repeat(32)}-line-plan.docx`;
    expect(narrate({ name: "get_file_contents", input: { path: key } })).toBe("Reading line-plan.docx");
  });

  it("quotes a search query", () => {
    expect(narrate({ name: "search_code", input: { query: "size run" } })).toBe("Searching code for “size run”");
  });

  it("puts other arguments after a dot, and clips long ones", () => {
    expect(narrate({ name: "create_branch", input: { branch: "feat/x" } })).toBe("Creating branch · feat/x");
    expect(narrate({ name: "create_branch", input: { branch: "b".repeat(60) } })).toMatch(/…$/);
  });

  it("uses the label alone when the arguments say nothing", () => {
    expect(narrate({ name: "list_things", input: { unrelated: 1 } })).toBe("Listing things");
    expect(narrate({ name: "list_things", input: undefined })).toBe("Listing things");
  });

  it("turns every verb of a compound label into -ing", () => {
    expect(narrate({ name: "issue_write", input: {} })).toBe("Creating or updating issue");
  });
});

describe("toolCallLabel", () => {
  it("returns the most identifying argument, or null", () => {
    expect(toolCallLabel({ query: "q", path: "p" })).toBe("p");
    expect(toolCallLabel({ name: "  n  " })).toBe("n");
    expect(toolCallLabel({ path: "  " })).toBeNull();
    expect(toolCallLabel(undefined)).toBeNull();
  });
});

describe("callSources", () => {
  it("lists distinct file names read, skipping failures and non-path targets", () => {
    const sources = callSources([
      { status: "done", input: { path: "a/b/spec.md" } },
      { status: "done", input: { path: "other/spec.md" } },
      { status: "failed", input: { path: "broken.md" } },
      { status: "done", input: { query: "not a file" } },
    ]);
    expect(sources).toEqual(["spec.md"]);
  });
});

describe("summarizeCalls", () => {
  it("counts calls by label, most frequent first", () => {
    expect(summarizeCalls([{ name: "search_code" }, { name: "get_file_contents" }, { name: "get_file_contents" }])).toEqual([
      { label: "Read file", count: 2 },
      { label: "Search code", count: 1 },
    ]);
  });
});
