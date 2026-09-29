import { describe, expect, it } from "vitest";
import type { Component, UnitOfWork } from "../api/artifacts";
import { buildSteps, componentEdges, layoutGraph, unitGraph } from "./graphs";

const unit = (id: string, depends_on: string[] = [], component_ids?: string[]): UnitOfWork => ({
  id,
  title: id,
  description: "",
  depends_on,
  component_ids,
});
const component = (id: string) => ({ id, name: id, responsibility: "" }) as Component;

describe("layoutGraph", () => {
  const boxes = [
    { id: "a", width: 100, height: 40 },
    { id: "b", width: 100, height: 40 },
    { id: "c", width: 100, height: 40 },
  ];
  const edges = [{ from: "a", to: "b" }, { from: "b", to: "c" }];

  it("lays a chain out left to right on a 4px grid", () => {
    const pos = layoutGraph(boxes, edges);
    expect(pos.get("a")!.x).toBeLessThan(pos.get("b")!.x);
    expect(pos.get("b")!.x).toBeLessThan(pos.get("c")!.x);
    for (const { x, y } of pos.values()) {
      expect(x % 4).toBe(0);
      expect(y % 4).toBe(0);
    }
  });

  it("is deterministic", () => {
    expect([...layoutGraph(boxes, edges)]).toEqual([...layoutGraph(boxes, edges)]);
  });

  it("ignores an edge to a box that does not exist", () => {
    expect(layoutGraph(boxes, [{ from: "a", to: "ghost" }]).size).toBe(3);
  });

  it("honors the gaps it is given", () => {
    const tight = layoutGraph(boxes, edges, { rankGap: 8 });
    const loose = layoutGraph(boxes, edges, { rankGap: 200 });
    expect(loose.get("c")!.x).toBeGreaterThan(tight.get("c")!.x);
  });
});

describe("componentEdges", () => {
  it("lifts unit dependencies to the components that build them, once each", () => {
    const units = [
      unit("u1", [], ["db"]),
      unit("u2", ["u1"], ["api"]),
      unit("u3", ["u1"], ["api"]),
    ];
    expect(componentEdges([component("db"), component("api")], units)).toEqual([{ from: "db", to: "api" }]);
  });

  it("skips self edges, unknown components and units with no components", () => {
    const units = [unit("u1", [], ["db"]), unit("u2", ["u1"], ["db", "ghost"]), unit("u3", ["u1"])];
    expect(componentEdges([component("db")], units)).toEqual([]);
  });
});

describe("unitGraph", () => {
  it("ranks a task one past its latest prerequisite", () => {
    const { rank } = unitGraph([unit("a"), unit("b", ["a"]), unit("c", ["a", "b"]), unit("d")]);
    expect(Object.fromEntries(rank)).toEqual({ a: 0, b: 1, c: 2, d: 0 });
  });

  it("marks the longest chain as critical, edges included", () => {
    const g = unitGraph([unit("a"), unit("b", ["a"]), unit("c", ["b"]), unit("x")]);
    expect([...g.critical].sort()).toEqual(["a", "b", "c"]);
    expect([...g.criticalEdges].sort()).toEqual(["a->b", "b->c"]);
  });

  it("does not highlight a path when no task depends on another", () => {
    const g = unitGraph([unit("a"), unit("b")]);
    expect(g.critical.size).toBe(0);
    expect(g.criticalEdges.size).toBe(0);
  });

  it("flags tasks in a loop, and a task that depends on itself, and leaves them unranked", () => {
    const g = unitGraph([unit("a", ["b"]), unit("b", ["a"]), unit("s", ["s"]), unit("ok")]);
    expect([...g.cycles].sort()).toEqual(["a", "b", "s"]);
    expect([...g.rank.keys()]).toEqual(["ok"]);
  });

  it("drops edges to tasks that are not in the plan", () => {
    expect(unitGraph([unit("a", ["ghost"])]).edges).toEqual([]);
  });
});

describe("buildSteps", () => {
  const ids = (steps: ReturnType<typeof buildSteps>) => steps.map((s) => s.units.map((u) => u.id));

  it("groups by what each step unlocks", () => {
    const steps = buildSteps([unit("a"), unit("d"), unit("b", ["a"]), unit("c", ["b"])]);
    expect(steps.map((s) => s.step)).toEqual([1, 2, 3]);
    expect(ids(steps)).toEqual([["a", "d"], ["b"], ["c"]]);
  });

  it("puts tasks caught in a loop in the last step", () => {
    expect(ids(buildSteps([unit("a", ["b"]), unit("b", ["a"]), unit("ok")]))).toEqual([["ok"], ["a", "b"]]);
  });

  it("is empty for no tasks", () => {
    expect(buildSteps([])).toEqual([]);
  });
});
