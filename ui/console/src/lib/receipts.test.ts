import { describe, expect, it } from "vitest";
import type { ToolCallEvent } from "../api/client";
import { isWritingTool, receiptsFrom } from "./receipts";

const call = (over: Partial<ToolCallEvent>): ToolCallEvent => ({ id: "1", name: "create_pull_request", status: "done", ...over });

describe("isWritingTool", () => {
  it("separates tools that change things from tools that only read", () => {
    expect(isWritingTool("create_pull_request")).toBe(true);
    expect(isWritingTool("jira_transition_issue")).toBe(true);
    expect(isWritingTool("get_file_contents")).toBe(false);
  });
});

describe("receiptsFrom", () => {
  it("keeps only finished writing calls, in order", () => {
    const receipts = receiptsFrom([
      call({ id: "read", name: "get_file_contents" }),
      call({ id: "running", status: "running" }),
      call({ id: "cut", status: "interrupted" }),
      call({ id: "a", name: "create_branch" }),
      call({ id: "b", name: "push_files" }),
    ]);
    expect(receipts.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("links to the first non-API https URL in the result", () => {
    const [receipt] = receiptsFrom([
      call({ result: { api: "https://api.github.com/repos/o/r/pulls/1", html: "https://github.com/o/r/pull/1" } }),
    ]);
    expect(receipt!.href).toBe("https://github.com/o/r/pull/1");
    expect(receipt!.ok).toBe(true);
  });

  it("finds a link in a plain string result", () => {
    const [receipt] = receiptsFrom([call({ result: "Created https://github.com/o/r/issues/4 ok" })]);
    expect(receipt!.href).toBe("https://github.com/o/r/issues/4");
  });

  it("marks a failed call not ok and gives it no link", () => {
    const [receipt] = receiptsFrom([call({ status: "failed", result: "see https://github.com/o/r" })]);
    expect(receipt).toMatchObject({ ok: false, href: null });
  });

  it("names the target from the call's input", () => {
    const [byPath, byIssue, none] = receiptsFrom([
      call({ id: "1", name: "create_or_update_file", input: { repo: "o/r", path: "src/a.py" } }),
      call({ id: "2", name: "issue_write", input: { repository: "o/r", issue_number: 7 } }),
      call({ id: "3", name: "create_branch", input: { repo: "  ", path: "" } }),
    ]);
    expect(byPath!.target).toBe("o/r · src/a.py");
    expect(byIssue!.target).toBe("o/r · #7");
    expect(none!.target).toBeNull();
  });

  it("has no link or target when the result and input are missing", () => {
    expect(receiptsFrom([call({})])[0]).toMatchObject({ target: null, href: null });
  });
});
