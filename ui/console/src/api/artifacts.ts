/** Typed views over the agent artifacts.
 *
 * The API hands back `content: Record<string, unknown>` because each agent has its own
 * Pydantic model (see src/core/domain/). These mirror those models and read defensively,
 * so a malformed or partial artifact degrades to "nothing to show" rather than throwing.
 */

export type Severity = "blocker" | "major" | "minor";

export interface Requirement {
  id: string;
  description: string;
}

export interface GateCriterion {
  id: string;
  description: string;
}

export interface MachineRule {
  criterion_id: string;
  rule: string;
}

export interface EvidenceLink {
  requirement_id: string;
  evidence: string;
}

export interface Completeness {
  score: number;
  gaps: string[];
}

export interface UnitOfWork {
  id: string;
  title: string;
  description: string;
  depends_on: string[];
}

export interface Finding {
  id: string;
  severity: Severity;
  description: string;
  requirement_id?: string | null;
  unit_id?: string | null;
}

export interface Coverage {
  requirement_id: string;
  met: boolean;
}

export interface TalkTrackSection {
  requirement_id: string;
  narration: string;
}

export interface DemoSeed {
  entity: string;
  description: string;
}

export interface CopilotAssignment {
  finding_id: string;
  issue_number: number;
  issue_url?: string | null;
  created_new_issue: boolean;
  assigned: boolean;
  note?: string | null;
}

type Content = Record<string, unknown>;

export function str(content: Content, key: string): string | undefined {
  const value = content[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function list<T>(content: Content, key: string): T[] {
  const value = content[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

export function completeness(content: Content): Completeness | undefined {
  const raw = content.completeness;
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.score !== "number") return undefined;
  return {
    score: obj.score,
    gaps: Array.isArray(obj.gaps) ? (obj.gaps as string[]) : [],
  };
}

export const SEVERITY_ORDER: Record<Severity, number> = { blocker: 0, major: 1, minor: 2 };

export function isSeverity(value: unknown): value is Severity {
  return value === "blocker" || value === "major" || value === "minor";
}

/** Which agent produced this, judged by the fields present - used to pick a renderer
 * when the agent name alone is not enough. */
export function artifactKind(agent: string): "spec" | "blueprint" | "review" | "demo" | "unknown" {
  switch (agent) {
    case "distill":
      return "spec";
    case "blueprint":
      return "blueprint";
    case "review":
      return "review";
    case "showroom":
      return "demo";
    default:
      return "unknown";
  }
}
