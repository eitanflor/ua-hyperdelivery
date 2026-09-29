import { useEffect, useMemo, useState } from "react";
import { NavLink, useMatch, useNavigate } from "react-router";
import { MagnifyingGlassIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useProjectsStore } from "../../store/useProjectsStore";
import type { Station } from "../../api/types";
import { STATION_META } from "../../lib/pipeline";
import { IconButton } from "../ui/IconButton";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { cn } from "../../lib/cn";

const GATES: Station[] = ["blueprint_approval", "review_approval", "showroom_approval"];

// The rail is somewhere to jump back into recent work, not the whole portfolio - past
// these it points at Portfolio, which can sort, filter and page.
const NEEDS_YOU_CAP = 5;
const RECENT_CAP = 8;
const SEARCH_CAP = 50;

interface Row {
  id: string;
  name: string;
  station: Station | undefined;
}

function isGate(station: Station | undefined): boolean {
  return station !== undefined && STATION_META[station].kind === "gate";
}

function SectionLabel({ children, count, urgent }: { children: string; count?: number; urgent?: boolean }) {
  return (
    <h2 className="mb-0.5 flex items-center gap-1.5 px-2 text-2xs font-medium text-fg-subtle">
      {urgent && <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />}
      {children}
      {count !== undefined && <span className="tabular font-normal text-fg-subtle/70">{count}</span>}
    </h2>
  );
}

