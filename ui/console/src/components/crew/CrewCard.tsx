import { AGENT_META } from "../../lib/pipeline";
import { AgentFace } from "../agents/AgentFace";
import { Artwork } from "../art/Artwork";
import { cn } from "../../lib/cn";

/** A crew member's player card: portrait with the jersey number, who they are, what they
 * do, what they hand over. The one place the crew is introduced, so Home, Start and Help
 * say the same thing. Until the C portraits are dropped in, the portrait is the face on a
 * halftone field in the crew member's color. */
export function CrewCard({
  agent,
  count,
  compact = false,
}: {
  agent: string;
  /** Projects currently at this crew member's stage, when the caller knows. */
  count?: number;
  compact?: boolean;
}) {
  const meta = AGENT_META[agent];
  if (!meta) return null;
  return (
    <div className="flex gap-3 rounded-md border border-line-subtle bg-surface p-3">
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-sm",
          compact ? "size-11" : "size-16",
          meta.bg,
          meta.fg,
        )}
      >
        <Artwork
          id={`c-${meta.face}`}
          fallback={
            <>
              <span
                aria-hidden="true"
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage: "radial-gradient(currentColor 0.9px, transparent 1.1px)",
                  backgroundSize: "4px 4px",
                }}
              />
              <AgentFace
                agent={meta.face}
                className={cn("relative translate-x-1 translate-y-1", compact ? "size-6" : "size-8")}
              />
            </>
          }
          className="absolute inset-0 size-full object-cover"
        />
        <span className="tabular absolute top-0.5 left-1 font-mono text-2xs font-semibold">
          {meta.number}
        </span>
      </span>
      <div className="min-w-0">
        <p className="flex items-baseline gap-2">
          <span className="stencil text-sm text-fg">{meta.name}</span>
          <span className="truncate text-xs text-fg-muted">{meta.title}</span>
        </p>
        {!compact && <p className="mt-1 text-xs leading-relaxed text-fg-muted">{meta.role}</p>}
        <p className="mt-1 text-2xs text-fg-subtle">
          Hands over: {meta.output}
          {count !== undefined && (
            <>
              {" · "}
              <span className="tabular">{count}</span> project{count === 1 ? "" : "s"} here
            </>
          )}
        </p>
      </div>
    </div>
  );
}
