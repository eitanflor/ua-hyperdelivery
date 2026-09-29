import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AGENT_META } from "../../lib/pipeline";
import { EASE_EXIT, EASE_OUT } from "../../lib/motion";
import { cn } from "../../lib/cn";
import { AgentFace } from "../agents/AgentFace";

const TRAVEL = 0.9;
const HOLD_MS = 2600;

function Face({ agent, state, arrived }: { agent: string; state: "done" | "working" | "idle"; arrived?: boolean }) {
  const meta = AGENT_META[agent];
  if (!meta) return null;
  return (
    <motion.span
      animate={arrived ? { scale: [1, 1.14, 1] } : undefined}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", meta.bg, meta.fg)}
    >
      <AgentFace agent={meta.face} state={state} className="size-5" />
    </motion.span>
  );
}

/** Authored moment 1 of 3: a gate is signed and the work changes hands. The approved
 * document travels from the crew member who wrote it to the one who starts next, whose
 * face wakes up - then the row folds away, leaving the signed stub. */
export function Handoff({ from, to }: { from: string; to: string }) {
  const reduced = useReducedMotion();
  const [arrived, setArrived] = useState(false);
  const [visible, setVisible] = useState(true);
  const next = AGENT_META[to];

  useEffect(() => {
    const land = setTimeout(() => setArrived(true), reduced ? 0 : TRAVEL * 1000);
    const hide = setTimeout(() => setVisible(false), HOLD_MS);
    return () => {
      clearTimeout(land);
      clearTimeout(hide);
    };
  }, [reduced]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          exit={{ opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.2, ease: EASE_EXIT } }}
          className="mt-2 overflow-hidden"
        >
          <div className="flex items-center gap-3 px-1">
            <Face agent={from} state="done" />
            <div className="relative h-px flex-1 bg-line">
              <motion.span
                aria-hidden="true"
                initial={{ left: "0%", opacity: 0 }}
                animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: reduced ? 0 : TRAVEL,
                  left: { duration: reduced ? 0 : TRAVEL, ease: "easeInOut" },
                  opacity: { duration: reduced ? 0 : TRAVEL, times: [0, 0.12, 0.88, 1] },
                }}
                className="absolute top-1/2 h-4 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-line-strong bg-surface shadow-raised"
              />
            </div>
            <Face agent={to} state={arrived ? "working" : "idle"} arrived={arrived} />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: arrived ? 1 : 0 }}
            className="mt-1 text-center text-2xs text-fg-muted"
          >
            Handed to {next?.name ?? "the next stage"}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
