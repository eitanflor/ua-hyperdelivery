import { MarkerType, type Edge, type Node } from "@xyflow/react";

export const NODE_W = 176;
export const NODE_H = 64;

export type BoxTone = "default" | "focal" | "danger" | "external";

export type BoxData = {
  label: string;
  /** Mono sublabel - an id or a type, Detailed mode only. */
  mono?: string;
  sub?: string;
  badge?: string;
  tone?: BoxTone;
};

export type BoxNode = Node<BoxData, "box">;

/** A hairline edge with an arrow; `emphasis` spends the accent on it (the critical path). */
export function edge(from: string, to: string, emphasis: "none" | "focal" | "danger" = "none"): Edge {
  const color =
    emphasis === "focal"
      ? "var(--color-accent)"
      : emphasis === "danger"
        ? "var(--color-danger)"
        : "var(--color-line-strong)";
  return {
    id: `${from}->${to}`,
    source: from,
    target: to,
    type: "smoothstep",
    focusable: false,
    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color },
    style: { stroke: color, strokeWidth: emphasis === "none" ? 1 : 1.5 },
  };
}
