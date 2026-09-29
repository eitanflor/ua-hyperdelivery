import { motion } from "motion/react";
import { CheckIcon, LockSimpleIcon } from "@phosphor-icons/react";
import type { Station } from "../../api/types";
import { AGENT_META, PIPELINE, STATION_META, stationIndex } from "../../lib/pipeline";
import { AgentFace } from "../agents/AgentFace";
import { cn } from "../../lib/cn";
import { Tooltip } from "../ui/Tooltip";

/** The line itself, promoted to the top bar.
 *
 * This is the app's primary orienting object: where the project is, what it has cleared
 * and what is left. The sliding cursor is the one authored motion moment in the console -
 * when a gate is signed, you see the line advance.
 *
 * Sized by its container (the top bar's `@container` slot), not the viewport: labels appear
 * only when the slot has room for them, so the line never spills over the chrome beside it.
 * Below the icon-only width it collapses to the current stage and a step count. */
export function LineIndicator({ station }: { station: Station }) {
  const current = stationIndex(station);

  return (
    <>
      <span className="stencil flex h-7 items-center gap-1.5 rounded-full bg-accent-bg px-2.5 text-2xs whitespace-nowrap text-accent-text @min-[25rem]:hidden">
        {STATION_META[station].label}
        <span className="tabular font-sans font-normal not-italic normal-case">
          {current + 1} of {PIPELINE.length}
        </span>
      </span>
    <ol className="hidden items-center gap-1 @min-[25rem]:flex" aria-label="Delivery line">
      {PIPELINE.map((entry, i) => {
        const meta = STATION_META[entry];
        const index = stationIndex(entry);
        const done = current > index;
        const active = current === index;
        const agent = meta.agent ? AGENT_META[meta.agent] : undefined;

        return (
          <li key={entry} className="flex items-center gap-1">
            {i > 0 && (
              <span
                className={cn(
                  "h-px w-2 shrink-0 transition-colors duration-300 @min-[44rem]:w-4 @min-[70rem]:w-5",
                  done ? "bg-success/40" : "bg-line",
                )}
              />
            )}
            <Tooltip
              content={
                agent ? (
                  <span className="flex flex-col gap-0.5">
                    <span className="font-mono text-fg-subtle">{agent.number}</span>
                    <span className="stencil">{meta.label}</span>
                    <span className="max-w-52 text-fg-muted">
                      {agent.name}, {agent.title.toLowerCase()} · {agent.role}
                    </span>
                  </span>
                ) : (
                  meta.full
                )
              }
            >
              <span
                aria-current={active ? "step" : undefined}
                className={cn(
                  "relative flex h-7 items-center gap-1.5 rounded-full px-2 transition-colors duration-200",
                  meta.kind === "gate" && "px-1.5",
                  active && "bg-accent-bg text-accent-text",
                  done && !active && "text-fg-muted",
                  !done && !active && "text-fg-subtle",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="line-cursor"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-full ring-1 ring-accent"
                  />
                )}
                <span className="relative flex size-4.5 shrink-0 items-center justify-center">
                  {done ? (
                    <CheckIcon weight="bold" className="size-3.5 text-success" />
                  ) : meta.kind === "gate" ? (
                    <LockSimpleIcon weight="bold" className="size-3.5" />
                  ) : meta.kind === "done" ? (
                    <CheckIcon weight="bold" className="size-3.5" />
                  ) : (
                    <AgentFace
                      agent={AGENT_META[meta.agent!].face}
                      state={active ? "working" : "idle"}
                      className="size-4.5"
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "stencil relative hidden text-2xs whitespace-nowrap",
                    // the current stage is named first; the rest only once all fit, and a
                    // cleared or upcoming gate never - its lock already says what it is
                    active
                      ? "@min-[31rem]:inline"
                      : meta.kind !== "gate" && "@min-[70rem]:inline",
                  )}
                >
                  {meta.label}
                </span>
                <span className="sr-only">
                  {meta.full}
                  {done ? " — cleared" : active ? " — current" : " — not started"}
                </span>
              </span>
            </Tooltip>
          </li>
        );
      })}
    </ol>
    </>
  );
}
