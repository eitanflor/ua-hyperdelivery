import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  CaretDownIcon,
  CaretUpIcon,
  ChatCircleDotsIcon,
  KanbanIcon,
  LockSimpleIcon,
  MagnifyingGlassIcon,
  RowsIcon,
  SealCheckIcon,
} from "@phosphor-icons/react";
import { AgentFace } from "../components/agents/AgentFace";
import { useProjectsStore } from "../store/useProjectsStore";
import { PIPELINE, STATION_META, AGENT_META, stationIndex } from "../lib/pipeline";
import type { Project, Station } from "../api/types";
import { cn } from "../lib/cn";
import { timeAgo } from "../lib/time";
import { Artwork } from "../components/art/Artwork";
import { Button } from "../components/ui/Button";

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
  needsYou: "Waiting for approval",
  active: "Active",
  done: "Shipped",
};

type Tab = keyof typeof TAB_LABEL;

function isTab(value: string | null): value is Tab {
  return value !== null && value in TAB_LABEL;
}

const IDLE_DAYS = 7;

type SortKey = "updated" | "name" | "stage";

const SORT_LABEL: Record<SortKey, string> = {
  updated: "Updated",
  name: "Project",
  stage: "Stage",
};

/** The direction a column starts in when first chosen: newest first, but A-Z and line order. */
const DEFAULT_DIR: Record<SortKey, "asc" | "desc"> = { updated: "desc", name: "asc", stage: "asc" };

function isSortKey(value: string | null): value is SortKey {
  return value !== null && value in SORT_LABEL;
}

function compareBy(key: SortKey, a: Project, b: Project): number {
  if (key === "name") return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  if (key === "stage") return stationIndex(a.station) - stationIndex(b.station);
  return a.updated_at.localeCompare(b.updated_at);
}

/** Days since a crew stage last moved, when that is long enough to be worth saying - a
 * project at a gate is waiting on a person, which the gate already says. */
function idleDays(p: Project): number | null {
  if (STATION_META[p.station].kind !== "agent" || p.pending_question) return null;
  const days = Math.floor((Date.now() - Date.parse(p.updated_at)) / 86_400_000);
  return days >= IDLE_DAYS ? days : null;
}