export function ProjectRail({ open }: { open: boolean }) {
  const navigate = useNavigate();
  const activeId = useMatch("/projects/:projectId")?.params.projectId;
  const projectsById = useProjectsStore((s) => s.projects);
  const projectsLoaded = useProjectsStore((s) => s.projectsLoaded);
  const loadPending = useProjectsStore((s) => s.loadPending);
  const loadProjects = useProjectsStore((s) => s.loadProjects);
  const deleteProject = useProjectsStore((s) => s.deleteProject);
  const renameProject = useProjectsStore((s) => s.renameProject);

  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirming, setConfirming] = useState<Row | null>(null);

  useEffect(() => {
    for (const station of GATES) void loadPending(station);
    // the source of truth for the rail, not a client-cached recent-projects echo - so a
    // project deleted or created elsewhere shows up correctly on next mount
    void loadProjects();
    // mount-only: re-running per rename/reorder would refetch everything unnecessarily
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // most recently touched first: the project you were just in is the one you want back
  const rows = useMemo<Row[]>(
    () =>
      Object.values(projectsById)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .map((p) => ({ id: p.id, name: p.name, station: p.station })),
    [projectsById],
  );

  const query = filter.trim().toLowerCase();
  const { needsYou, needsYouTotal, recent, recentTotal } = useMemo(() => {
    // a search is an explicit ask to see what matches, in one list
    if (query) {
      const matched = rows.filter((r) => r.name.toLowerCase().includes(query));
      return { needsYou: [], needsYouTotal: 0, recent: matched.slice(0, SEARCH_CAP), recentTotal: matched.length };
    }
    const waiting = rows.filter((r) => isGate(r.station));
    const rest = rows.filter((r) => !isGate(r.station));
    // the project you are in is always listed, so the rail never loses your place
    const shown = (list: Row[], cap: number) => {
      const head = list.slice(0, cap);
      const current = list.find((r) => r.id === activeId);
      return current && !head.includes(current) ? [current, ...head.slice(0, cap - 1)] : head;
    };
    return {
      needsYou: shown(waiting, NEEDS_YOU_CAP),
      needsYouTotal: waiting.length,
      recent: shown(rest, RECENT_CAP),
      recentTotal: rest.length,
    };
  }, [rows, query, activeId]);

  const commitRename = async (row: Row) => {
    const name = editingName.trim();
    setEditingId(null);
    if (!name || name === row.name) return;
    await renameProject(row.id, name);
  };

  if (!open) return null;

  const renderRow = (row: Row) => {
    const waiting = isGate(row.station);
    const stage = row.station ? STATION_META[row.station].label : undefined;
    return (
      <li key={row.id} className="group/row">
        {editingId === row.id ? (
          <input
            autoFocus
            aria-label={`Rename ${row.name}`}
            className="w-full rounded-sm border border-line-strong bg-surface px-2 py-1.5 text-xs text-fg focus:outline-none"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={() => void commitRename(row)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") void commitRename(row);
              if (e.key === "Escape") setEditingId(null);
            }}
          />
        ) : (
          <div className="flex items-center gap-0.5 rounded-sm transition-colors hover:bg-sunken has-[.active]:bg-sunken">
            <NavLink
              to={`/projects/${row.id}`}
              title={stage ? `${row.name} · ${stage}` : row.name}
              className={({ isActive }) =>
                cn(
                  "flex min-h-8 min-w-0 flex-1 items-center rounded-sm px-2 py-1 text-xs",
                  isActive ? "active font-medium text-fg" : "text-fg-muted hover:text-fg",
                )
              }
            >
              <span className="truncate">{row.name}</span>
              {waiting && <span className="sr-only"> - waiting for approval</span>}
            </NavLink>
            <span className="flex shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
              <IconButton
                size="sm"
                label={`Rename ${row.name}`}
                icon={<PencilSimpleIcon className="size-3.5" />}
                onClick={() => {
                  setEditingId(row.id);
                  setEditingName(row.name);
                }}
              />
              <IconButton
                size="sm"
                tone="danger"
                label={`Delete ${row.name}`}
                icon={<TrashIcon className="size-3.5" />}
                onClick={() => setConfirming(row)}
              />
            </span>
          </div>
        )}
      </li>
    );
  };

  return (
    <nav
      aria-label="Projects"
      className="flex w-64 shrink-0 flex-col gap-2 border-r border-line-subtle bg-canvas p-3"
    >
      <button
        type="button"
        onClick={() => void navigate("/start")}
        className="flex h-8 items-center gap-2 rounded-sm px-2 text-xs font-medium text-fg transition-colors hover:bg-sunken"
      >
        <PlusIcon className="size-3.5" />
        New project
      </button>

      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-fg-subtle" />
        <input
          className="h-8 w-full rounded-sm bg-sunken pr-2 pl-8 text-xs text-fg placeholder:text-fg-subtle focus:bg-surface focus:ring-1 focus:ring-line-strong focus:outline-none"
          placeholder="Filter projects"
          aria-label="Filter projects"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="-mx-1 mt-1 flex-1 overflow-y-auto px-1">
        {rows.length === 0 && !projectsLoaded && (
          <div aria-hidden="true" className="flex flex-col gap-2 px-1 py-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="h-6 animate-pulse rounded-sm bg-line-subtle" />
            ))}
          </div>
        )}
        {rows.length === 0 && projectsLoaded && (
          <p className="px-1 py-6 text-center text-2xs leading-relaxed text-fg-subtle">
            No projects yet.
            <br />
            Start one to get going.
          </p>
        )}
        {query && recentTotal === 0 && rows.length > 0 && (
          <p className="px-2 py-4 text-2xs text-fg-subtle">Nothing matches "{filter.trim()}".</p>
        )}

        {needsYou.length > 0 && (
          <section className="mb-4">
            <SectionLabel count={needsYouTotal} urgent>
              Needs you
            </SectionLabel>
            <ul className="flex flex-col gap-0.5">{needsYou.map(renderRow)}</ul>
            {needsYouTotal > needsYou.length && (
              <NavLink
                to="/portfolio?tab=needsYou"
                className="mt-0.5 block rounded-sm px-2 py-1.5 text-2xs text-fg-subtle transition-colors hover:bg-sunken hover:text-fg-muted"
              >
                +{needsYouTotal - needsYou.length} more waiting
              </NavLink>
            )}
          </section>
        )}

        {recent.length > 0 && (
          <section className="mb-2">
            {!query && <SectionLabel>Recent</SectionLabel>}
            <ul className="flex flex-col gap-0.5">{recent.map(renderRow)}</ul>
            {query && recentTotal > recent.length && (
              <p className="px-2 py-1.5 text-2xs text-fg-subtle">
                Showing {recent.length} of {recentTotal} matches. Type more to narrow them.
              </p>
            )}
          </section>
        )}
      </div>

      {rows.length > 0 && (
        <NavLink
          to="/portfolio"
          className="-mb-1 rounded-sm px-2 py-1.5 text-2xs text-fg-subtle transition-colors hover:bg-sunken hover:text-fg-muted"
        >
          {!query && recentTotal > recent.length ? `View all ${rows.length} in Portfolio` : "Open Portfolio"}
        </NavLink>
      )}

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(next) => !next && setConfirming(null)}
        title={`Delete "${confirming?.name ?? ""}"?`}
        description="This removes the project, every document its crew produced, and its decision history. It cannot be undone."
        confirmLabel="Delete project"
        destructive
        onConfirm={() => {
          if (confirming) void deleteProject(confirming.id);
          setConfirming(null);
        }}
      />
    </nav>
  );
}
