import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AGENT_META, AGENT_STATIONS } from "../../lib/pipeline";
import { EASE_OUT } from "../../lib/motion";
import { cn } from "../../lib/cn";
import { AgentFace } from "../agents/AgentFace";

const SEEN_KEY = "hyperdelivery:shipped-seen";
// Opening a project that shipped last month is not the moment it shipped.
const RECENT_MS = 3 * 24 * 60 * 60 * 1000;
const PIECES = 28;
// literal classes, so Tailwind generates each crew hue
const HUES = ["bg-distill", "bg-blueprint", "bg-review", "bg-showroom", "bg-accent"];

function seenList(): string[] {
  try {
    const seen: unknown = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    return Array.isArray(seen) ? (seen as string[]) : [];
  } catch {
    return [];
  }
}

/** Squares thrown up and falling away, in the crew's colors. Positions come from the index,
 * not a random source, so the burst is the same on every render. */
function Burst() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-9 z-10">
      {Array.from({ length: PIECES }, (_, i) => {
        const angle = ((-165 + ((i * 47) % 150)) * Math.PI) / 180;
        const distance = 70 + ((i * 29) % 90);
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        const size = 4 + (i % 3);
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: [0, dx, dx * 1.15], y: [0, dy, dy + 90], opacity: [1, 1, 0], rotate: (i % 2 ? 1 : -1) * 240 }}
            transition={{ duration: 1.3, ease: [0.2, 0.7, 0.4, 1], delay: (i % 5) * 0.02 }}
            style={{ width: size, height: size }}
            className={cn("absolute rounded-[1px]", HUES[i % HUES.length])}
          />
        );
      })}
    </span>
  );
}

/** Authored moment 3 of 3: the project ships. The first time this browser sees it, the crew
 * sign off one by one and a burst of their colors goes up; after that it is a quiet banner.
 * Reduced motion keeps the banner and drops the burst. */
export function Shipped({
  projectId,
  shippedAt,
  unmet = 0,
  total = 0,
  children,
}: {
  projectId: string;
  shippedAt: string;
  /** Requirements the build check found not met - shipped anyway is not a celebration. */
  unmet?: number;
  total?: number;
  children?: ReactNode;
}) {
  const reduced = useReducedMotion();
  const [celebrate] = useState(
    () => !seenList().includes(projectId) && Date.now() - new Date(shippedAt).getTime() < RECENT_MS,
  );
  const open = unmet > 0;
  const play = celebrate && !reduced && !open;

  useEffect(() => {
    const list = seenList();
    if (list.includes(projectId)) return;
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...list, projectId].slice(-200)));
    } catch {
      // storage full or blocked: the moment may play again, which is harmless
    }
  }, [projectId]);

  return (
    <div
      className={cn(
        "relative animate-rise rounded-md border px-4 py-3",
        open ? "border-warning/30 bg-warning-bg" : "border-success/25 bg-success-bg",
      )}
    >
      {play && <Burst />}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <motion.p
          initial={play ? { clipPath: "inset(0 100% 0 0)" } : false}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className={cn("stencil shrink-0 text-lg", open ? "text-warning" : "text-success")}
        >
          Shipped
        </motion.p>
        {open && (
          <span className="tabular rounded-full border border-warning/30 px-2 py-0.5 text-2xs font-medium text-warning">
            {unmet} of {total} requirements open
          </span>
        )}
        <div className="flex items-center gap-1.5">
          {AGENT_STATIONS.map((station, i) => {
            const meta = AGENT_META[station]!;
            return (
              <motion.span
                key={station}
                initial={play ? { scale: 0.7, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 480, damping: 24, delay: 0.25 + i * 0.1 }}
                title={`${meta.name} signed off`}
                className={cn("flex size-7 items-center justify-center rounded-full", meta.bg, meta.fg)}
              >
                <AgentFace agent={meta.face} state="done" className="size-4.5" />
              </motion.span>
            );
          })}
        </div>
      </div>
      <div className="mt-2 text-2xs leading-relaxed text-fg-muted">{children}</div>
    </div>
  );
}
