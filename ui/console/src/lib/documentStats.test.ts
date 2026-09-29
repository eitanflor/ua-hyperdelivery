import { describe, expect, it } from "vitest";
import type { Build, Builds } from "../api/types";
import { documentStats, isWip } from "./documentStats";

const build = (over: Partial<Build> = {}): Build => ({
  group_id: "g",
  number: 1,
  url: "https://github.com/o/r/pull/1",
  title: "Add thing",
  unit_ids: [],
  issue_numbers: [],
  state: "open",
  checks: "pending",
  draft: false,
  ...over,
});

const stat = (stats: ReturnType<typeof documentStats>, label: string) => stats.find((s) => s.label === label);

describe("isWip", () => {
  it("flags an open [WIP] title, case- and space-insensitively", () => {
    expect(isWip(build({ title: "[WIP] thing" }))).toBe(true);
    expect(isWip(build({ title: "  [wip] thing" }))).toBe(true);
    expect(isWip(build({ title: "thing [WIP]" }))).toBe(false);
    expect(isWip(build({ title: null }))).toBe(false);
  });

  it("is never WIP once merged or closed", () => {
    expect(isWip(build({ title: "[WIP] x", state: "merged" }))).toBe(false);
    expect(isWip(build({ title: "[WIP] x", state: "closed" }))).toBe(false);
  });
});

describe("documentStats", () => {
  it("returns nothing for an unknown agent", () => {
    expect(documentStats("nope", {})).toEqual([]);
  });

  it("counts a distill document and warns on open questions", () => {
    const stats = documentStats("distill", {
      requirements: [{}, {}],
      open_questions: ["one"],
      evidence: [{}],
      completeness: { score: 0.756 },
    });
    expect(stat(stats, "requirements")?.value).toBe("2");
    expect(stat(stats, "complete")?.value).toBe("76%");
    expect(stat(stats, "open question")).toMatchObject({ value: "1", tone: "warning" });
    expect(stat(stats, "sources cited")?.value).toBe("1");
  });

  it("omits completeness when absent and pluralizes zero open questions", () => {
    const stats = documentStats("distill", {});
    expect(stat(stats, "complete")).toBeUndefined();
    expect(stat(stats, "open questions")).toMatchObject({ value: "0", tone: undefined });
  });

  it("counts a blueprint and a showroom document", () => {
    expect(documentStats("blueprint", { units_of_work: [{}], api_contracts: [{}, {}] }).map((s) => s.value)).toEqual([
      "1", "0", "0", "2",
    ]);
    expect(documentStats("showroom", { talk_track: [{}], demo_data: [{}, {}] }).map((s) => s.value)).toEqual(["1", "2"]);
  });

  it("marks blockers as danger and splits them from other findings", () => {
    const stats = documentStats("review", {
      findings: [{ severity: "blocker" }, { severity: "minor" }, { severity: "minor" }],
      coverage: [{ met: true }, { met: true }],
    });
    expect(stat(stats, "must fix")).toMatchObject({ value: "1", tone: "danger" });
    expect(stat(stats, "other findings")?.value).toBe("2");
    expect(stat(stats, "requirements met")).toMatchObject({ value: "2/2", tone: undefined });
  });

  it("tones requirement coverage by how much is met", () => {
    const met = (flags: boolean[]) =>
      stat(documentStats("review", { coverage: flags.map((m) => ({ met: m })) }), "requirements met");
    expect(met([true, false])?.tone).toBe("warning");
    expect(met([false, false])?.tone).toBe("danger");
  });

  it("counts builds ready, excluding closed and WIP ones", () => {
    const builds = {
      repository: "o/r",
      builds: [build(), build({ number: 2, title: "[WIP] x" }), build({ number: 3, state: "closed" })],
    } as Builds;
    expect(stat(documentStats("review", {}, builds), "builds ready")?.value).toBe("1/3");
    expect(stat(documentStats("review", {}), "builds ready")).toBeUndefined();
  });
});
