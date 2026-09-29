import dagre from "@dagrejs/dagre";
import type { Component, UnitOfWork } from "../api/artifacts";

export interface Edge {
  from: string;
  to: string;
}

export interface Box {
  id: string;
  width: number;
  height: number;
}

/** Every coordinate on a 4px grid - what keeps a laid-out diagram from looking generated
 * (docs/design/references/diagram-design.md). */
const snap = (n: number) => Math.round(n / 4) * 4;

/** Top-left positions for a layered left-to-right layout. Pure and deterministic: the same
 * graph always lays out the same way, which matters for a view of a gated document. */
export function layoutGraph(
  boxes: Box[],
  edges: Edge[],
  { rankGap = 72, nodeGap = 24 }: { rankGap?: number; nodeGap?: number } = {},
): Map<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", ranksep: rankGap, nodesep: nodeGap, marginx: 0, marginy: 0 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const box of boxes) g.setNode(box.id, { width: box.width, height: box.height });
  for (const edge of edges) {
    if (g.hasNode(edge.from) && g.hasNode(edge.to)) g.setEdge(edge.from, edge.to);
  }
  dagre.layout(g);
  const positions = new Map<string, { x: number; y: number }>();
  for (const box of boxes) {
    const node = g.node(box.id) as { x: number; y: number } | undefined;
    if (node) positions.set(box.id, { x: snap(node.x - box.width / 2), y: snap(node.y - box.height / 2) });
  }
  return positions;
}

/** Component-to-component dependencies, lifted from the build tasks that build them - the
 * blueprint states unit dependencies, not component ones, so the architecture is derived
 * rather than described by the model. */
export function componentEdges(components: Component[], units: UnitOfWork[]): Edge[] {
  const componentsOf = new Map(units.map((u) => [u.id, u.component_ids ?? []]));
  const known = new Set(components.map((c) => c.id));
  const seen = new Set<string>();
  const edges: Edge[] = [];
  for (const unit of units) {
    for (const dep of unit.depends_on) {
      for (const from of componentsOf.get(dep) ?? []) {
        for (const to of componentsOf.get(unit.id) ?? []) {
          const key = `${from}->${to}`;
          if (from === to || !known.has(from) || !known.has(to) || seen.has(key)) continue;
          seen.add(key);
          edges.push({ from, to });
        }
      }
    }
  }
  return edges;
}

/** Tasks that depend on each other in a loop, found as strongly connected components
 * (Tarjan). A loop has no valid build order, so it is flagged rather than laid out. */
function cyclic(ids: string[], next: Map<string, string[]>): Set<string> {
  let index = 0;
  const order = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const inCycle = new Set<string>();

  const visit = (id: string) => {
    order.set(id, index);
    low.set(id, index);
    index += 1;
    stack.push(id);
    onStack.add(id);
    for (const to of next.get(id) ?? []) {
      if (!order.has(to)) {
        visit(to);
        low.set(id, Math.min(low.get(id)!, low.get(to)!));
      } else if (onStack.has(to)) {
        low.set(id, Math.min(low.get(id)!, order.get(to)!));
      }
    }
    if (low.get(id) === order.get(id)) {
      const members: string[] = [];
      let member: string | undefined;
      do {
        member = stack.pop();
        if (member === undefined) break;
        onStack.delete(member);
        members.push(member);
      } while (member !== id);
      if (members.length > 1 || (next.get(id) ?? []).includes(id)) members.forEach((m) => inCycle.add(m));
    }
  };

  for (const id of ids) if (!order.has(id)) visit(id);
  return inCycle;
}

export interface UnitGraph {
  edges: Edge[];
  /** 0 for a task that can start now; otherwise one more than its latest prerequisite. */
  rank: Map<string, number>;
  /** The longest chain of tasks - the one that sets how long the build takes. */
  critical: Set<string>;
  criticalEdges: Set<string>;
  cycles: Set<string>;
}

/** The build tasks as a dependency graph: ranks, the critical path and any loops. */
export function unitGraph(units: UnitOfWork[]): UnitGraph {
  const ids = units.map((u) => u.id);
  const known = new Set(ids);
  const edges = units.flatMap((u) =>
    u.depends_on.filter((dep) => known.has(dep)).map((dep) => ({ from: dep, to: u.id })),
  );
  const next = new Map<string, string[]>();
  for (const e of edges) next.set(e.from, [...(next.get(e.from) ?? []), e.to]);
  const cycles = cyclic(ids, next);

  // longest path over the acyclic part, in plan order among equals
  const rank = new Map<string, number>();
  const via = new Map<string, string>();
  const remaining = units.filter((u) => !cycles.has(u.id));
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const unit of remaining) {
      if (rank.has(unit.id)) continue;
      const deps = unit.depends_on.filter((d) => known.has(d) && !cycles.has(d));
      if (!deps.every((d) => rank.has(d))) continue;
      let best = -1;
      for (const d of deps) {
        if (rank.get(d)! > best) {
          best = rank.get(d)!;
          via.set(unit.id, d);
        }
      }
      rank.set(unit.id, best + 1);
      progressed = true;
    }
  }

  const critical = new Set<string>();
  const criticalEdges = new Set<string>();
  let end: string | undefined;
  for (const [id, r] of rank) if (end === undefined || r > rank.get(end)!) end = id;
  while (end !== undefined) {
    critical.add(end);
    const prev = via.get(end);
    if (prev !== undefined) criticalEdges.add(`${prev}->${end}`);
    end = prev;
  }
  // a single task is not a path worth highlighting
  if (critical.size < 2) {
    critical.clear();
    criticalEdges.clear();
  }
  return { edges, rank, critical, criticalEdges, cycles };
}

/** The build order as steps a reader can follow: step 1 is everything that can start now,
 * each later step what the previous ones unlock. Tasks caught in a loop come last. */
export function buildSteps(units: UnitOfWork[]): { step: number; units: UnitOfWork[] }[] {
  const { rank, cycles } = unitGraph(units);
  const steps = new Map<number, UnitOfWork[]>();
  for (const unit of units) {
    const r = cycles.has(unit.id) ? Number.POSITIVE_INFINITY : (rank.get(unit.id) ?? Number.POSITIVE_INFINITY);
    steps.set(r, [...(steps.get(r) ?? []), unit]);
  }
  return [...steps.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, members], i) => ({ step: i + 1, units: members }));
}
