import type { Artifact } from "../api/types";
import { hasContent as hasAnyContent } from "../api/artifacts";

export function artifactTitle(artifact: Artifact): string {
  return typeof artifact.content.title === "string" ? artifact.content.title : artifact.agent;
}

/** The two or three counts worth putting on an artifact card - what this document
 * actually contains, so it can be judged without opening it. */
export function artifactStats(content: Record<string, unknown>): { label: string; value: number }[] {
  const of = (key: string) => (Array.isArray(content[key]) ? (content[key] as unknown[]).length : 0);
  const candidates: { label: string; value: number }[] = [
    { label: "requirements", value: of("requirements") },
    { label: "rules", value: of("rules") },
    { label: "components", value: of("components") },
    { label: "units", value: of("units_of_work") },
    { label: "endpoints", value: of("api_contracts") },
    { label: "findings", value: of("findings") },
    { label: "covered", value: of("coverage") },
    { label: "talk track", value: of("talk_track") },
  ];
  return candidates.filter((c) => c.value > 0).slice(0, 3);
}

/** What the assistant "says" once a turn finishes - written in first person so the
 * chat reads like a reply, not a status readout for whichever agent happened to run.
 * The structured content itself lives in the artifact panel. */
export function composeReply(content: Record<string, unknown>, askedViaTool = 0): string {
  const title = typeof content.title === "string" ? content.title : undefined;
  const completeness = content.completeness as
    | { score?: number; gaps?: string[]; questions?: unknown[] }
    | undefined;

  // An intake turn drafted nothing on purpose - claiming "a first draft" and listing the
  // validator's gaps would be both wrong and unanswerable. The questions themselves are
  // rendered above the composer. `askedViaTool` covers a turn with no artifact at all
  // (Distill's voluntary `ask_clarifying_questions` - see lib/plan.ts), where there is no
  // `completeness` to read a count from.
  if (!hasAnyContent(content)) {
    const asked = completeness?.questions?.length ?? askedViaTool;
    return asked > 0
      ? `Before I draft anything I need to understand a few things — ${asked === 1 ? "there's a question" : `there are ${asked} questions`} below the thread.`
      : "I don't have enough to work from yet. Tell me what you're trying to build, or point me at an FSD, a Confluence page, or a Jira issue.";
  }

  if (completeness) {
    if (completeness.gaps && completeness.gaps.length > 0) {
      const gapLines = completeness.gaps.map((gap) => `- ${gap}`).join("\n");
      return (
        `I've got a first draft${title ? ` of "${title}"` : ""} going, but I still need a ` +
        `bit more before it's complete:\n${gapLines}\n\nLet me know and I'll finish it up.`
      );
    }
    return `Done - "${title ?? "the spec"}" is complete and ready to move forward.`;
  }

  // agents with no completeness concept (Blueprint/Review/Showroom) always finish in a
  // single turn - a short highlight instead of raw field counts
  const highlights: string[] = [];
  if (Array.isArray(content.units_of_work)) {
    highlights.push(`${content.units_of_work.length} unit(s) of work`);
  }
  if (Array.isArray(content.findings)) highlights.push(`${content.findings.length} finding(s)`);
  if (Array.isArray(content.coverage)) {
    highlights.push(`${content.coverage.length} requirement(s) covered`);
  }
  if (Array.isArray(content.talk_track)) {
    highlights.push(`${content.talk_track.length} talk-track section(s)`);
  }
  const suffix = highlights.length > 0 ? ` (${highlights.join(", ")})` : "";
  return `Done - "${title ?? "this"}"${suffix} is ready.`;
}

/** "gate_criteria" -> "Gate Criteria" - field names are whatever each agent's Pydantic
 * model happens to call them, so the artifact panel can't hardcode a label per field. */
export function humanizeKey(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Best-effort one-line rendering of a list item whose shape varies per agent
 * (requirements have id+description, rules have criterion_id+rule, etc.) - falls back
 * to raw JSON for anything with no recognizable id/body pair. */
export function renderListItem(item: unknown): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const id = obj.id ?? obj.criterion_id ?? obj.requirement_id;
    const body = obj.description ?? obj.rule ?? obj.evidence ?? obj.finding ?? obj.text;
    if (typeof body === "string") return typeof id === "string" ? `${id}: ${body}` : body;
  }
  return JSON.stringify(item);
}
