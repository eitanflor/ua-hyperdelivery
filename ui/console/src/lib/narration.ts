import type { ToolCallEvent } from "../api/client";
import { toolLabel } from "./toolLabels";

/** Verbs whose final consonant doubles before -ing. A list, not a rule: English
 * syllable stress is not something a tool name carries. */
const DOUBLED = new Set(["get", "set", "put", "run", "plan", "stop", "map", "scan", "tag", "drop", "ship", "submit"]);

/** "Read" -> "Reading", "Write" -> "Writing", "Get" -> "Getting". Preserves the case of
 * the first letter so it works on a label's first word and on a word mid-phrase. */
export function gerund(verb: string): string {
  const lower = verb.toLowerCase();
  let stem: string;
  if (DOUBLED.has(lower)) stem = verb + verb.slice(-1);
  else if (lower.endsWith("ie")) stem = `${verb.slice(0, -2)}y`;
  else if (lower.endsWith("e") && !/[eoy]e$/.test(lower)) stem = verb.slice(0, -1);
  else stem = verb;
  return `${stem}ing`;
}

/** The label's verbs as -ing forms: "Create or update issue" -> "Creating or updating
 * issue". Only the first word and any word after "or"/"and" are verbs in these labels. */
function progressive(label: string): string {
  const words = label.split(" ");
  return words
    .map((word, i) => (i === 0 || words[i - 1] === "or" || words[i - 1] === "and" ? gerund(word) : word))
    .join(" ");
}

/** The one argument worth showing beside a tool's name, in order of how well each key
 * identifies a call. A tool whose arguments say nothing useful gets no target. */
const TARGET_KEYS = ["path", "query", "branch", "ref", "title", "name"] as const;

function callTarget(input: Record<string, unknown> | undefined): { key: string; value: string } | null {
  for (const key of TARGET_KEYS) {
    const value = input?.[key];
    if (typeof value === "string" && value.trim()) return { key, value: value.trim() };
  }
  return null;
}

/** The raw argument the trace shows beside a tool's name, so eighteen reads of the same
 * tool list the files they touched instead of repeating the tool. */
export function toolCallLabel(input: Record<string, unknown> | undefined): string | null {
  return callTarget(input)?.value ?? null;
}

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** A path's last segment, without the random prefix uploads carry in S3. */
function fileName(path: string): string {
  const last = path.split("/").filter(Boolean).at(-1) ?? path;
  return last.replace(/^[0-9a-f]{32}-/, "");
}

/** The files and documents a turn read, by name - the sources its reply rests on. A read
 * that failed is not a source. */
export function callSources(calls: Pick<ToolCallEvent, "input" | "status">[]): string[] {
  const names = new Set<string>();
  for (const call of calls) {
    if (call.status === "failed") continue;
    const target = callTarget(call.input);
    if (target?.key === "path") names.add(fileName(target.value));
  }
  return [...names];
}

/** A turn's tool calls counted by what they did, most frequent first - the one-line
 * summary a finished trace collapses to. */
export function summarizeCalls(calls: Pick<ToolCallEvent, "name">[]): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const call of calls) {
    const label = toolLabel(call.name);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

/** A tool call as a present-tense sentence fragment for the working line: "Reading
 * line-plan.docx", "Searching code for "size run"". Plain words for someone who does not
 * know what a tool call is - the Detailed trace keeps the exact name and arguments. */
export function narrate(call: Pick<ToolCallEvent, "name" | "input">): string {
  const label = toolLabel(call.name);
  const target = callTarget(call.input);
  if (!target) return progressive(label);
  if (target.key === "path") {
    return `${gerund(label.split(" ")[0] ?? label)} ${clip(fileName(target.value), 48)}`;
  }
  if (target.key === "query") return `${progressive(label)} for “${clip(target.value, 40)}”`;
  return `${progressive(label)} · ${clip(target.value, 40)}`;
}