function Updated({ project }: { project: Project }) {
  const idle = idleDays(project);
  return idle === null ? (
    <>{timeAgo(project.updated_at)}</>
  ) : (
    <span className="text-warning" title={`No crew activity for ${idle} days`}>
      Idle {idle}d
    </span>
  );
}

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
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${STATION_META[station].full}, ${pct}% along the line`}
      title={`${pct}% along the line`}
      className="h-1.5 w-24 overflow-hidden rounded-full bg-sunken"
    >
      <div
        className={cn("h-full rounded-full", station === "done" ? "bg-success" : "bg-fg-muted")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-md border border-line-subtle bg-surface p-4">
      <div className="stencil text-2xl text-fg">
        {value ?? <span className="inline-block h-7 w-10 animate-pulse rounded-sm bg-sunken align-middle" />}
      </div>
      <div className="mt-1 text-2xs tracking-wide text-fg-subtle uppercase">{label}</div>
    </div>
  );
}

const BOARD_CAP = 30;

/** A column header that sorts the table: a real button, with the state on the `th`. */
function SortHeader({
  sortKey,
  label,
  active,
  dir,
  onSort,
}: {
  sortKey: SortKey;
  label: string;
  active: SortKey;
  dir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const on = active === sortKey;
  const Caret = dir === "asc" ? CaretUpIcon : CaretDownIcon;
  return (
    <th
      aria-sort={on ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className="px-3 py-2 font-medium"
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "-mx-1 inline-flex items-center gap-1 rounded-sm px-1 uppercase transition-colors hover:text-fg",
          on && "text-fg",
        )}
      >
        {label}
        <Caret weight="bold" className={cn("size-2.5", !on && "opacity-0")} />
      </button>
    </th>
  );
}

/** Table rows shown before "Show more" - hundreds of rows at once cost more than they tell. */
const ROW_STEP = 40;

/** The whole line at a glance: one column per stage, a card per project. Gate columns are
 * tinted, because a project there is waiting on a person rather than the crew. */
function Board({ projects }: { projects: Project[] }) {
  return (
    <div className="mt-4 flex gap-3 overflow-x-auto overscroll-x-contain pb-3">
      {PIPELINE.map((station) => {
        const meta = STATION_META[station];
        const agent = meta.agent ? AGENT_META[meta.agent] : undefined;
        const members = projects.filter((p) => p.station === station);
        return (
          <section
            key={station}
            aria-label={`${meta.full}: ${members.length}`}
            className={cn(
              "flex w-56 shrink-0 flex-col rounded-md border",
              meta.kind === "gate" ? "border-accent-line bg-accent-bg/50" : "border-line-subtle bg-sunken/50",
            )}
          >
            <header className="flex items-center gap-2 border-b border-line-subtle px-3 py-2">
              {agent ? (
                <AgentFace agent={agent.face} className={cn("size-4", agent.fg)} />
              ) : meta.kind === "gate" ? (
                <LockSimpleIcon weight="fill" className="size-3.5 text-accent-text" />
              ) : (
                <SealCheckIcon weight="fill" className="size-3.5 text-success" />
              )}
              <h2 className="stencil text-2xs text-fg">{meta.label}</h2>
              <span className="tabular ml-auto text-2xs text-fg-subtle">{members.length}</span>
            </header>
            <ul className="flex max-h-[60vh] flex-col gap-1.5 overflow-y-auto p-2">
              {members.slice(0, BOARD_CAP).map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/projects/${p.id}`}
                    className="block w-full rounded-sm border border-line-subtle bg-surface px-2.5 py-2 text-left transition-colors hover:border-line-strong"
                  >
                    <span className="block truncate text-xs text-fg">{p.name}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-2xs text-fg-subtle">
                      {p.pending_question && (
                        <>
                          <ChatCircleDotsIcon className="size-3 text-warning" />
                          <span className="text-warning">Question</span> ·
                        </>
                      )}
                      <Updated project={p} />
                    </span>
                  </Link>
                </li>
              ))}
              {members.length > BOARD_CAP && (
                <li className="px-1 py-1 text-2xs text-fg-subtle">
                  +{members.length - BOARD_CAP} more - search to narrow
                </li>
              )}
              {members.length === 0 && <li className="px-1 py-2 text-2xs text-fg-subtle">None</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** Every project, one row each - the view a producer running several lines at once
 * needs, as distinct from the single-project Workspace. */
export function Portfolio() {
  const navigate = useNavigate();
  const projectsById = useProjectsStore((s) => s.projects);
  const loadProjects = useProjectsStore((s) => s.loadProjects);
  const projectsLoaded = useProjectsStore((s) => s.projectsLoaded);

  const [query, setQuery] = useState("");
  // in the URL so Home's "View all" can land on the matching list
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const tab: Tab = isTab(requested) ? requested : "all";
  const sortParam = params.get("sort");
  const sortKey: SortKey = isSortKey(sortParam) ? sortParam : "updated";
  const sortDir = params.get("dir") === "asc" ? "asc" : params.get("dir") === "desc" ? "desc" : DEFAULT_DIR[sortKey];
  const board = params.get("view") === "board";
  const setParam = (key: string, value: string | null) =>
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        if (value === null) out.delete(key);
        else out.set(key, value);
        return out;
      },
      { replace: true },
    );
  const setTab = (next: Tab) => setParam("tab", next === "all" ? null : next);
  const sortBy = (key: SortKey) =>
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        const flipped = sortKey === key ? (sortDir === "asc" ? "desc" : "asc") : DEFAULT_DIR[key];
        if (key === "updated" && flipped === "desc") {
          out.delete("sort");
          out.delete("dir");
        } else {
          out.set("sort", key);
          out.set("dir", flipped);
        }
        return out;
      },
      { replace: true },
    );

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const projects = useMemo(
    () =>
      Object.values(projectsById).sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [projectsById],
  );

  // an empty list before the first fetch lands is "not here yet", not "nothing"
  const pending = !projectsLoaded && projects.length === 0;

  // four numbers that add up to the total, named the way Home names them
  const counts = useMemo(() => {
    const questions = projects.filter(
      (p) => STATION_META[p.station].kind === "agent" && Boolean(p.pending_question),
    ).length;
    const needsYou = projects.filter((p) => groupOf(p.station) === "needsYou").length;
    const done = projects.filter((p) => p.station === "done").length;
    const inFlight = projects.length - questions - needsYou - done;
    return { inFlight, needsYou, done, questions };
  }, [projects]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sign = sortDir === "asc" ? 1 : -1;
    return projects
      .filter((p) => {
        if (tab !== "all" && groupOf(p.station) !== tab) return false;
        return !q || p.name.toLowerCase().includes(q);
      })
      .sort(
        (a, b) =>
          sign * compareBy(sortKey, a, b) ||
          // ties fall back to newest first, so equal names or stages stay in a stable order
          b.updated_at.localeCompare(a.updated_at),
      );
  }, [projects, query, tab, sortKey, sortDir]);

  // what each chip would show for the current search, so a chip never promises rows it lacks
  const tabCounts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matching = projects.filter((p) => !q || p.name.toLowerCase().includes(q));
    return {
      all: matching.length,
      needsYou: matching.filter((p) => groupOf(p.station) === "needsYou").length,
      active: matching.filter((p) => groupOf(p.station) === "active").length,
      done: matching.filter((p) => groupOf(p.station) === "done").length,
    } satisfies Record<Tab, number>;
  }, [projects, query]);

  // a new filter starts back at the first page rather than inheriting the last one's length
  const filterKey = `${tab}|${query}|${sortKey}|${sortDir}`;
  const [more, setMore] = useState({ key: filterKey, extra: 0 });
  const shown = ROW_STEP + (more.key === filterKey ? more.extra : 0);

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <h1 className="stencil text-2xl tracking-tight text-fg">Portfolio</h1>
      <p className="mt-1 text-sm text-fg-muted">
        {pending ? "Loading the line…" : `Every project on the line - ${projects.length} in all.`}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="In flight" value={pending ? null : counts.inFlight} />
        <SummaryCard label="Questions waiting" value={pending ? null : counts.questions} />
        <SummaryCard label="Waiting for approval" value={pending ? null : counts.needsYou} />
        <SummaryCard label="Shipped" value={pending ? null : counts.done} />
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
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "h-8 rounded-sm px-2.5 text-2xs font-medium transition-colors",
                tab === t
                  ? "bg-sunken text-fg"
                  : "text-fg-subtle hover:bg-sunken hover:text-fg-muted",
              )}
            >
              {TAB_LABEL[t]}
              {!pending && <span className="tabular ml-1.5 text-fg-subtle">{tabCounts[t]}</span>}
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Show projects as" className="flex items-center rounded-sm border border-line p-0.5">
          {(
            [
              [false, "Table", <RowsIcon key="t" className="size-3.5" />],
              [true, "Board", <KanbanIcon key="b" className="size-3.5" />],
            ] as const
          ).map(([value, label, icon]) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={board === value}
              onClick={() => setParam("view", value ? "board" : null)}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-[3px] px-2 text-2xs font-medium transition-colors",
                board === value ? "bg-sunken text-fg" : "text-fg-subtle hover:text-fg-muted",
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {board ? (
        <Board projects={rows} />
      ) : (
      <div className="mt-4 overflow-hidden rounded-md border border-line-subtle">
        <table className="w-full text-left text-xs">
          <thead className="bg-sunken text-2xs text-fg-subtle uppercase">
            <tr>
              {(
                [
                  ["name", "Project"],
                  ["stage", "Stage"],
                ] as const
              ).map(([key, label]) => (
                <SortHeader key={key} sortKey={key} label={label} active={sortKey} dir={sortDir} onSort={sortBy} />
              ))}
              <th className="px-3 py-2 font-medium">Progress</th>
              <SortHeader sortKey="updated" label="Updated" active={sortKey} dir={sortDir} onSort={sortBy} />
            </tr>
          </thead>
          <tbody className="divide-y divide-line-subtle">
            {rows.slice(0, shown).map((p: Project) => (
              <tr
                key={p.id}
                // the whole row is a mouse target; the name is the real link, so it opens in a
                // new tab and is the one keyboard stop per row
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest("a")) void navigate(`/projects/${p.id}`);
                }}
                className="cursor-pointer bg-surface hover:bg-sunken"
              >
                <td className="px-3 py-2.5 font-medium text-fg">
                  <Link to={`/projects/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <StationChip station={p.station} />
                </td>
                <td className="px-3 py-2.5">
                  <ProgressBar station={p.station} />
                </td>
                <td className="px-3 py-2.5 text-fg-subtle">
                  <Updated project={p} />
                </td>
              </tr>
            ))}
            {rows.length > shown && (
              <tr>
                <td colSpan={4} className="bg-surface px-3 py-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setMore({
                        key: filterKey,
                        extra: (more.key === filterKey ? more.extra : 0) + ROW_STEP,
                      })
                    }
                  >
                    Show {Math.min(ROW_STEP, rows.length - shown)} more · {rows.length - shown} left
                  </Button>
                </td>
              </tr>
            )}
            {rows.length === 0 && !pending && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-fg-subtle">
                  <Artwork id="d6-column" className="mx-auto mb-3 block h-16 w-auto" />
                  No projects match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
    </div>
  );
}
