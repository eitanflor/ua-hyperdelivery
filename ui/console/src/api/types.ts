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

export interface Project {
  id: string;
  name: string;
  station: Station;
  created_at: string;
  updated_at: string;
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
