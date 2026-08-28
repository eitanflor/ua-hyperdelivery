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
 * when a gate is signed, you see the line advance. */
export function LineIndicator({ station }: { station: Station }) {
  const current = stationIndex(station);

  return (
    <ol className="flex items-center gap-1" aria-label="Delivery line">
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
                  "h-px w-3 shrink-0 transition-colors duration-300 xl:w-5",
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
                      {agent.name} · {agent.role}
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
                    "stencil relative hidden text-2xs whitespace-nowrap xl:inline",
                    meta.kind === "gate" && !active && "xl:hidden",
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
  );
}
