import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import {
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useProjectsStore } from "../../store/useProjectsStore";
import type { Station } from "../../api/types";
import { AGENT_META, STATION_META } from "../../lib/pipeline";
import { AgentFace } from "../agents/AgentFace";
import { IconButton } from "../ui/IconButton";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { cn } from "../../lib/cn";

const GATES: Station[] = ["blueprint_approval", "review_approval", "showroom_approval"];

interface Row {
  id: string;
  name: string;
  station: Station | undefined;
}

type Group = "needsYou" | "active" | "done";

const GROUP_LABEL: Record<Group, string> = {
  needsYou: "Needs you",
  active: "Active",
  done: "Done",
};

function groupOf(station: Station | undefined): Group {
  if (station === "done") return "done";
  if (station && STATION_META[station].kind === "gate") return "needsYou";
  return "active";
}

/** The station chip. One canonical form, everywhere a station appears in a list. */
function StationChip({ station }: { station: Station | undefined }) {
  if (!station) return null;
  const meta = STATION_META[station];
  const agent = meta.agent ? AGENT_META[meta.agent] : undefined;

  return (
    <span
      className={cn(
        "ml-auto flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-2xs font-medium",
        meta.kind === "gate" && "bg-accent-bg text-accent-text",
        meta.kind === "done" && "bg-success-bg text-success",
        meta.kind === "agent" && agent && `${agent.bg} ${agent.fg}`,
      )}
    >
      {agent && <AgentFace agent={agent.face} className="size-3.5" />}
      {meta.label}
    </span>
  );
}

export function ProjectRail({ open }: { open: boolean }) {
  const navigate = useNavigate();
  const projectsById = useProjectsStore((s) => s.projects);
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

  const rows = useMemo<Row[]>(
    () =>
      Object.values(projectsById).map((p) => ({ id: p.id, name: p.name, station: p.station })),
    [projectsById],
  );

  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const matched = q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;
    return {
      needsYou: matched.filter((r) => groupOf(r.station) === "needsYou"),
      active: matched.filter((r) => groupOf(r.station) === "active"),
      done: matched.filter((r) => groupOf(r.station) === "done"),
    };
  }, [rows, filter]);

  const commitRename = async (row: Row) => {
    const name = editingName.trim();
    setEditingId(null);
    if (!name || name === row.name) return;
    await renameProject(row.id, name);
  };

  if (!open) return null;

  return (
    <nav
      aria-label="Projects"
      className="flex w-64 shrink-0 flex-col gap-3 border-r border-line-subtle bg-sunken p-3"
    >
      <Button
        variant="secondary"
        size="sm"
        icon={<PlusIcon className="size-3.5" />}
        onClick={() => void navigate("/")}
        className="w-full"
      >
        New project
      </Button>

      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-fg-subtle" />
        <input
          className="h-8 w-full rounded-sm border border-line bg-surface pr-2 pl-8 text-2xs text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          placeholder="Filter projects"
          aria-label="Filter projects"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="-mx-1 flex-1 overflow-y-auto px-1">
        {rows.length === 0 && (
          <p className="px-1 py-6 text-center text-2xs leading-relaxed text-fg-subtle">
            No projects yet.
            <br />
            Describe one to get started.
          </p>
        )}

        {(["needsYou", "active", "done"] as const).map((group) =>
          groups[group].length === 0 ? null : (
            <section key={group} className="mb-4">
              <h2 className="mb-1 flex items-center gap-1.5 px-1 text-2xs font-semibold tracking-wide text-fg-subtle uppercase">
                {group === "needsYou" && <span className="size-1.5 rounded-full bg-accent" />}
                {GROUP_LABEL[group]}
                <span className="tabular">{groups[group].length}</span>
              </h2>
              <ul className="flex flex-col gap-0.5">
                {groups[group].map((row) => (
                  <li key={row.id} className="group/row">
                    {editingId === row.id ? (
                      <input
                        autoFocus
                        aria-label={`Rename ${row.name}`}
                        className="w-full rounded-sm border border-accent bg-surface px-2 py-1.5 text-xs text-fg focus:outline-none"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => void commitRename(row)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void commitRename(row);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    ) : (
                      <div className="flex items-center gap-0.5 rounded-sm transition-colors hover:bg-surface has-[.active]:bg-surface">
                        <NavLink
                          to={`/projects/${row.id}`}
                          title={row.name}
                          className={({ isActive }) =>
                            cn(
                              "flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-1.5 text-xs",
                              isActive ? "active font-medium text-fg" : "text-fg-muted",
                            )
                          }
                        >
                          <span className="truncate">{row.name}</span>
                          <StationChip station={row.station} />
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
                ))}
              </ul>
            </section>
          ),
        )}
      </div>

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(next) => !next && setConfirming(null)}
        title={`Delete "${confirming?.name ?? ""}"?`}
        description="This removes the project, every artifact its agents produced, and its decision history. It cannot be undone."
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
