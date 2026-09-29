import { list, str } from "../api/artifacts";

export type ChangeKind = "added" | "removed" | "changed";

export interface Change {
  section: string;
  id: string;
  kind: ChangeKind;
  before?: string;
  after?: string;
}

interface ListSpec {
  key: string;
  section: string;
  /** The field that identifies an item across drafts; absent for a list of plain strings. */
  id?: string;
  /** The fields that name an item for a reader, joined. */
  label: string[];
}

/** What is compared per document, in reading order: the lists a reviewer tracks item by
 * item, and the prose fields that can be rewritten wholesale. */
const SPEC: Record<string, { text: [string, string][]; lists: ListSpec[] }> = {
  distill: {
    text: [
      ["title", "Title"],
      ["objective", "Objective"],
      ["scope", "Scope"],
    ],
    lists: [
      { key: "requirements", section: "Requirements", id: "id", label: ["description"] },
      { key: "acceptance_criteria", section: "Acceptance criteria", id: "id", label: ["description"] },
      { key: "open_questions", section: "Open questions", label: [] },
    ],
  },
  blueprint: {
    text: [
      ["title", "Title"],
      ["architecture_summary", "Architecture"],
    ],
    lists: [
      { key: "units_of_work", section: "Build tasks", id: "id", label: ["title"] },
      { key: "components", section: "Components", id: "id", label: ["name"] },
      { key: "integration_points", section: "Integration points", id: "id", label: ["system"] },
      { key: "api_contracts", section: "API contracts", id: "id", label: ["method", "path"] },
    ],
  },
  review: {
    text: [["title", "Title"]],
    lists: [
      { key: "findings", section: "Findings", id: "id", label: ["description"] },
      { key: "coverage", section: "Requirement coverage", id: "requirement_id", label: ["met"] },
    ],
  },
  showroom: {
    text: [
      ["title", "Title"],
      ["summary", "Summary"],
    ],
    lists: [
      { key: "talk_track", section: "Walkthrough", id: "requirement_id", label: ["narration"] },
      { key: "demo_data", section: "Seed data", id: "entity", label: ["description"] },
    ],
  },
};

function labelOf(item: unknown, fields: string[]): string {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return String(item);
  const record = item as Record<string, unknown>;
  return fields
    .map((field) => {
      const value = record[field];
      if (typeof value === "boolean") return value ? "met" : "not met";
      return typeof value === "string" || typeof value === "number" ? String(value) : "";
    })
    .filter(Boolean)
    .join(" ");
}

function idOf(item: unknown, field: string | undefined): string {
  if (!field) return typeof item === "string" ? item : JSON.stringify(item);
  const value = item && typeof item === "object" ? (item as Record<string, unknown>)[field] : undefined;
  return typeof value === "string" ? value : JSON.stringify(item);
}

/** What changed between two drafts of the same document, section by section.
 *
 * Items are matched by id, so a reworded requirement reads as one change rather than a
 * removal and an addition. An item whose name is unchanged but whose details moved is
 * still reported, with the same text on both sides. */
export function diffArtifact(
  agent: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Change[] {
  const spec = SPEC[agent];
  if (!spec) return [];
  const changes: Change[] = [];

  for (const [key, section] of spec.text) {
    const a = str(before, key);
    const b = str(after, key);
    if (a === b) continue;
    changes.push({
      section,
      id: key,
      kind: a === undefined ? "added" : b === undefined ? "removed" : "changed",
      before: a,
      after: b,
    });
  }

  for (const listSpec of spec.lists) {
    const old = new Map(list<unknown>(before, listSpec.key).map((item) => [idOf(item, listSpec.id), item]));
    const next = new Map(list<unknown>(after, listSpec.key).map((item) => [idOf(item, listSpec.id), item]));
    for (const [id, item] of next) {
      const previous = old.get(id);
      if (previous === undefined) {
        changes.push({ section: listSpec.section, id, kind: "added", after: labelOf(item, listSpec.label) });
      } else if (JSON.stringify(previous) !== JSON.stringify(item)) {
        changes.push({
          section: listSpec.section,
          id,
          kind: "changed",
          before: labelOf(previous, listSpec.label),
          after: labelOf(item, listSpec.label),
        });
      }
    }
    for (const [id, item] of old) {
      if (!next.has(id)) {
        changes.push({ section: listSpec.section, id, kind: "removed", before: labelOf(item, listSpec.label) });
      }
    }
  }
  return changes;
}
