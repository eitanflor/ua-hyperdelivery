import { describe, expect, it } from "vitest";
import type { Artifact } from "../api/types";
import { artifactStats, artifactTitle, composeReply, humanizeKey, renderListItem } from "./formatArtifact";

describe("artifactTitle", () => {
  it("uses the document title, falling back to the agent", () => {
    expect(artifactTitle({ agent: "distill", content: { title: "Line plan" } } as unknown as Artifact)).toBe("Line plan");
    expect(artifactTitle({ agent: "distill", content: {} } as unknown as Artifact)).toBe("distill");
  });
});

describe("artifactStats", () => {
  it("shows at most three non-empty counts, singular at one", () => {
    const stats = artifactStats({
      requirements: [{}],
      rules: [{}, {}],
      components: [{}],
      units_of_work: [{}],
    });
    expect(stats).toEqual([
      { label: "requirement", value: 1 },
      { label: "rules", value: 2 },
      { label: "component", value: 1 },
    ]);
  });

  it("reports coverage even when nothing is met", () => {
    expect(artifactStats({ coverage: [{ met: false }, { met: false }] })).toEqual([{ label: "of 2 met", value: 0 }]);
  });

  it("is empty for an empty document", () => {
    expect(artifactStats({})).toEqual([]);
  });
});

describe("composeReply", () => {
  it("asks for input when nothing was drafted", () => {
    expect(composeReply({})).toMatch(/Tell me what you're trying to build/);
    expect(composeReply({}, 1)).toMatch(/there's a question/);
    expect(composeReply({ completeness: { questions: [{}, {}] } })).toMatch(/there are 2 questions/);
  });

  it("calls a draft with gaps a first draft and counts the gaps", () => {
    const reply = composeReply({ title: "Plan", requirements: [{}], completeness: { gaps: ["a", "b"] } });
    expect(reply).toMatch(/first draft of "Plan"/);
    expect(reply).toMatch(/2 things still need answering/);
    expect(composeReply({ requirements: [{}], completeness: { gaps: ["a"] } })).toMatch(/1 thing still needs answering/);
  });

  it("summarizes a build check by requirements met and blockers", () => {
    const met = { coverage: [{ met: true }], findings: [{ severity: "blocker" }] };
    expect(composeReply(met)).toBe("Build check done - all 1 requirement met, but 1 finding must be fixed.");
    const partial = { coverage: [{ met: true }, { met: false }], findings: [] };
    expect(composeReply(partial)).toBe("Build check done - 1 of 2 requirements met. The quality report says what is still missing.");
  });

  it("summarizes each kind of finished document", () => {
    expect(composeReply({ units_of_work: [{}, {}], components: [{}] })).toBe("Build plan ready - 2 build tasks across 1 component.");
    expect(composeReply({ talk_track: [{}] })).toBe("Demo script ready - 1 walkthrough step.");
    expect(composeReply({ requirements: [{}, {}], open_questions: [{}] })).toBe(
      "Requirements brief ready - 2 requirements, 1 open question.",
    );
    expect(composeReply({ requirements: [{}] })).toBe("Requirements brief ready - 1 requirement, nothing left open.");
  });

  it("falls back to a plain done line", () => {
    expect(composeReply({ rules: [{}], title: "X" })).toBe('Done - "X" is ready.');
    expect(composeReply({ rules: [{}] })).toBe('Done - "this" is ready.');
  });
});

describe("humanizeKey", () => {
  it("title-cases a snake_case field", () => {
    expect(humanizeKey("gate_criteria")).toBe("Gate Criteria");
  });
});

describe("renderListItem", () => {
  it("renders strings, id+body pairs and bodies without an id", () => {
    expect(renderListItem("plain")).toBe("plain");
    expect(renderListItem({ id: "R1", description: "do it" })).toBe("R1: do it");
    expect(renderListItem({ criterion_id: "C1", rule: "must" })).toBe("C1: must");
    expect(renderListItem({ text: "just text" })).toBe("just text");
  });

  it("falls back to JSON when there is no recognizable body", () => {
    expect(renderListItem({ a: 1 })).toBe('{"a":1}');
    expect(renderListItem(3)).toBe("3");
  });
});
