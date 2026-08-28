import { AGENT_META } from "../../lib/pipeline";
import { AgentFace, type FaceState } from "../agents/AgentFace";
import { cn } from "../../lib/cn";

/** An agent's identity in the thread. The face and tint are the "who"; the conversation
 * itself stays one continuous thread. */
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
  );
}
