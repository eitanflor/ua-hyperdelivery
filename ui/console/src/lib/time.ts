const WHEN = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

/** "23 Sept 2026, 14:51" - one full-date format everywhere, so a signature line and its
 * tooltip never disagree about how a date is written. */
export function formatWhen(when: Date | string): string {
  return WHEN.format(typeof when === "string" ? new Date(when) : when);
}

const RELATIVE = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

/** "3 hours ago", "yesterday" - how long something has been waiting reads better than a
 * timestamp when the question is "is this stuck?". */
export function timeAgo(iso: string, now = Date.now()): string {
  const elapsed = new Date(iso).getTime() - now;
  for (const [unit, ms] of STEPS) {
    if (Math.abs(elapsed) >= ms) return RELATIVE.format(Math.round(elapsed / ms), unit);
  }
  return "just now";
}

/** "12s", "1m 04s" - never sub-second precision, nobody signing off on a gate cares. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds.toString().padStart(2, "0")}s` : `${seconds}s`;
}
