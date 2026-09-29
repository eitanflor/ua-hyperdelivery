import type { Artifact } from "../api/types";
import { hasContent as hasAnyContent } from "../api/artifacts";

export function artifactTitle(artifact: Artifact): string {
  return typeof artifact.content.title === "string" ? artifact.content.title : artifact.agent;
}

/** The two or three counts worth putting on an artifact card - what this document
 * actually contains, so it can be judged without opening it. */
export function artifactStats(content: Record<string, unknown>): { label: string; value: number }[] {
  const of = (key: string) => (Array.isArray(content[key]) ? (content[key] as unknown[]).length : 0);
  const coverage = Array.isArray(content.coverage) ? (content.coverage as { met?: boolean }[]) : [];
  const candidates: { label: string; value: number; always?: boolean }[] = [
    { label: "requirement", value: of("requirements") },
    { label: "rule", value: of("rules") },
    { label: "component", value: of("components") },
    { label: "build task", value: of("units_of_work") },
    { label: "endpoint", value: of("api_contracts") },
    // "of 7 met" even at zero: a report that covered everything and met nothing must say so
    { label: `of ${coverage.length} met`, value: coverage.filter((c) => c.met).length, always: coverage.length > 0 },
    { label: "finding", value: of("findings") },
    { label: "walkthrough step", value: of("talk_track") },
  ];
  return candidates
    .filter((c) => c.always ?? c.value > 0)
    .slice(0, 3)
    .map(({ label, value, always }) => ({ label: always || value === 1 ? label : `${label}s`, value }));
}

const plural = (n: number, noun: string, pluralNoun = `${noun}s`) => `${n} ${n === 1 ? noun : pluralNoun}`;

/** What the assistant "says" once a turn finishes - written in first person so the
 * chat reads like a reply, not a status readout for whichever agent happened to run.
 * Stays a plain-English gist for a business reader - the validator's own gap wording
 * (unit ids, requirement ids, contract ids) is dev detail that already renders in full
 * in the artifact panel, so repeating it here would be the same information twice, once
 * in plain English and once in jargon. */
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
    const gapCount = completeness.gaps?.length ?? 0;
    if (gapCount > 0) {
      return (
        `I've got a first draft${title ? ` of "${title}"` : ""} going, but it's not complete yet - ` +
        `${plural(gapCount, "thing", "things")} still ${gapCount === 1 ? "needs" : "need"} answering. ` +
        `Open the document to see what's outstanding, and let me know so I can finish it.`
      );
    }
  }

  // the numbers that matter for each kind of document, named plainly - the card below
  // carries the title, so repeating it here only made every reply a long quote
  const count = (key: string) => (Array.isArray(content[key]) ? (content[key] as unknown[]).length : 0);
  if (Array.isArray(content.coverage)) {
    const coverage = content.coverage as { met?: boolean }[];
    const met = coverage.filter((c) => c.met).length;
    const findings = content.findings as { severity?: string }[] | undefined;
    const blockers = (findings ?? []).filter((f) => f.severity === "blocker").length;
    if (met === coverage.length) {
      return `Build check done - all ${plural(coverage.length, "requirement")} met${blockers > 0 ? `, but ${plural(blockers, "finding")} must be fixed` : ""}.`;
    }
    return (
      `Build check done - ${met} of ${plural(coverage.length, "requirement")} met` +
      `${blockers > 0 ? `, and ${plural(blockers, "finding")} must be fixed` : ""}. ` +
      "The quality report says what is still missing."
    );
  }
  if (count("units_of_work") > 0) {
    const components = count("components");
    return `Build plan ready - ${plural(count("units_of_work"), "build task")}${components > 0 ? ` across ${plural(components, "component")}` : ""}.`;
  }
  if (count("talk_track") > 0) {
    return `Demo script ready - ${plural(count("talk_track"), "walkthrough step")}.`;
  }
  if (count("requirements") > 0) {
    const open = count("open_questions");
    return `Requirements brief ready - ${plural(count("requirements"), "requirement")}${open > 0 ? `, ${plural(open, "open question")}` : ", nothing left open"}.`;
  }
  return `Done - "${title ?? "this"}" is ready.`;
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
