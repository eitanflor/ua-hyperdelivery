import { describe, expect, it } from "vitest";
import { formatDuration, timeAgo } from "./time";

describe("formatDuration", () => {
  it("shows seconds under a minute and pads seconds after one", () => {
    expect(formatDuration(12_000)).toBe("12s");
    expect(formatDuration(64_000)).toBe("1m 04s");
    expect(formatDuration(600_000)).toBe("10m 00s");
  });

  it("rounds to the nearest second and never goes negative", () => {
    expect(formatDuration(1_499)).toBe("1s");
    expect(formatDuration(1_500)).toBe("2s");
    expect(formatDuration(-5_000)).toBe("0s");
  });
});

describe("timeAgo", () => {
  const now = Date.parse("2026-01-10T12:00:00Z");
  const ago = (ms: number) => timeAgo(new Date(now - ms).toISOString(), now);

  it("says just now inside a minute", () => {
    expect(ago(30_000)).toBe("just now");
  });

  it("picks the largest unit that fits", () => {
    expect(ago(5 * 60_000)).toBe(new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(-5, "minute"));
    expect(ago(3 * 3_600_000)).toBe(new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(-3, "hour"));
    expect(ago(2 * 86_400_000)).toBe(new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(-2, "day"));
  });
});
