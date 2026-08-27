import type { Station } from "../api/types";
import { AGENT_META, AGENT_STATIONS, stationIndex } from "../lib/pipeline";

// the approval gate that sits immediately before each agent stage, if any - used to
// tint the connecting line amber while a project is stuck waiting on a decision there
const GATE_BEFORE: (Station | null)[] = [null, "blueprint_approval", "review_approval", null];

/** Compact 4-stage progress indicator (Distill/Blueprint/Review/Showroom) for the
 * workspace header - the station badge alone names the current step but doesn't show
 * how far a project has come or how much is left without checking the sidebar. */
export function PipelineStepper({ station }: { station: Station }) {
  const idx = stationIndex(station);

  return (
    <div className="flex items-center">
      {AGENT_STATIONS.map((agent, i) => {
        const agentIdx = stationIndex(agent);
        const meta = AGENT_META[agent];
        const done = idx > agentIdx;
        const current = station === agent;
        const gateActive = GATE_BEFORE[i] === station;

        return (
          <div key={agent} className="flex items-center">
            {i > 0 && (
              <span
                className={
                  "h-px w-5 " +
                  (gateActive ? "animate-pulse bg-amber-400" : done ? "bg-emerald-500/40" : "bg-ua-mist")
                }
              />
            )}
            <div
              title={meta.label}
              className={
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold transition-colors " +
                (done
                  ? "bg-emerald-500 text-white"
                  : current
                    ? "bg-ua-red text-white"
                    : "bg-ua-cloud text-ua-steel")
              }
            >
              {done ? "✓" : meta.initial}
            </div>
          </div>
        );
      })}
    </div>
  );
}
