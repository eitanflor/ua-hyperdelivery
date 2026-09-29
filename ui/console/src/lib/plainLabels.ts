import type { EvidenceSource, RequirementIntentKind, Severity, UnitOfWork } from "../api/artifacts";

/** Severity as an approver would say it - the wire values are an engineer's. */
export const SEVERITY_LABEL: Record<Severity, string> = {
  blocker: "Must fix",
  major: "Should fix",
  minor: "Minor",
};

/** Where a requirement came from, named for a reader rather than by provenance code. */
export const EVIDENCE_LABEL: Record<EvidenceSource, string> = {
  source_document: "Submitted document",
  stakeholder_answer: "Answer in chat",
  reference_material: "Reference FSD",
};

export const INTENT_LABEL: Record<RequirementIntentKind, string> = {
  functional: "Feature",
  non_functional: "Quality",
  integration: "Integration",
  reporting: "Reporting",
  compliance: "Compliance",
  data_migration: "Data migration",
};

/** Build tasks in an order they can actually be built: each after everything it needs.
 *
 * Kahn's algorithm, keeping the plan's own order among tasks that are ready together. A
 * cycle or a dependency on an unknown task cannot block the list - whatever remains is
 * appended in plan order, so nothing silently disappears. */
export function buildOrder(units: UnitOfWork[]): UnitOfWork[] {
  const ids = new Set(units.map((u) => u.id));
  const placed = new Set<string>();
  const ordered: UnitOfWork[] = [];
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const unit of units) {
      if (placed.has(unit.id)) continue;
      if (unit.depends_on.every((dep) => placed.has(dep) || !ids.has(dep))) {
        ordered.push(unit);
        placed.add(unit.id);
        progressed = true;
      }
    }
  }
  return [...ordered, ...units.filter((u) => !placed.has(u.id))];
}
