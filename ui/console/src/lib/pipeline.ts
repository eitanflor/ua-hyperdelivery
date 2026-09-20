import type { Station } from "../api/types";
import type { AgentFaceName } from "../components/agents/AgentFace";

export const PIPELINE: Station[] = [
  "distill",
  "blueprint_approval",
  "blueprint",
  "review_approval",
  "review",
  "showroom_approval",
  "showroom",
  "done",
];

export const AGENT_STATIONS: Station[] = ["distill", "blueprint", "review", "showroom"];

export interface AgentMeta {
  /** Who works this station - a staff title, so the console can say "Coach starts when you
   * sign". Deliberately not the station's own label: the station is the place, this is the
   * person. See the naming decision in docs/decisions.md. */
  name: string;
  /** Station number on the line, in the factory's own notation. */
  number: string;
  face: AgentFaceName;
  /** Plain-language answer to "what does this one do?" - tooltips, the glossary, onboarding. */
  role: string;
  /** What it hands to the next station, in the same language. */
  output: string;
  /** Human-readable model name shown in the console. */
  model: string;
  fg: string;
  bg: string;
}

/** The crew.
 *
 * Staff titles from the arc an athlete goes through: a scout measures raw talent at the
 * combine, a coach turns the read into a playbook, an official grades the tape in the film
 * room, a host calls the game. Each title is a job a person holds, which is what makes
 * these read as teammates rather than as pipeline stages. The wire ids below (`distill`,
 * `blueprint`, `review`, `showroom`) are the backend's and are deliberately untouched -
 * this is a display layer.
 */
export const AGENT_META: Record<string, AgentMeta> = {
  distill: {
    name: "Scout",
    number: "ST 01",
    face: "scout",
    role: "Measures the brief: every requirement pinned down and cited, and an honest list of what is still missing.",
    output: "Scouting report",
    model: "Claude Sonnet 5",
    fg: "text-distill",
    bg: "bg-distill-bg",
  },
  blueprint: {
    name: "Coach",
    number: "ST 02",
    face: "coach",
    role: "Turns the signed scouting report into the units of work that get built, and the order to build them in.",
    output: "Call sheet",
    model: "Claude Sonnet 5",
    fg: "text-blueprint",
    bg: "bg-blueprint-bg",
  },
  review: {
    name: "Ref",
    number: "ST 03",
    face: "ref",
    role: "Grades the build against the scouting report, calls what fails worst first, and can send a fix over to Copilot when asked.",
    output: "Grade sheet",
    model: "Claude Sonnet 5",
    fg: "text-review",
    bg: "bg-review-bg",
  },
  showroom: {
    name: "Host",
    number: "ST 04",
    face: "host",
    role: "Sets up the walkthrough: a run of show and the seed data to demo the real thing with.",
    output: "Run of show",
    model: "Claude Sonnet 5",
    fg: "text-showroom",
    bg: "bg-showroom-bg",
  },
};

export interface StationMeta {
  /** Canonical short label. The only string shown for this station anywhere. */
  label: string;
  /** Long form, for headers and the gate itself. */
  full: string;
  kind: "agent" | "gate" | "done";
  agent?: string;
  /** Gates only: whose work is being signed off, and what signing unlocks. */
  reviewing?: string;
  unlocks?: string;
}

/** One vocabulary for all eight stations. Nothing else may derive a user-facing label
 * from the raw enum - that is how "G1", "blueprint approval" and "D" all ended up
 * naming the same thing. */
export const STATION_META: Record<Station, StationMeta> = {
  distill: { label: "Combine", full: "Combine", kind: "agent", agent: "distill" },
  blueprint_approval: {
    label: "Gate 1",
    full: "Gate 1 · Scouting report sign-off",
    kind: "gate",
    reviewing: "distill",
    unlocks: "blueprint",
  },
  blueprint: { label: "Playbook", full: "Playbook", kind: "agent", agent: "blueprint" },
  review_approval: {
    label: "Gate 2",
    full: "Gate 2 · Call sheet sign-off",
    kind: "gate",
    reviewing: "blueprint",
    unlocks: "review",
  },
  review: { label: "Film Room", full: "Film Room", kind: "agent", agent: "review" },
  showroom_approval: {
    label: "Gate 3",
    full: "Gate 3 · Grade sheet sign-off",
    kind: "gate",
    reviewing: "review",
    unlocks: "showroom",
  },
  showroom: { label: "Gameday", full: "Gameday", kind: "agent", agent: "showroom" },
  done: { label: "Shipped", full: "Off the line", kind: "done" },
};

export function stationIndex(station: Station): number {
  return PIPELINE.indexOf(station);
}

export function isGate(station: Station): boolean {
  return STATION_META[station].kind === "gate";
}
