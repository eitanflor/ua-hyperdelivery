import type { ToolCallEvent } from "../api/client";
import { toolLabel } from "./toolLabels";

/** Tools that change something outside the console - a repository, an issue, a pull
 * request, a Jira ticket. Everything else the crew calls only reads. Named here rather
 * than inferred from the wire name because most are GitHub's and Atlassian's, not ours
 * (see src/tools/github.py and atlassian.py for who is allowed to call which). */
const WRITING_TOOLS = new Set([
  "create_repository",
  "create_branch",
  "create_or_update_file",
  "push_files",
  "issue_write",
  "add_issue_comment",
  "create_pull_request",
  "update_pull_request",
  "assign_copilot_to_issue",
  "create_pull_request_with_copilot",
  "jira_create_issue",
  "jira_update_issue",
  "jira_add_comment",
  "jira_transition_issue",
]);

export function isWritingTool(name: string): boolean {
  return WRITING_TOOLS.has(name);
}

export interface Receipt {
  id: string;
  label: string;
  /** What it was done to: a repository and file, an issue number, a title. */
  target: string | null;
  /** The page it produced, when the tool's result names one. */
  href: string | null;
  /** False when the tool reported an error, so nothing changed. */
  ok: boolean;
}

const LINK = /https:\/\/(?!api\.)[^\s"'\\)]+/;

function resultText(result: unknown): string {
  return typeof result === "string" ? result : JSON.stringify(result ?? "");
}

function targetOf(input: Record<string, unknown> | undefined): string | null {
  if (!input) return null;
  const text = (key: string) => {
    const value = input[key];
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };
  const number = typeof input.issue_number === "number" ? `#${input.issue_number}` : null;
  const parts = [
    text("repo") ?? text("repository") ?? text("name"),
    text("path") ?? text("title") ?? number ?? text("issue_key") ?? text("branch"),
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** What a turn's finished writing calls did outside the console, in the order they ran.
 *
 * A gate authorizes these, so "what actually happened" belongs beside the approval rather
 * than only in a trace. Only finished calls count: one still running or cut off has not
 * been seen to change anything. */
export function receiptsFrom(calls: ToolCallEvent[]): Receipt[] {
  return calls
    .filter((call) => WRITING_TOOLS.has(call.name) && (call.status === "done" || call.status === "failed"))
    .map((call) => {
      const raw = resultText(call.result);
      return {
        id: call.id,
        label: toolLabel(call.name),
        target: targetOf(call.input),
        href: call.status === "done" ? (LINK.exec(raw)?.[0] ?? null) : null,
        ok: call.status === "done",
      };
    });
}
