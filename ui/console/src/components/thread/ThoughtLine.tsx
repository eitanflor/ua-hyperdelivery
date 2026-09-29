import { useEffect, useState } from "react";
import { StopIcon } from "@phosphor-icons/react";
import type { ToolCallEvent } from "../../api/client";
import { AGENT_META } from "../../lib/pipeline";
import { narrate } from "../../lib/narration";
import { formatDuration } from "../../lib/time";

const PHRASE_MS = 3000;

/** One line that says what the agent is doing right now, how long it has been at it, and
 * how to stop it.
 *
 * A tool call in flight is narrated in plain words; a document being written says which;
 * otherwise the agent's own working phrases rotate, so a long silent think reads as
 * someone at work rather than a frozen spinner. Only the narrated activity is announced
 * to screen readers - the rotation and the clock would be noise. */
export function ThoughtLine({
  agent,
  startedAt,
  toolCalls,
  draft,
  onStop,
}: {
  agent: string;
  startedAt: string;
  toolCalls: ToolCallEvent[];
  draft?: string;
  /** Absent when stopping is not possible from here (a deployed run has no cancel yet). */
  onStop?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const meta = AGENT_META[agent];
  const elapsed = now - new Date(startedAt).getTime();
  const running = toolCalls.findLast((c) => c.status === "running");
  const activity = running
    ? narrate(running)
    : draft
      ? `Writing the ${(meta?.output ?? "document").toLowerCase()}`
      : null;
  const phrases = meta?.working ?? ["Working"];
  const phrase = activity ?? phrases[Math.floor(elapsed / PHRASE_MS) % phrases.length];

  return (
    <div className="mt-2 flex min-h-6 items-center gap-2.5 text-xs">
      <span className="text-shimmer truncate">{phrase}…</span>
      <span className="tabular shrink-0 text-2xs text-fg-subtle">{formatDuration(elapsed)}</span>
      {onStop && (
        <button
          type="button"
          onClick={onStop}
          aria-label={`Stop ${meta?.name ?? agent}`}
          className="hit-area ml-auto flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-0.5 text-2xs font-medium text-fg-muted transition-colors hover:bg-sunken hover:text-fg"
        >
          <StopIcon weight="fill" className="size-3" />
          Stop
        </button>
      )}
      <span className="sr-only" aria-live="polite">
        {activity ?? ""}
      </span>
    </div>
  );
}
