import { describe, expect, it } from "vitest";
import { toolKind } from "./toolKinds";

describe("toolKind", () => {
  it.each([
    ["ask_clarifying_questions", "ask"],
    ["create_pull_request", "write"],
    ["snowflake_query", "query"],
    ["search_code", "search"],
    ["s3_list_reference_documents", "search"],
    ["get_file_contents", "read"],
    ["issue_read", "read"],
    ["jira_get_issue", "read"],
    ["s3_get_document_text", "read"],
    ["track_plan", "other"],
  ])("%s is %s", (name, kind) => {
    expect(toolKind(name)).toBe(kind);
  });

  it("treats a writing tool as a write even when its name looks like a query", () => {
    expect(toolKind("jira_add_comment")).toBe("write");
  });
});
