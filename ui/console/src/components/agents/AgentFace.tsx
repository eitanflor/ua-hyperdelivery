import { cn } from "../../lib/cn";

/** The crew.
 *
 * Each agent is one head with a different crest, so the four read as a family rather than
 * four unrelated glyphs: a scout's tick, a coach's X on the board, tally marks on a grade
 * sheet, a host's mic. Every crest is something the person holding that job actually
 * makes a mark with.
 *
 * The eyes carry state. They only blink while an agent is actually working, so motion
 * here is a status indicator rather than decoration.
 */
export type AgentFaceName = "scout" | "coach" | "ref" | "host";

export type FaceState = "idle" | "working" | "done";

const CRESTS: Record<AgentFaceName, React.ReactNode> = {
  // the scout's tick on the card: the first mark anyone makes. Deliberately off-centre and
  // diagonal - a symmetric arch over the head reads as a padlock, which the gates own.
  scout: <path d="M14.9 6.2 18.8 2.4" />,
  // the X on the board: one play, drawn in chalk
  coach: <path d="M9.6 3.1 13.3 6.4M13.3 3.1 9.6 6.4" />,
  // tally marks: the grades that come off the tape
  ref: <path d="M9 6.5V4.2M12 6.5V2.9M15 6.5V4.2" />,
  // the mic: someone has to call it
  host: (
    <>
      <path d="M12 6.4V4.9" />
      <circle cx="12" cy="3.4" r="1.5" />
    </>
  ),
};

const EYE: Record<FaceState, { h: number; w: number }> = {
  idle: { h: 3.6, w: 3.6 },
  working: { h: 3.6, w: 3.6 },
  done: { h: 1.5, w: 3.6 },
};

export function AgentFace({
  agent,
  state = "idle",
  className,
}: {
  agent: AgentFaceName;
  state?: FaceState;
  className?: string;
}) {
  const { h, w } = EYE[state];
  const y = 13.6 - h / 2;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4", className)}
      aria-hidden="true"
    >
      {CRESTS[agent]}
      <rect x="4" y="6.5" width="16" height="14.5" rx="4.2" />
      <g
        className={state === "working" ? "origin-center animate-blink" : undefined}
        style={{ transformBox: "fill-box" }}
      >
        <rect x={10 - w / 2} y={y} width={w} height={h} rx={h / 2} fill="currentColor" stroke="none" />
        <rect x={14 - w / 2} y={y} width={w} height={h} rx={h / 2} fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
