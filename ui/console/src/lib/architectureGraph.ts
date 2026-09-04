import type { Component, UnitOfWork } from "../api/artifacts";

export type DiagramNode = { id: string; label: string; sub?: string; x: number; y: number };
export type DiagramEdge = { from: string; to: string };

export const NODE_W = 132;
export const NODE_H = 46;
const GAP_X = 56;
const GAP_Y = 18;
export const PAD = 12;
/** Past this many components a graph reads as a hairball - the list view is more honest. */
export const MAX_DIAGRAM_NODES = 12;

/** Longest path from a root, which is the layer a component belongs in. */
function layerOf(id: string, incoming: Map<string, string[]>, seen: Set<string>): number {
  if (seen.has(id)) return 0; // a cycle is already a G2 gap; don't recurse on it here
  const parents = incoming.get(id) ?? [];
  if (parents.length === 0) return 0;
  seen.add(id);
  const depth = 1 + Math.max(...parents.map((p) => layerOf(p, incoming, seen)));
  seen.delete(id);
  return depth;
}

/**
 * Component-level dependency graph, derived entirely from the stored blueprint.
 *
 * Unit-level `depends_on` edges are lifted to the components those units build, so the
 * picture is the architecture rather than the task list. Pure and deterministic: the same
 * artifact always lays out identically, which matters when the diagram is a view of a
 * gated document.
 */
export function buildGraph(
  components: Component[],
  units: UnitOfWork[],
): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  const componentsOfUnit = new Map(units.map((u) => [u.id, u.component_ids ?? []]));
  const known = new Set(components.map((c) => c.id));

  const edgeKeys = new Set<string>();
  const edges: DiagramEdge[] = [];
  for (const unit of units) {
    for (const dep of unit.depends_on) {
      for (const from of componentsOfUnit.get(dep) ?? []) {
        for (const to of componentsOfUnit.get(unit.id) ?? []) {
          const key = `${from}->${to}`;
          if (from === to || !known.has(from) || !known.has(to) || edgeKeys.has(key)) continue;
          edgeKeys.add(key);
          edges.push({ from, to });
        }
      }
    }
  }

  const incoming = new Map<string, string[]>();
  for (const edge of edges) {
    incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge.from]);
  }

  const byLayer = new Map<number, Component[]>();
  for (const component of components) {
    const layer = layerOf(component.id, incoming, new Set());
    byLayer.set(layer, [...(byLayer.get(layer) ?? []), component]);
  }

  const nodes: DiagramNode[] = [];
  for (const [layer, members] of [...byLayer.entries()].sort((a, b) => a[0] - b[0])) {
    members.forEach((component, i) => {
      nodes.push({
        id: component.id,
        label: component.name,
        sub: component.responsibility,
        x: PAD + layer * (NODE_W + GAP_X),
        y: PAD + i * (NODE_H + GAP_Y),
      });
    });
  }
  return { nodes, edges };
}
