/** Acronyms the mechanical humanizer would otherwise lowercase. */
const ACRONYMS: Record<string, string> = {
  api: "API",
  copilot: "Copilot",
  fsd: "FSD",
  github: "GitHub",
  id: "ID",
  jira: "Jira",
  pr: "PR",
  s3: "S3",
  sql: "SQL",
  url: "URL",
};

/**
 * Hand-written labels for tools whose name, mechanically humanized, is wrong or clumsy.
 *
 * Only exceptions live here - `search_code` and `score_completeness` already read fine
 * and are deliberately absent. Most of these are not ours to rename: they come from
 * GitHub's and Atlassian's remote MCP servers (see src/mcp_clients/), which is why this
 * is a lookup rather than something declared next to a tool definition.
 */
const OVERRIDES: Record<string, string> = {
  // GitHub MCP - the verb is buried or missing in the wire name
  get_file_contents: "Read file",
  create_or_update_file: "Write file",
  get_repository_tree: "List repository files",
  issue_read: "Read issue",
  issue_write: "Create or update issue",
  add_issue_comment: "Comment on issue",
  pull_request_read: "Read pull request",
  assign_copilot_to_issue: "Assign Copilot",
  create_pull_request_with_copilot: "Hand off to Copilot",
  // Atlassian MCP - "Jira get issue" is the wrong word order
  jira_get_issue: "Read Jira issue",
  jira_create_issue: "Create Jira issue",
  jira_update_issue: "Update Jira issue",
  jira_search: "Search Jira",
  jira_add_comment: "Comment on Jira issue",
  jira_get_transitions: "Read Jira workflow",
  jira_transition_issue: "Move Jira issue",
  // ours - the storage prefix is an implementation detail, not something to read
  s3_get_document_text: "Read document",
  s3_list_reference_documents: "List reference FSDs",
  s3_find_similar_reference_documents: "Find similar FSDs",
  snowflake_query: "Query Snowflake",
};

/**
 * What to call a tool in the thread.
 *
 * Unknown tools are humanized rather than dropped through raw, so a tool added to an MCP
 * server tomorrow still reads as words - the raw wire name is never shown to the user.
 */
export function toolLabel(name: string): string {
  const override = OVERRIDES[name];
  if (override) return override;

  const words = name
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => ACRONYMS[word] ?? word);
  const [first, ...rest] = words;
  if (!first) return name;
  // an acronym is already cased by the map above, so this is a no-op for those
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(" ");
}
