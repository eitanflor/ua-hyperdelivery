import { describe, expect, it } from "vitest";
import { paragraphBreaks } from "./streamText";

describe("paragraphBreaks", () => {
  it("passes text through untouched when no tool call intervened", () => {
    const breaks = paragraphBreaks();
    expect([breaks.chunk("a"), breaks.chunk("b")]).toEqual(["a", "b"]);
  });

  it("puts a paragraph break before the first chunk after a tool call", () => {
    const breaks = paragraphBreaks();
    breaks.chunk("basics:");
    breaks.toolCall({ status: "running" });
    expect(breaks.chunk("I checked")).toBe("\n\nI checked");
    expect(breaks.chunk(" more")).toBe(" more");
  });

  it("does not break before the first text of a turn or after a newline", () => {
    const first = paragraphBreaks();
    first.toolCall({ status: "running" });
    expect(first.chunk("hello")).toBe("hello");

    const after = paragraphBreaks();
    after.chunk("done\n");
    after.toolCall({ status: "running" });
    expect(after.chunk("next")).toBe("next");
  });

  it("only a running call arms the break, and empty chunks change nothing", () => {
    const breaks = paragraphBreaks();
    breaks.chunk("x");
    breaks.toolCall({ status: "done" });
    expect(breaks.chunk("y")).toBe("y");
    breaks.toolCall({ status: "running" });
    expect(breaks.chunk("")).toBe("");
    expect(breaks.chunk("z")).toBe("\n\nz");
  });
});
