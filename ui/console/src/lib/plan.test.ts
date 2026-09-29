import { describe, expect, it } from "vitest";
import type { ToolCallEvent } from "../api/client";
import { PLAN_TOOL, planSteps, QUESTIONS_TOOL, questionsFromToolCalls, withoutPlan } from "./plan";

const call = (name: string, result?: unknown, id = name): ToolCallEvent => ({ id, name, status: "done", result });

describe("planSteps", () => {
  it("returns null when the agent never stated a plan", () => {
    expect(planSteps(undefined)).toBeNull();
    expect(planSteps([call("search_code")])).toBeNull();
  });

  it("uses the newest call that carries a result, skipping empty running updates", () => {
    const calls = [
      call(PLAN_TOOL, { steps: { Read: "done", Write: "pending" } }, "1"),
      call(PLAN_TOOL, { steps: { Read: "done", Write: "in_progress" } }, "2"),
      { id: "3", name: PLAN_TOOL, status: "running" as const },
    ];
    expect(planSteps(calls)).toEqual([
      { title: "Read", status: "done" },
      { title: "Write", status: "in_progress" },
    ]);
  });

  it("closes everything out once the turn has settled", () => {
    const calls = [call(PLAN_TOOL, { steps: { Read: "done", Write: "pending" } })];
    expect(planSteps(calls, true)?.every((s) => s.status === "done")).toBe(true);
  });

  it("ignores malformed results", () => {
    expect(planSteps([call(PLAN_TOOL, { steps: ["a"] })])).toBeNull();
    expect(planSteps([call(PLAN_TOOL, { steps: { a: 1 } })])).toBeNull();
    expect(planSteps([call(PLAN_TOOL, "nope")])).toBeNull();
  });
});

describe("withoutPlan", () => {
  it("drops the plan and question calls, keeps the rest", () => {
    const calls = [call(PLAN_TOOL), call(QUESTIONS_TOOL), call("search_code")];
    expect(withoutPlan(calls).map((c) => c.name)).toEqual(["search_code"]);
    expect(withoutPlan(undefined)).toEqual([]);
  });
});

describe("questionsFromToolCalls", () => {
  const q = { id: "q1", question: "Which?", options: ["a"], multi_select: false };

  it("reads the newest questions call", () => {
    const calls = [call(QUESTIONS_TOOL, { questions: [] }, "1"), call(QUESTIONS_TOOL, { questions: [q] }, "2")];
    expect(questionsFromToolCalls(calls)).toEqual([q]);
  });

  it("returns an empty list when there is no call or no questions array", () => {
    expect(questionsFromToolCalls(undefined)).toEqual([]);
    expect(questionsFromToolCalls([call(QUESTIONS_TOOL, {})])).toEqual([]);
  });
});
