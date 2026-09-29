import { useEffect } from "react";
import { motion } from "motion/react";
import { AGENT_META, AGENT_STATIONS } from "../../lib/pipeline";
import { EASE_EXIT, EASE_OUT } from "../../lib/motion";
import { cn } from "../../lib/cn";
import { AgentFace } from "../agents/AgentFace";
import { Artwork } from "../art/Artwork";
import { Button } from "../ui/Button";

const AUTO_DISMISS_MS = 16_000;

/** Authored moment 2 of 3: the first project this browser starts. The crew steps up one by
 * one, and the card says the two things a first-timer needs - who is working now, and that
 * nothing moves on without them. Shown once, ever. */
export function Kickoff({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  const crew = (
    <div className="flex items-center justify-center gap-3">
      {AGENT_STATIONS.map((station, i) => {
        const meta = AGENT_META[station]!;
        return (
          <motion.span
            key={station}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.12 + i * 0.09 }}
            className={cn("flex size-12 items-center justify-center rounded-full", meta.bg, meta.fg)}
          >
            <AgentFace agent={meta.face} state={i === 0 ? "working" : "idle"} className="size-8" />
          </motion.span>
        );
      })}
    </div>
  );

  return (
    <motion.section
      aria-labelledby="kickoff-title"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } }}
      exit={{ opacity: 0, y: 8, transition: { duration: 0.16, ease: EASE_EXIT } }}
      className="pointer-events-auto w-[min(30rem,calc(100%-2rem))] rounded-lg border border-line bg-overlay p-5 text-center shadow-overlay"
    >
      <Artwork id="i2-crew" fallback={crew} className="mx-auto block h-24 w-auto" />
      <h2 id="kickoff-title" className="stencil mt-4 text-lg text-fg">
        Kickoff
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
        {AGENT_META.distill?.name} is reading your brief now. You will approve three times before
        this ships - the requirements, the plan and the build - and nothing moves on until you do.
      </p>
      <Button variant="primary" className="mt-4" onClick={onDone}>
        Let&apos;s go
      </Button>
    </motion.section>
  );
}
