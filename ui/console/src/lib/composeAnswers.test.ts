import { describe, expect, it } from "vitest";
import type { OpenQuestion } from "../api/artifacts";
import { composeAnswers, mergeAnswers, toggleOption } from "./composeAnswers";

const single: OpenQuestion = { id: "q1", question: "Which store?", options: ["Snowflake", "Postgres"], multi_select: false };
const multi: OpenQuestion = { id: "q2", question: "Which regions?", options: ["US", "EU"], multi_select: true };

describe("toggleOption", () => {
  it("keeps only the latest pick on a single-select question", () => {
    const first = toggleOption(new Map(), single, "Snowflake");
    expect(toggleOption(first, single, "Postgres").get("q1")).toEqual(["Postgres"]);
  });

  it("accumulates and unpicks on a multi-select question", () => {
    const both = toggleOption(toggleOption(new Map(), multi, "US"), multi, "EU");
    expect(both.get("q2")).toEqual(["US", "EU"]);
    expect(toggleOption(both, multi, "US").get("q2")).toEqual(["EU"]);
  });

  it("does not mutate the input map", () => {
    const start = new Map<string, string[]>();
    toggleOption(start, single, "Snowflake");
    expect(start.size).toBe(0);
  });
});

describe("mergeAnswers", () => {
  it("adds a trimmed typed answer as one more pick and drops closed questions", () => {
    const merged = mergeAnswers([single], new Map([["q1", ["Snowflake"]], ["gone", ["x"]]]), new Map([["q1", "  DuckDB "]]));
    expect([...merged]).toEqual([["q1", ["Snowflake", "DuckDB"]]]);
  });

  it("ignores a blank typed answer", () => {
    expect(mergeAnswers([single], new Map(), new Map([["q1", "   "]])).get("q1")).toEqual([]);
  });
});

describe("composeAnswers", () => {
  it("pairs each answer with its question and skips unanswered ones", () => {
    const answers = new Map([["q1", ["Snowflake"]], ["q2", ["US", "EU"]]]);
    expect(composeAnswers([single, multi], answers)).toBe("Which store?\nSnowflake\n\nWhich regions?\nUS, EU");
    expect(composeAnswers([single, multi], new Map([["q2", ["US"]]]))).toBe("Which regions?\nUS");
  });

  it("returns an empty string when nothing is answered", () => {
    expect(composeAnswers([single], new Map())).toBe("");
  });
});
