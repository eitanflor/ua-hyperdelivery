import { describe, expect, it } from "vitest";
import { ApiError, TurnError } from "../api/client";
import { describeError, turnFailureText } from "./errors";

describe("describeError", () => {
  it("words an API code, keeping the server message when the entry has none", () => {
    const err = describeError(new ApiError(409, "GITHUB_PAT is not set", "github_not_configured"));
    expect(err).toEqual({
      title: "This isn't set up on the server",
      detail: "GITHUB_PAT is not set",
      action: null,
    });
  });

  it("prefers a code's fixed wording over the server message", () => {
    const err = describeError(new ApiError(409, "raw", "not_at_merge_gate"));
    expect(err.title).toBe("This project moved on without you");
    expect(err.action).toBe("reload");
  });

  it("falls back to the status when the code is missing or unknown", () => {
    expect(describeError(new ApiError(401, "x")).action).toBe("signin");
    expect(describeError(new ApiError(403, "x")).action).toBe("signin");
    expect(describeError(new ApiError(404, "x")).title).toBe("That project is gone");
    expect(describeError(new ApiError(409, "x")).title).toBe("This project moved on without you");
    expect(describeError(new ApiError(429, "x")).title).toBe("Too many requests");
  });

  it("treats 5xx as retryable and uses the server message when present", () => {
    expect(describeError(new ApiError(502, "bad gateway"))).toEqual({
      title: "The agent could not finish",
      detail: "bad gateway",
      action: "retry",
    });
    expect(describeError(new ApiError(500, "")).detail).toMatch(/Nothing was saved/);
  });

  it("passes other 4xx through as a retryable failure", () => {
    expect(describeError(new ApiError(422, "bad body"))).toEqual({
      title: "That did not work",
      detail: "bad body",
      action: "retry",
    });
  });

  it("words a turn failure by its code", () => {
    const err = describeError(new TurnError("boom", "agent_timeout"));
    expect(err.title).toBe("The agent took too long");
    expect(err.action).toBe("retry");
  });

  it("falls through for a turn error with an unknown code", () => {
    const err = describeError(new TurnError("boom", "made_up"));
    expect(err).toEqual({ title: "Something failed", detail: "boom", action: "retry" });
  });

  it("recognizes an aborted run as a cancel, not a failure", () => {
    const err = describeError(new DOMException("aborted", "AbortError"));
    expect(err.title).toBe("Stopped");
    expect(err.action).toBeNull();
  });

  it("reads a TypeError as a lost connection", () => {
    expect(describeError(new TypeError("Failed to fetch")).title).toBe("Lost connection");
  });

  it("describes any other thrown value", () => {
    expect(describeError(new Error("nope")).detail).toBe("nope");
    expect(describeError("plain").detail).toBe("plain");
  });
});

describe("turnFailureText", () => {
  it("uses the code's wording when it has any, else the server message", () => {
    expect(turnFailureText("agent_output_limit", "raw")).toMatch(/ran out of room/);
    expect(turnFailureText("agent_failed", "raw")).toBe("raw");
    expect(turnFailureText(null, "raw")).toBe("raw");
    expect(turnFailureText(undefined, "raw")).toBe("raw");
  });
});
