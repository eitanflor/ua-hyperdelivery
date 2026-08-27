import type { Station } from "../api/types";

export const PIPELINE: Station[] = [
  "distill",
  "blueprint_approval",
  "blueprint",
  "review_approval",
  "review",
  "showroom",
  "done",
];

export const AGENT_STATIONS: Station[] = ["distill", "blueprint", "review", "showroom"];

export const AGENT_META: Record<
  string,
  { label: string; initial: string; gradient: string; ring: string }
> = {
  distill: {
    label: "Distill",
    initial: "D",
    gradient: "from-sky-500 to-blue-600",
    ring: "ring-sky-500/30",
  },
  blueprint: {
    label: "Blueprint",
    initial: "B",
    gradient: "from-violet-500 to-purple-600",
    ring: "ring-violet-500/30",
  },
  review: {
    label: "Review",
    initial: "R",
    gradient: "from-amber-500 to-orange-600",
    ring: "ring-amber-500/30",
  },
  showroom: {
    label: "Showroom",
    initial: "S",
    gradient: "from-emerald-500 to-teal-600",
    ring: "ring-emerald-500/30",
  },
};

export function stationIndex(station: Station): number {
  return PIPELINE.indexOf(station);
}

/** The chat's single, continuous persona - regardless of which internal agent
 * (Distill/Blueprint/Review/Showroom) is actually running a given turn. Swapping the
 * visible name/avatar per pipeline stage made the conversation read like a form for an
 * internal artifact-generation tool rather than one chat with an assistant; the current
 * station is still shown, just as a small badge in the thread header, not as who's
 * "speaking". */
export const ASSISTANT_META = {
  label: "Assistant",
  initial: "H",
  gradient: "from-ua-red to-ua-red-dark",
};

/** Compact badge for a project's current station, for sidebar list rows - agent
 * stations reuse their AGENT_META initial/gradient, the two approval stations get a
 * distinct "G1"/"G2" (gate) badge in the accent color so a project awaiting a decision
 * stands out inline instead of needing its own separate list section. */
export function stationBadge(station: Station): { label: string; className: string } {
  switch (station) {
    case "blueprint_approval":
      return { label: "G1", className: "bg-ua-red text-white" };
    case "review_approval":
      return { label: "G2", className: "bg-ua-red text-white" };
    case "done":
      return { label: "✓", className: "bg-emerald-500 text-white" };
    default: {
      const meta = AGENT_META[station];
      return meta
        ? { label: meta.initial, className: `bg-gradient-to-br ${meta.gradient} text-white` }
        : { label: "?", className: "bg-ua-steel text-white" };
    }
  }
}
