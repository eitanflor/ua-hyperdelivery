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
  /** Plain job title, so the name never needs a glossary. */
  title: string;
  /** Position on the line, worn like a jersey number. */
  number: string;
  face: AgentFaceName;
  /** Plain-language answer to "what does this one do?" - tooltips, the glossary, onboarding. */
  role: string;
  /** What it hands to the next station, in the same language. */
  output: string;
  /** Human-readable model name shown in the console. */
  model: string;
  /** What the working line says while this agent is silent - in character, so a long
   * think reads as someone at work rather than a stalled spinner. Rotated, never random. */
  working: string[];
  fg: string;
  bg: string;
}

/** The crew.
 *
 * Staff names from the arc an athlete goes through - a scout, a coach, a ref, a host - so
 * they read as teammates rather than as pipeline stages. Everything around them is plain
 * language: stages, outputs and gates say what they are, and `title` says what each name
 * means. The wire ids below (`distill`, `blueprint`, `review`, `showroom`) are the
 * backend's and are deliberately untouched - this is a display layer.
 */
export const AGENT_META: Record<string, AgentMeta> = {
  distill: {
    name: "Scout",
    title: "Requirements analyst",
    number: "01",
    face: "scout",
    role: "Turns your idea or FSD into a clear list of what is needed, each point tied to where it came from, and says honestly what is still missing.",
    output: "Requirements brief",
    model: "Claude Sonnet 5",
    working: ["Scouting", "Sizing it up", "Taking measurements", "Charting it out"],
    fg: "text-distill",
    bg: "bg-distill-bg",
  },
  blueprint: {
    name: "Coach",
    title: "Build planner",
    number: "02",
    face: "coach",
    role: "Turns the approved requirements into a build plan: the pieces of work to build, and the order to build them in.",
    output: "Build plan",
    model: "Claude Sonnet 5",
    working: ["Drawing up the plan", "Game-planning", "Sequencing the work", "Whiteboarding"],
    fg: "text-blueprint",
    bg: "bg-blueprint-bg",
  },
  review: {
    name: "Ref",
    title: "Quality reviewer",
    number: "03",
    face: "ref",
    role: "Checks what got built against the requirements, flags the worst problems first, and can send a fix to Copilot when asked.",
    output: "Quality report",
    model: "Claude Sonnet 5",
    working: ["Reviewing the tape", "Checking the call", "Weighing it up", "Looking for flags"],
    fg: "text-review",
    bg: "bg-review-bg",
  },
  showroom: {
    name: "Host",
    title: "Demo producer",
    number: "04",
    face: "host",
    role: "Prepares the walkthrough and the sample data to show the real thing working.",
    output: "Demo script",
    model: "Claude Sonnet 5",
    working: ["Setting the stage", "Rehearsing", "Cueing it up", "Warming up the room"],
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
  distill: { label: "Requirements", full: "Requirements", kind: "agent", agent: "distill" },
  blueprint_approval: {
    label: "Gate 1",
    full: "Gate 1 · Approve requirements",
    kind: "gate",
    reviewing: "distill",
    unlocks: "blueprint",
  },
  blueprint: { label: "Plan", full: "Plan", kind: "agent", agent: "blueprint" },
  review_approval: {
    label: "Gate 2",
    full: "Gate 2 · Approve the plan",
    kind: "gate",
    reviewing: "blueprint",
    unlocks: "review",
  },
  review: { label: "Build check", full: "Build check", kind: "agent", agent: "review" },
  showroom_approval: {
    label: "Gate 3",
    full: "Gate 3 · Approve the build",
    kind: "gate",
    reviewing: "review",
    unlocks: "showroom",
  },
  showroom: { label: "Demo", full: "Demo", kind: "agent", agent: "showroom" },
  done: { label: "Shipped", full: "Shipped", kind: "done" },
};

export function stationIndex(station: Station): number {
  return PIPELINE.indexOf(station);
}

export function isGate(station: Station): boolean {
  return STATION_META[station].kind === "gate";
}
