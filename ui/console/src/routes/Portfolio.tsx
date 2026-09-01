import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useProjectsStore } from "../store/useProjectsStore";
import { PIPELINE, STATION_META, AGENT_META, stationIndex } from "../lib/pipeline";
import type { Project, Station } from "../api/types";
import { cn } from "../lib/cn";

const LAST_STATION_INDEX = PIPELINE.length - 1;

type Group = "needsYou" | "active" | "done";

// Same three-way split as ProjectRail's sidebar grouping - one vocabulary for "what
// state is this project in", not a second one invented for this table.
function groupOf(station: Station): Group {
  if (station === "done") return "done";
  if (STATION_META[station].kind === "gate") return "needsYou";
  return "active";
}

const TAB_LABEL: Record<"all" | Group, string> = {
  all: "All",
  needsYou: "Needs you",
  active: "Active",
  done: "Done",
};

function StationChip({ station }: { station: Station }) {
  const meta = STATION_META[station];
  const agent = meta.agent ? AGENT_META[meta.agent] : undefined;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-2xs font-medium",
        meta.kind === "gate" && "bg-accent-bg text-accent-text",
        meta.kind === "done" && "bg-success-bg text-success",
        meta.kind === "agent" && agent && `${agent.bg} ${agent.fg}`,
      )}
    >
      {meta.label}
    </span>
  );
}

function ProgressBar({ station }: { station: Station }) {
  const index = stationIndex(station);
  const pct = Math.round((index / LAST_STATION_INDEX) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-sunken">
        <div
          className={cn("h-full rounded-full", station === "done" ? "bg-success" : "bg-accent")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-2xs text-fg-subtle tabular-nums">
        {index}/{LAST_STATION_INDEX}
      </span>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line-subtle bg-surface p-4">
      <div className="stencil text-2xl text-fg">{value}</div>
      <div className="mt-1 text-2xs tracking-wide text-fg-subtle uppercase">{label}</div>
    </div>
  );
}

/** Every project, one row each - the view a producer running several lines at once
 * needs, as distinct from the single-project Workspace. */
export function Portfolio() {
  const navigate = useNavigate();
  const projectsById = useProjectsStore((s) => s.projects);
  const loadProjects = useProjectsStore((s) => s.loadProjects);
  const loading = useProjectsStore((s) => s.loading);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | Group>("all");

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const projects = useMemo(
    () =>
      Object.values(projectsById).sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [projectsById],
  );

  const counts = useMemo(() => {
    const active = projects.filter((p) => p.station !== "done").length;
    const needsYou = projects.filter((p) => groupOf(p.station) === "needsYou").length;
    const done = projects.filter((p) => p.station === "done").length;
    const stagesComplete = projects.reduce((sum, p) => sum + stationIndex(p.station), 0);
    return { active, needsYou, done, stagesComplete };
  }, [projects]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (tab !== "all" && groupOf(p.station) !== tab) return false;
      return !q || p.name.toLowerCase().includes(q);
    });
  }, [projects, query, tab]);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <h1 className="stencil text-2xl tracking-tight text-fg">Project Portfolio</h1>
      <p className="mt-1 text-xs text-fg-muted">
        Status across {projects.length} project{projects.length === 1 ? "" : "s"} on the line.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Active projects" value={counts.active} />
        <SummaryCard label="Needs you" value={counts.needsYou} />
        <SummaryCard label="Done" value={counts.done} />
        <SummaryCard label="Stages complete" value={counts.stagesComplete} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <MagnifyingGlassIcon className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-fg-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by project name…"
            className="h-8 w-full rounded-sm border border-line bg-surface pl-8 text-xs text-fg placeholder:text-fg-subtle focus:border-line-strong focus:outline-none"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "needsYou", "active", "done"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "h-8 rounded-sm px-2.5 text-2xs font-medium transition-colors",
                tab === t
                  ? "bg-accent-bg text-accent-text"
                  : "text-fg-subtle hover:bg-sunken hover:text-fg-muted",
              )}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-line-subtle">
        <table className="w-full text-left text-xs">
          <thead className="bg-sunken text-2xs text-fg-subtle uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Project</th>
              <th className="px-3 py-2 font-medium">Station</th>
              <th className="px-3 py-2 font-medium">Progress</th>
              <th className="px-3 py-2 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-subtle">
            {rows.map((p: Project) => (
              <tr
                key={p.id}
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/projects/${p.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate(`/projects/${p.id}`);
                }}
                className="cursor-pointer bg-surface hover:bg-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <td className="px-3 py-2.5 font-medium text-fg">{p.name}</td>
                <td className="px-3 py-2.5">
                  <StationChip station={p.station} />
                </td>
                <td className="px-3 py-2.5">
                  <ProgressBar station={p.station} />
                </td>
                <td className="px-3 py-2.5 text-fg-subtle">
                  {new Date(p.updated_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-fg-subtle">
                  No projects match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
