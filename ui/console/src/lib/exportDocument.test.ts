import { describe, expect, it } from "vitest";
import { exportName, toMarkdown } from "./exportDocument";

const meta = { projectName: "Size Run Planner", output: "Requirements brief", version: 3 };

describe("exportName", () => {
  it("names the project, the document and its version", () => {
    expect(exportName(meta)).toBe("Size Run Planner - Requirements brief v3");
  });

  it("strips characters a file name cannot hold and collapses spaces", () => {
    expect(exportName({ ...meta, projectName: 'A/B: "C"?  D' })).toBe("A B C D - Requirements brief v3");
  });
});

describe("toMarkdown", () => {
  it("heads the document with its title and provenance, falling back to the output name", () => {
    const md = toMarkdown("distill", { title: "Line plan" }, meta);
    expect(md.startsWith("# Line plan\n\n*Requirements brief - Size Run Planner - version 3*")).toBe(true);
    expect(toMarkdown("distill", {}, meta).startsWith("# Requirements brief\n")).toBe(true);
  });

  it("renders a requirements brief with its why, criteria and evidence", () => {
    const md = toMarkdown(
      "distill",
      {
        objective: "Plan sizes",
        requirements: [{ id: "R1", description: "Show sizes" }, { id: "R2", description: "Export" }],
        business_value: [{ requirement_id: "R1", use_case: "planning", roi: "less rework" }],
        acceptance_criteria: [{ requirement_id: "R1", description: "sizes visible" }],
        evidence: [{ requirement_id: "R1", evidence: "the FSD says so", source: "source_document" }],
        open_questions: ["Which region?"],
      },
      meta,
    );
    expect(md).toContain("## Objective\n\nPlan sizes");
    expect(md).toContain("### R1 - Show sizes");
    expect(md).toContain("*Why it matters:* planning - less rework");
    expect(md).toContain("- [ ] sizes visible");
    expect(md).toContain("> the FSD says so");
    expect(md).toContain("### R2 - Export");
    expect(md).toContain("## Open questions\n\n- Which region?");
    expect(md).not.toContain("## Scope");
  });

  it("orders the build plan by dependency, not by how it was written", () => {
    const md = toMarkdown(
      "blueprint",
      {
        units_of_work: [
          { id: "b", title: "Second", description: "line one\nline two", depends_on: ["a"] },
          { id: "a", title: "First", description: "go", depends_on: [] },
        ],
        components: [{ id: "c", name: "API", responsibility: "serves" }],
        api_contracts: [{ method: "GET", path: "/sizes", summary: "list" }],
      },
      meta,
    );
    expect(md).toContain("1. **First** - go\n2. **Second** - line one");
    expect(md).toContain("- **API** - serves");
    expect(md).toContain("- `GET /sizes` - list");
  });

  it("puts the worst review findings first and counts coverage", () => {
    const md = toMarkdown(
      "review",
      {
        coverage: [{ requirement_id: "R1", met: true }, { requirement_id: "R2", met: false }],
        findings: [
          { severity: "minor", description: "nit" },
          { severity: "blocker", description: "broken", requirement_id: "R2" },
        ],
      },
      meta,
    );
    expect(md).toContain("1 of 2 requirements met.");
    expect(md).toContain("- [x] R1");
    expect(md).toContain("- [ ] R2");
    expect(md.indexOf("broken")).toBeLessThan(md.indexOf("nit"));
    expect(md).toContain("- **Must fix** - broken (R2)");
  });

  it("renders a demo script", () => {
    const md = toMarkdown(
      "showroom",
      {
        summary: "A tour",
        talk_track: [{ narration: "Open the app", requirement_id: "R1" }],
        demo_data: [{ entity: "Store", description: "10 stores" }],
      },
      meta,
    );
    expect(md).toContain("1. Open the app *(R1)*");
    expect(md).toContain("- **Store** - 10 stores");
  });

  it("falls back to fenced JSON for an agent it has no layout for, and never leaves blank runs", () => {
    const md = toMarkdown("mystery", { a: 1 }, meta);
    expect(md).toContain('```json\n{\n  "a": 1\n}\n```');
    expect(md).not.toMatch(/\n{3,}/);
  });
});
