import { describe, expect, it } from "vitest";
import type { UnitOfWork } from "../api/artifacts";
import { buildOrder } from "./plainLabels";

const unit = (id: string, depends_on: string[] = []): UnitOfWork => ({ id, title: id, description: "", depends_on });
const ids = (units: UnitOfWork[]) => units.map((u) => u.id);

describe("buildOrder", () => {
  it("puts each task after everything it needs, keeping plan order among equals", () => {
    const plan = [unit("c", ["a", "b"]), unit("b", ["a"]), unit("a"), unit("d")];
    expect(ids(buildOrder(plan))).toEqual(["a", "d", "b", "c"]);
  });

  it("ignores a dependency on a task that is not in the plan", () => {
    expect(ids(buildOrder([unit("a", ["ghost"])]))).toEqual(["a"]);
  });

  it("appends a cycle in plan order instead of dropping it", () => {
    const plan = [unit("x", ["y"]), unit("y", ["x"]), unit("z")];
    expect(ids(buildOrder(plan))).toEqual(["z", "x", "y"]);
  });

  it("handles an empty plan", () => {
    expect(buildOrder([])).toEqual([]);
  });
});
