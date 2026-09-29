import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRightIcon,
  ChatCircleDotsIcon,
  LockSimpleIcon,
  PlusIcon,
  PulseIcon,
  RocketLaunchIcon,
  SealCheckIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import type { Project } from "../api/types";
import { useCurrentUser } from "../auth/useCurrentUser";
import { AGENT_META, AGENT_STATIONS, STATION_META } from "../lib/pipeline";
import { STARTERS } from "../lib/starters";
import { timeAgo } from "../lib/time";
import { displayName } from "../lib/people";
import { cn } from "../lib/cn";
import { useProjectsStore } from "../store/useProjectsStore";
import { ROLES, usePreferences, type Role } from "../store/usePreferences";
import { AgentFace } from "../components/agents/AgentFace";
import { Artwork } from "../components/art/Artwork";
import { IsoLine } from "../components/art/IsoLine";
import { PixelGrid } from "../components/art/PixelGrid";
import type { ArtworkId } from "../lib/artwork";
import { Button } from "../components/ui/Button";

type TileId = "start" | "approvals" | "questions" | "inflight" | "shipped";

/** What each role sees first - docs/design/personas.md, "The role-aware home". */
const ORDER: Record<Role | "none", TileId[]> = {
  none: ["approvals", "questions", "inflight", "shipped"],
  requester: ["start", "inflight", "questions", "approvals", "shipped"],
  approver: ["approvals", "questions", "inflight", "shipped"],
  sme: ["questions", "inflight", "approvals", "shipped"],
  analyst: ["inflight", "shipped", "approvals", "questions"],
  developer: ["inflight", "approvals", "questions", "shipped"],
  leadership: ["shipped", "inflight", "approvals", "questions"],
};

/** Rows per tile. Every tile gets the same number, so the bento has no dead space and the
 * whole of Home - crew included - fits on a laptop screen. The full lists are a click away. */
const LIST_CAP = 4;

