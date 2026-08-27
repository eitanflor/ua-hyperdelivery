export type Station =
  | "distill"
  | "blueprint_approval"
  | "blueprint"
  | "review_approval"
  | "review"
  | "showroom"
  | "done";

export const APPROVAL_STATIONS: ReadonlySet<Station> = new Set([
  "blueprint_approval",
  "review_approval",
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
