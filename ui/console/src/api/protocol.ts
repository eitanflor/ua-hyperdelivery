// The wire names an agent turn streams under. Mirrors `StreamEvent`, `ToolStatus` and
// `TURN_STOPPED` in src/core/constants.py - tests/unit/test_protocol_constants.py fails if
// the two drift, so change them together.

export const STREAM_EVENTS = [
  "chunk",
  "draft",
  "tool_call",
  "thinking",
  "usage",
  "result",
  "error",
  "code",
  "done",
] as const;

export const TOOL_STATUSES = ["running", "done", "failed", "interrupted"] as const;
export type ToolStatus = (typeof TOOL_STATUSES)[number];

/** A turn's `error` when the person stopped it or the connection dropped. */
export const TURN_STOPPED = "stopped";
