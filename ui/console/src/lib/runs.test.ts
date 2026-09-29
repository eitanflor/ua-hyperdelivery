import { describe, expect, it } from "vitest";
import type { TurnRecord } from "../api/client";
import type { ChatTurn } from "../store/useProjectsStore";
import { conversationFromRecords, recordFor } from "./runs";

const record = (over: Partial<TurnRecord> = {}): TurnRecord => ({
  agent: "distill",
  started_at: "2026-01-01T10:00:00.000Z",
  message: null,
  duration_ms: null,
  text: "",
  tool_calls: [],
  usage: null,
  error: null,
  error_code: null,
  ...over,
});

const turn = (over: Partial<ChatTurn> = {}): ChatTurn => ({
  id: "t1",
  role: "agent",
  agent: "distill",
  createdAt: "2026-01-01T10:00:00.000Z",
  ...over,
});

describe("recordFor", () => {
  it("matches by agent and nearest start, handing each record out once", () => {
    const near = record({ started_at: "2026-01-01T10:00:01.000Z", text: "a" });
    const far = record({ started_at: "2026-01-01T10:03:00.000Z", text: "b" });
    const taken = new Set<TurnRecord>();
    expect(recordFor(turn(), [far, near], taken)).toBe(near);
    expect(recordFor(turn(), [far, near], taken)).toBe(far);
    expect(recordFor(turn(), [far, near], taken)).toBeUndefined();
  });

  it("ignores other agents, message-only records and records outside the window", () => {
    const records = [
      record({ agent: "blueprint", text: "x" }),
      record({ message: "hi" }),
      record({ started_at: "2026-01-01T10:06:00.000Z", text: "late" }),
    ];
    expect(recordFor(turn(), records, new Set())).toBeUndefined();
  });

  it("counts a tool call, usage or error as output", () => {
    const withError = record({ error: "boom" });
    expect(recordFor(turn(), [withError], new Set())).toBe(withError);
  });
});

describe("conversationFromRecords", () => {
  it("builds a thread from records when this browser has none", () => {
    const thread = conversationFromRecords([], [record({ message: "hello", text: "hi there", duration_ms: 900 })]);
    expect(thread.map((t) => [t.role, t.text])).toEqual([
      ["user", "hello"],
      ["agent", "hi there"],
    ]);
    expect(thread[0]!.createdAt < thread[1]!.createdAt).toBe(true);
    expect(thread[1]!.durationMs).toBe(900);
  });

  it("returns the same array when the records add nothing", () => {
    const local = [turn({ text: "hi there" })];
    expect(conversationFromRecords(local, [record({ text: "hi there" })])).toBe(local);
  });

  it("does not repeat a message this browser already has", () => {
    const local = [
      turn({ id: "u", role: "user", text: "hello", createdAt: "2026-01-01T09:59:59.999Z" }),
      turn({ id: "a", text: "hi there" }),
    ];
    expect(conversationFromRecords(local, [record({ message: "hello", text: "hi there" })])).toBe(local);
  });

  it("is stable when called again with the same records", () => {
    const first = conversationFromRecords([], [record({ message: "hello", text: "hi" })]);
    expect(conversationFromRecords(first, [record({ message: "hello", text: "hi" })])).toBe(first);
  });

  it("carries a failed turn's error and code", () => {
    const [failed] = conversationFromRecords([], [record({ error: "slow", error_code: "agent_timeout" })]);
    expect(failed).toMatchObject({ error: "slow", errorCode: "agent_timeout" });
  });

  it("orders added turns by time", () => {
    const thread = conversationFromRecords(
      [turn({ id: "later", createdAt: "2026-01-01T10:20:00.000Z", text: "later" })],
      [record({ text: "earlier" })],
    );
    expect(thread.map((t) => t.text)).toEqual(["earlier", "later"]);
  });
});
