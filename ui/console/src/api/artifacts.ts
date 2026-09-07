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
  id: string;
  criterion_id: string;
  rule: string;
}

export interface RuleCorrelation {
  id: string;
  rule_ids: string[];
  description: string;
}

export type EvidenceSource = "source_document" | "stakeholder_answer" | "reference_material";

export interface EvidenceLink {
  requirement_id: string;
  evidence: string;
  source?: EvidenceSource;
}

export interface AcceptanceCriterion {
  id: string;
  requirement_id: string;
  description: string;
}

export interface BusinessValue {
  requirement_id: string;
  use_case: string;
  roi: string;
}

export type RequirementIntentKind =
  | "functional"
  | "non_functional"
  | "integration"
  | "reporting"
  | "compliance"
  | "data_migration";

export interface RequirementIntent {
  requirement_id: string;
  intent: RequirementIntentKind;
}

export interface OpenQuestion {
  id: string;
  question: string;
  options: string[];
  multi_select: boolean;
}

export interface Completeness {
  score: number;
  gaps: string[];
  questions: OpenQuestion[];
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type FileChange = "add" | "modify" | "delete";

export interface ApiContract {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  requirement_ids?: string[];
  request_schema?: string | null;
  response_schema?: string | null;
}

export interface FileTouchpoint {
  path: string;
  change: FileChange;
  purpose: string;
}

export interface Component {
  id: string;
  name: string;
  responsibility: string;
}

export interface EntityField {
  name: string;
  type: string;
  description: string;
}

export interface DataEntity {
  id: string;
  name: string;
  description: string;
  component_id: string;
  fields?: EntityField[];
}

export type IntegrationDirection = "inbound" | "outbound" | "bidirectional";

export interface IntegrationPoint {
  id: string;
  system: string;
  direction: IntegrationDirection;
  description: string;
  requirement_ids?: string[];
}

export interface UnitOfWork {
  id: string;
  title: string;
  description: string;
  depends_on: string[];
  requirement_ids?: string[];
  acceptance_criterion_ids?: string[];
  component_ids?: string[];
  contract_ids?: string[];
  files?: FileTouchpoint[];
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
  pull_request_number?: number | null;
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

/** Every list a station fills in once it has actually drafted something. */
const CONTENT_KEYS = [
  "requirements",
  "gate_criteria",
  "rules",
  "components",
  "units_of_work",
  "api_contracts",
  "findings",
  "coverage",
  "talk_track",
  "demo_data",
] as const;

/**
 * Whether a station has produced a document yet, as opposed to an intake turn that only
 * asked questions.
 *
 * An intake turn is still persisted - it is the record of the turn, and the next turn is
 * grounded in it - but it is not a document, so it gets no artifact card and no slot in
 * the inspector until it has content.
 */
export function hasContent(content: Content): boolean {
  return CONTENT_KEYS.some((key) => {
    const value = content[key];
    return Array.isArray(value) && value.length > 0;
  });
}

export function completeness(content: Content): Completeness | undefined {
  const raw = content.completeness;
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.score !== "number") return undefined;
  return {
    score: obj.score,
    gaps: Array.isArray(obj.gaps) ? (obj.gaps as string[]) : [],
    questions: Array.isArray(obj.questions) ? (obj.questions as OpenQuestion[]) : [],
  };
}

export function openQuestions(content: Content): OpenQuestion[] {
  return completeness(content)?.questions ?? [];
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
