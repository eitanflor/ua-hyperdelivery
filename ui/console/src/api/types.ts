export type Station =
  | "distill"
  | "blueprint_approval"
  | "blueprint"
  | "review_approval"
  | "review"
  | "showroom_approval"
  | "showroom"
  | "done";

export const APPROVAL_STATIONS: ReadonlySet<Station> = new Set([
  "blueprint_approval",
  "review_approval",
  "showroom_approval",
]);

export interface PendingQuestion {
  status: "questions" | "chat";
  questions?: { id: string; question: string; options: string[]; multi_select: boolean }[];
  message?: string;
  prior_message?: string;
}

export interface Project {
  id: string;
  name: string;
  station: Station;
  // Set while Distill is waiting on an answer instead of drafting; null otherwise.
  pending_question: PendingQuestion | null;
  // "local": the console drives turns itself via /advance(/stream). "deployed": a Step
  // Functions state machine drives turns, so the console polls and uses /answer instead -
  // see useProjectsStore's advanceProject.
  orchestration_mode: "local" | "deployed";
  created_at: string;
  updated_at: string;
}

// The repo, database, design system or conventions a human recorded once for every
// station to read - system-wide, like a system prompt, not scoped to any one project.
export interface GlobalContext {
  context: string;
  updated_by: string | null;
  updated_at: string | null;
}

export interface Artifact {
  agent: string;
  content: Record<string, unknown>;
  created_at: string;
}

export interface DecisionRequest {
  approved: boolean;
  signer: string;
  comment?: string | null;
}

/** One pull request a coding agent is building, as the console polls it.
 * `state`/`checks` are null when the backend has no GitHub token to ask with - unknown,
 * not failed. */
export interface Build {
  group_id: string;
  number: number;
  url: string;
  title: string | null;
  unit_ids: string[];
  issue_numbers: number[];
  state: "open" | "merged" | "closed" | null;
  checks: "pending" | "passing" | "failing" | "none" | null;
  draft: boolean | null;
}

export interface Builds {
  repository: string | null;
  builds: Build[];
  watching: boolean;
}

/** Body for `POST /projects/{id}/preview` and its `/stop` counterpart.
 *
 * A laptop-demo convenience - `running: false` with no error is normal when the backend
 * has no `PREVIEW_CHECKOUT_PATH` configured. */
export interface PreviewResponse {
  running: boolean;
  backend_url: string | null;
  frontend_url: string | null;
  message: string;
}
