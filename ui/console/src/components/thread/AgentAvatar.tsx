import { AGENT_META } from "../../lib/pipeline";
import { AgentFace, type FaceState } from "../agents/AgentFace";
import { Tooltip } from "../ui/Tooltip";
import { cn } from "../../lib/cn";

/** An agent's identity in the thread. The face and tint are the "who"; the conversation
 * itself stays one continuous thread. Hovering says who that is, so the crew never needs
 * remembering from the first screen. */
export function AgentAvatar({
  agent,
  state = "idle",
  className,
}: {
  agent: string;
  state?: FaceState;
  className?: string;
}) {
  const meta = AGENT_META[agent];
  if (!meta) {
    return <span className={cn("size-7 shrink-0 rounded-full bg-sunken", className)} />;
  }
  return (
    <Tooltip
      side="right"
      content={
        <span className="flex max-w-64 flex-col gap-0.5">
          <span>
            <span className="stencil">{meta.name}</span>
            <span className="text-fg-muted"> · {meta.title}</span>
          </span>
          <span className="leading-relaxed text-fg-muted">{meta.role}</span>
        </span>
      }
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          meta.bg,
          meta.fg,
          className,
        )}
      >
        <AgentFace agent={meta.face} state={state} className="size-5" />
        <span className="sr-only">{meta.name}</span>
      </span>
    </Tooltip>
  );
}
