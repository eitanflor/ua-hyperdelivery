import { useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useProjectsStore } from "../store/useProjectsStore";
import type { Station } from "../api/types";
import { stationBadge } from "../lib/pipeline";
import { useCurrentUser } from "../auth/useCurrentUser";
import { NewProjectComposer } from "./NewProjectComposer";

const APPROVAL_STATIONS = ["blueprint_approval", "review_approval"] as const;

interface ProjectRow {
  id: string;
  name: string;
  station: Station | undefined;
}

export function Sidebar({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (projectId: string | null) => void;
}) {
  const recentProjects = useProjectsStore((s) => s.recentProjects);
  const projectsById = useProjectsStore((s) => s.projects);
  const pendingByStation = useProjectsStore((s) => s.pendingByStation);
  const loadPending = useProjectsStore((s) => s.loadPending);
  const loadProject = useProjectsStore((s) => s.loadProject);
  const deleteProject = useProjectsStore((s) => s.deleteProject);
  const renameProject = useProjectsStore((s) => s.renameProject);
  const [lookupId, setLookupId] = useState("");
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    for (const station of APPROVAL_STATIONS) void loadPending(station);
    // also refresh each recent project's station, so its gate badge (below) reflects
    // reality even if it was approved/advanced from somewhere else since last visit
    for (const p of recentProjects) void loadProject(p.id);
    // mount-only - Sidebar owns this refresh, re-running per recentProjects
    // change would refetch everything on every rename/reorder
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingProjects = APPROVAL_STATIONS.flatMap((station) => pendingByStation[station] ?? []);

  // one merged list instead of a separate "needs a decision" section - projects
  // already visited (recentProjects) plus any pending-decision project the user
  // hasn't opened yet, each tagged with a station/gate badge instead of a status label
  const rows = useMemo<ProjectRow[]>(() => {
    const byId = new Map<string, ProjectRow>();
    for (const p of recentProjects) {
      byId.set(p.id, { id: p.id, name: p.name, station: projectsById[p.id]?.station });
    }
    for (const p of pendingProjects) {
      if (!byId.has(p.id)) byId.set(p.id, { id: p.id, name: p.name, station: p.station });
    }
    return [...byId.values()];
  }, [recentProjects, pendingProjects, projectsById]);

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((p) => p.name.toLowerCase().includes(q));
  }, [rows, filter]);

  const user = useCurrentUser();
  const { instance } = useMsal();

  const handleDelete = async (project: ProjectRow) => {
    if (!window.confirm(`Delete "${project.name}"? This can't be undone.`)) return;
    await deleteProject(project.id);
    if (selectedId === project.id) onSelect(null);
  };

  const startRename = (project: ProjectRow) => {
    setEditingId(project.id);
    setEditingName(project.name);
  };

  const commitRename = async (project: ProjectRow) => {
    const name = editingName.trim();
    setEditingId(null);
    if (!name || name === project.name) return;
    await renameProject(project.id, name);
  };

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col gap-6 border-r border-white/5 bg-ua-black p-4">
      <div className="px-1">
        <h1 className="text-sm font-bold tracking-tight text-ua-cloud">
          Hyperdelivery <span className="text-ua-red">Console</span>
        </h1>
        <p className="text-[11px] text-ua-steel">Distill → Blueprint → Review → Showroom</p>
        {user && (
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="truncate text-[11px] text-ua-fog" title={user.email}>
              {user.name}
            </span>
            <button
              className="shrink-0 text-[11px] text-ua-steel underline-offset-2 hover:text-ua-cloud hover:underline"
              onClick={() => void instance.logoutRedirect()}
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      <NewProjectComposer onCreated={onSelect} />

      <div className="flex-1 overflow-y-auto">
        <h2 className="mb-2 px-1 text-xs font-semibold tracking-wide text-ua-fog uppercase">
          Projects
        </h2>
        {rows.length > 3 && (
          <input
            className="mb-2 w-full rounded-md bg-white/5 px-2.5 py-1.5 text-xs text-ua-cloud placeholder:text-ua-steel focus:outline-none focus:ring-1 focus:ring-ua-red/50"
            placeholder="Filter projects..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        )}
        {rows.length === 0 ? (
          <p className="px-1 text-sm text-ua-steel">No projects yet.</p>
        ) : filteredRows.length === 0 ? (
          <p className="px-1 text-sm text-ua-steel">No projects match "{filter}".</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {filteredRows.map((project) => {
              const needsDecision =
                project.station === "blueprint_approval" || project.station === "review_approval";
              const isDone = project.station === "done";
              const badge = project.station ? stationBadge(project.station) : null;
              return (
                <li key={project.id}>
                  <div
                    className={
                      "group flex w-full items-center gap-1 rounded-lg border-l-2 pl-2.5 text-sm transition-colors " +
                      (selectedId === project.id
                        ? "border-white/50 bg-white/10 font-medium text-ua-cloud"
                        : "border-transparent text-ua-fog hover:bg-white/5 hover:text-ua-cloud")
                    }
                  >
                    {editingId === project.id ? (
                      <input
                        autoFocus
                        className="min-w-0 flex-1 rounded-md bg-white/10 px-2 py-1 text-sm text-ua-cloud focus:outline-none"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => void commitRename(project)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void commitRename(project);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                    ) : (
                      <button
                        className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
                        onClick={() => onSelect(project.id)}
                      >
                        <span className="truncate">{project.name}</span>
                        {badge && needsDecision && (
                          <span
                            className={`ml-auto flex h-4 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        )}
                        {badge && isDone && (
                          <span className="ml-auto shrink-0 text-xs text-emerald-500">✓</span>
                        )}
                        {badge && !needsDecision && !isDone && (
                          <span className="ml-auto shrink-0 text-[10px] font-medium text-ua-steel">
                            {badge.label}
                          </span>
                        )}
                      </button>
                    )}
                    {editingId !== project.id && (
                      <>
                        <button
                          className="shrink-0 rounded-md p-1.5 text-ua-steel opacity-0 transition-opacity hover:text-ua-cloud group-hover:opacity-100"
                          onClick={() => startRename(project)}
                          aria-label={`Rename ${project.name}`}
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <button
                          className="shrink-0 rounded-md p-1.5 text-ua-steel opacity-0 transition-opacity hover:text-ua-red group-hover:opacity-100"
                          onClick={() => void handleDelete(project)}
                          aria-label={`Delete ${project.name}`}
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>


      <div className="flex gap-2 border-t border-white/5 pt-3">
        <input
          className="min-w-0 flex-1 rounded-md bg-ua-black px-2.5 py-1.5 text-xs text-ua-cloud placeholder:text-ua-fog focus:outline-none focus:ring-1 focus:ring-ua-red/50"
          placeholder="Open project by ID"
          value={lookupId}
          onChange={(e) => setLookupId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && lookupId.trim()) onSelect(lookupId.trim());
          }}
        />
      </div>
    </aside>
  );
}
