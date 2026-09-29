import { QUESTIONS_TOOL } from "./plan";
import { isWritingTool } from "./receipts";

export type ToolKind = "read" | "search" | "query" | "write" | "ask" | "other";

/** What a tool does to the world, for the icon and tint beside it in the trace. Inferred from
 * the wire name (most tools are GitHub's and Atlassian's, so there is nothing of ours to
 * declare it on); anything unrecognized stays neutral rather than guessing. */
export function toolKind(name: string): ToolKind {
  if (name === QUESTIONS_TOOL) return "ask";
  if (isWritingTool(name)) return "write";
  if (/snowflake|query|sql/.test(name)) return "query";
  if (/search|find|list|tree/.test(name)) return "search";
  if (/^(get|read|fetch)|_read$|_get_/.test(name) || /^(s3|jira)_get/.test(name)) return "read";
  return "other";
}
