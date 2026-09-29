import { describe, expect, it } from "vitest";
import type { ChatTurn } from "../store/useProjectsStore";
import { buildTranscript } from "./transcript";

const base = { id: "1", agent: "distill", createdAt: "2026-01-01T00:00:00Z" } as const;

describe("buildTranscript", () => {
  it("is just the new message when there is no history", () => {
    expect(buildTranscript([], "hello")).toBe("User: hello");
  });

  it("carries user turns and the gaps an agent reported, in order", () => {
    const turns: ChatTurn[] = [
      { ...base, role: "user", text: "build a thing" },
      { ...base, role: "agent", content: { completeness: { gaps: ["who uses it", "which data"] } } },
      { ...base, role: "user", text: "" },
      { ...base, role: "agent", content: { completeness: { gaps: [] } } },
    ];
    expect(buildTranscript(turns, "the analysts")).toBe(
      "User: build a thing\nAgent: Missing info - who uses it; which data\nUser: the analysts",
    );
  });
});