function firstName(name: string): string {
  return displayName(name).split(/\s+/)[0] ?? name;
}

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function Tile({
  title,
  icon,
  count,
  viewAll,
  className,
  children,
}: {
  title: string;
  icon: ReactNode;
  count?: number;
  /** Where the full list lives, shown only when the tile cannot hold it all. */
  viewAll?: string;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className={cn("flex min-w-0 flex-col rounded-md border border-line-subtle bg-surface p-4", className)}
    >
      <div className="mb-2 flex items-center gap-2">
        <h2
          id={id}
          className="flex items-center gap-2 text-2xs font-semibold tracking-wide text-fg-subtle uppercase"
        >
          {icon}
          {title}
          {count !== undefined && count > 0 && <span className="tabular font-normal">{count}</span>}
        </h2>
        {viewAll && (
          <Link
            to={viewAll}
            className="ml-auto flex items-center gap-1 text-2xs font-medium text-accent-text hover:underline"
          >
            View all
            <ArrowRightIcon className="size-3" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function ProjectList({
  projects,
  meta,
  lead,
  empty,
  art,
  wide = false,
}: {
  projects: Project[];
  meta: (p: Project) => string;
  lead: (p: Project) => ReactNode;
  empty: ReactNode;
  /** Shown above the empty message once someone drops the illustration in. */
  art?: ArtworkId;
  /** A tile spanning two columns lists in two columns: twice the rows, same height. */
  wide?: boolean;
}) {
  if (projects.length === 0) {
    return (
      <div>
        {art && <Artwork id={art} className="mb-3 block h-20 w-auto" />}
        <p className="text-sm leading-relaxed text-fg-muted">{empty}</p>
      </div>
    );
  }
  return (
    <ul className={cn("-mx-2 grid", wide && "md:grid-cols-2 md:gap-x-4")}>
      {projects.slice(0, wide ? LIST_CAP * 2 : LIST_CAP).map((p) => (
        <li key={p.id} className="min-w-0">
          <Link
            to={`/projects/${p.id}`}
            className="flex items-center gap-2.5 rounded-sm px-2 py-1.5 transition-colors hover:bg-sunken"
          >
            <span className="flex size-5 shrink-0 items-center justify-center">{lead(p)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-fg">{p.name}</span>
              <span className="block truncate text-2xs text-fg-subtle">{meta(p)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CrewList({ counts }: { counts?: number[] }) {
  return (
    <ul className="-mx-2 grid">
      {AGENT_STATIONS.map((station, index) => {
        const meta = AGENT_META[STATION_META[station].agent!]!;
        const count = counts?.[index];
        return (
          <li key={station} className="flex items-center gap-2.5 px-2 py-1.5">
            <span
              className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", meta.bg, meta.fg)}
            >
              <AgentFace agent={meta.face} className="size-4.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-fg">
                {meta.name} <span className="text-fg-subtle">· {meta.title}</span>
              </span>
              <span className="block truncate text-2xs text-fg-subtle">Writes the {meta.output.toLowerCase()}</span>
            </span>
            {count !== undefined && count > 0 && (
              <span className="tabular shrink-0 text-2xs text-fg-subtle">{count} active</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function CrewFace({ station }: { station: Project["station"] }) {
  const agent = STATION_META[station].agent;
  const meta = agent ? AGENT_META[agent] : undefined;
  if (!meta) return null;
  return <AgentFace agent={meta.face} className={cn("size-5", meta.fg)} />;
}

function RoleQuestion() {
  const setRole = usePreferences((s) => s.setRole);
  const skip = usePreferences((s) => s.skipRoleQuestion);
  return (
    <section
      aria-labelledby="role-question"
      className="mt-6 animate-rise rounded-md border border-line bg-surface p-5"
    >
      <h2 id="role-question" className="text-base font-semibold text-fg">
        What brings you here?
      </h2>
      <p className="mt-1 text-sm text-fg-muted">
        This decides what Home shows first and how much detail you see. Change it any time
        in Settings.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map((role) => (
          <button
            key={role.value}
            type="button"
            onClick={() => setRole(role.value)}
            className="rounded-sm border border-line px-3 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-sunken"
          >
            <span className="block text-sm text-fg">{role.prompt}</span>
            <span className="mt-0.5 block text-2xs text-fg-subtle">{role.label}</span>
          </button>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="mt-3" onClick={skip}>
        Skip for now
      </Button>
    </section>
  );
}

function Starters({ large = false }: { large?: boolean }) {
  const navigate = useNavigate();
  return (
    <div className={cn("grid gap-2", large ? "sm:grid-cols-2" : "")}>
      {STARTERS.map((starter) => (
        <button
          key={starter.id}
          type="button"
          onClick={() => void navigate(`/start?starter=${starter.id}`)}
          className="flex items-start gap-3 rounded-sm border border-line-subtle px-3 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-sunken"
        >
          <starter.icon weight="duotone" className="mt-0.5 size-5 shrink-0 text-fg-muted" />
          <span>
            <span className="block text-sm text-fg">{starter.label}</span>
            {large && (
              <span className="mt-0.5 block text-xs text-fg-muted">{starter.description}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

function SkeletonTile({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-md border border-line-subtle bg-surface p-4", className)}
    >
      <div className="h-3 w-28 animate-pulse rounded-sm bg-sunken" />
      <div className="mt-4 flex flex-col gap-3">
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-8 animate-pulse rounded-sm bg-sunken" />
        ))}
      </div>
    </div>
  );
}

/** Home: one place that answers "what needs me?", ordered by what this person does. */
export function Home() {
  const user = useCurrentUser();
  const projectsById = useProjectsStore((s) => s.projects);
  const loadProjects = useProjectsStore((s) => s.loadProjects);
  const runningProjectId = useProjectsStore((s) => s.runningProjectId);
  const role = usePreferences((s) => s.role);
  const roleAsked = usePreferences((s) => s.roleAsked);
  const [loaded, setLoaded] = useState(() => Object.keys(projectsById).length > 0);

  useEffect(() => {
    void loadProjects().finally(() => setLoaded(true));
  }, [loadProjects]);

  const buckets = useMemo(() => {
    const all = Object.values(projectsById);
    const byWaiting = (a: Project, b: Project) => a.updated_at.localeCompare(b.updated_at);
    const byRecent = (a: Project, b: Project) => b.updated_at.localeCompare(a.updated_at);
    return {
      all,
      approvals: all.filter((p) => STATION_META[p.station].kind === "gate").sort(byWaiting),
      questions: all.filter((p) => Boolean(p.pending_question)).sort(byWaiting),
      inflight: all
        .filter((p) => STATION_META[p.station].kind === "agent" && !p.pending_question)
        .sort(byRecent),
      shipped: all.filter((p) => p.station === "done").sort(byRecent),
    };
  }, [projectsById]);

  const tiles: Record<
    TileId,
    { title: string; icon: ReactNode; count?: number; viewAll?: string; body: (wide: boolean) => ReactNode }
  > = {
    start: {
      title: "Start something",
      icon: <PlusIcon className="size-3.5" />,
      body: () => <Starters />,
    },
    approvals: {
      title: "Waiting for approval",
      icon: <LockSimpleIcon weight="fill" className="size-3.5 text-accent-text" />,
      count: buckets.approvals.length,
      viewAll: "/portfolio?tab=needsYou",
      body: (wide) => (
        <ProjectList
          wide={wide}
          projects={buckets.approvals}
          lead={() => <LockSimpleIcon className="size-4 text-accent-text" />}
          meta={(p) => `${STATION_META[p.station].full} · ${timeAgo(p.updated_at)}`}
          empty="Nothing is waiting for approval."
          art="d2-gate-clear"
        />
      ),
    },
    questions: {
      title: "Questions waiting",
      icon: <ChatCircleDotsIcon className="size-3.5" />,
      count: buckets.questions.length,
      viewAll: "/portfolio?tab=active",
      body: (wide) => (
        <ProjectList
          wide={wide}
          projects={buckets.questions}
          lead={(p) => <CrewFace station={p.station} />}
          meta={(p) => {
            const asked = p.pending_question?.questions?.length ?? 0;
            const who = AGENT_META[STATION_META[p.station].agent ?? ""]?.name ?? "The crew";
            return asked > 0
              ? `${who} asked ${asked} question${asked === 1 ? "" : "s"} · ${timeAgo(p.updated_at)}`
              : `${who} is waiting for a reply · ${timeAgo(p.updated_at)}`;
          }}
          empty="No open questions from the crew."
          art="d3-scout-rest"
        />
      ),
    },
    inflight: {
      title: "In flight",
      icon: <PulseIcon className="size-3.5" />,
      count: buckets.inflight.length,
      viewAll: "/portfolio?tab=active",
      body: (wide) => (
        <ProjectList
          wide={wide}
          projects={buckets.inflight}
          lead={(p) =>
            p.id === runningProjectId ? (
              <PixelGrid
                className={cn("size-3.5", AGENT_META[STATION_META[p.station].agent ?? ""]?.fg ?? "text-fg-muted")}
              />
            ) : (
              <CrewFace station={p.station} />
            )
          }
          meta={(p) => {
            const who = AGENT_META[STATION_META[p.station].agent ?? ""]?.name;
            return `${STATION_META[p.station].label}${who ? ` · with ${who}` : ""} · ${timeAgo(p.updated_at)}`;
          }}
          empty={
            <>
              Nothing in flight.{" "}
              <Link to="/start" className="text-accent-text hover:underline">
                Start a project
              </Link>
              .
            </>
          }
        />
      ),
    },
    shipped: {
      title: "Recently shipped",
      icon: <RocketLaunchIcon className="size-3.5" />,
      count: buckets.shipped.length,
      viewAll: "/portfolio?tab=done",
      body: (wide) => (
        <ProjectList
          wide={wide}
          projects={buckets.shipped}
          lead={() => <SealCheckIcon weight="fill" className="size-4 text-success" />}
          meta={(p) => `Shipped ${timeAgo(p.updated_at)}`}
          empty="Nothing shipped yet. Finished projects land here."
        />
      ),
    },
  };

  const order = ORDER[role ?? "none"];
  // the crew closes the grid; with five cells the first tile spans two columns so the
  // bento stays a clean two-by-three instead of leaving a hole
  const heroWide = order.length + 1 === 5;
  const crewCounts = AGENT_STATIONS.map(
    (station) => buckets.all.filter((p) => p.station === station).length,
  );
  const empty = loaded && buckets.all.length === 0;
  const summary = [
    buckets.approvals.length > 0 && `${buckets.approvals.length} waiting for approval`,
    buckets.questions.length > 0 &&
      `${buckets.questions.length} question${buckets.questions.length === 1 ? "" : "s"} waiting`,
    buckets.inflight.length > 0 && `${buckets.inflight.length} in flight`,
  ].filter(Boolean);

  const renderTile = (id: TileId, wide: boolean) => {
    const tile = tiles[id];
    const cap = wide ? LIST_CAP * 2 : LIST_CAP;
    return (
      <Tile
        key={id}
        title={tile.title}
        icon={tile.icon}
        count={tile.count}
        viewAll={tile.count !== undefined && tile.count > cap ? tile.viewAll : undefined}
        className={wide ? "md:col-span-2" : undefined}
      >
        {tile.body(wide)}
      </Tile>
    );
  };

  const crewTile = (
    <Tile title="The crew" icon={<UsersThreeIcon className="size-3.5" />}>
      <CrewList counts={loaded && !empty ? crewCounts : undefined} />
    </Tile>
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <header className="flex flex-wrap items-end gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-fg">
              {greeting(new Date().getHours())}
              {user ? `, ${firstName(user.name)}` : ""}.
            </h1>
            <p className="mt-1 text-sm text-fg-muted">
              {!loaded
                ? "Checking the line…"
                : summary.length > 0
                  ? summary.join(" · ")
                  : empty
                    ? "Nothing on the line yet."
                    : "Nothing needs you right now."}
            </p>
          </div>
          <Link
            to="/start"
            className="inline-flex h-9 items-center gap-2 rounded-sm bg-accent px-4 text-xs font-medium text-fg-on-accent shadow-raised transition-colors hover:bg-accent-hover"
          >
            <PlusIcon className="size-4" />
            Start a project
          </Link>
        </header>

        {!roleAsked && <RoleQuestion />}

        {!loaded ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <SkeletonTile className="md:col-span-2" />
            <SkeletonTile />
            <SkeletonTile />
            <SkeletonTile />
            <SkeletonTile />
          </div>
        ) : empty ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <section
              aria-labelledby="first-run"
              className="rounded-md border border-line-subtle bg-surface p-5 lg:col-span-2"
            >
              <Artwork
                id="d1-floor"
                fallback={
                  <IsoLine
                    className="mb-5 max-w-lg"
                    label="An empty line: four crew stations and three gates, waiting for a first project."
                  />
                }
                className="mb-5 block h-auto w-full max-w-lg"
              />
              <h2 id="first-run" className="text-base font-semibold text-fg">
                What would you like to build?
              </h2>
              <p className="mt-1 mb-4 text-sm text-fg-muted">
                Pick the closest starting point. You can say it in your own words on the next screen.
              </p>
              <Starters large />
            </section>
            {crewTile}
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {order.map((id, i) => renderTile(id, i === 0 && heroWide))}
            {crewTile}
          </div>
        )}
      </div>
    </div>
  );
}
