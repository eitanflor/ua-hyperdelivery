import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  ArrowDownIcon,
  ArrowElbowDownLeftIcon,
  ArrowUpIcon,
  GearSixIcon,
  HouseIcon,
  LockSimpleIcon,
  MagnifyingGlassIcon,
  NotepadIcon,
  PlusIcon,
  QuestionIcon,
  SealCheckIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import type { Project } from "../../api/types";
import { useProjectsStore } from "../../store/useProjectsStore";
import { AGENT_META, STATION_META } from "../../lib/pipeline";
import { timeAgo } from "../../lib/time";
import { cn } from "../../lib/cn";
import { AgentFace } from "../agents/AgentFace";
import { Artwork } from "../art/Artwork";

interface Entry {
  id: string;
  group: "Actions" | "Recent projects" | "Projects";
  label: string;
  hint?: string;
  icon?: ReactNode;
  /** Other words someone might type for this - search by intent, not only by label. */
  keywords?: string;
  run: () => void;
}

const RECENT_LIMIT = 5;
const RESULT_LIMIT = 20;

function ProjectIcon({ project }: { project: Project }) {
  const meta = STATION_META[project.station];
  if (meta.kind === "gate") return <LockSimpleIcon className="size-4 shrink-0 text-accent-text" />;
  if (meta.kind === "done") return <SealCheckIcon weight="fill" className="size-4 shrink-0 text-success" />;
  const agent = AGENT_META[meta.agent!];
  return agent ? <AgentFace agent={agent.face} className={cn("size-4 shrink-0", agent.fg)} /> : null;
}

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-line-subtle bg-surface px-1 font-sans text-2xs text-fg-muted">
      {children}
    </kbd>
  );
}

/** Keyboard-first switching and actions. The rail is for browsing; this is for people who
 * already know where they are going. */
export function CommandPalette({
  open,
  onOpenChange,
  onOpenHelp,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenHelp: () => void;
}) {
  const navigate = useNavigate();
  const recentProjects = useProjectsStore((s) => s.recentProjects);
  const projectsById = useProjectsStore((s) => s.projects);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const entries = useMemo<Entry[]>(() => {
    const go = (path: string) => () => {
      onOpenChange(false);
      void navigate(path);
    };
    const actions: Entry[] = [
      {
        id: "start",
        group: "Actions",
        label: "Start a project",
        icon: <PlusIcon className="size-4 shrink-0" />,
        keywords: "new create idea fsd brief",
        run: go("/start"),
      },
      {
        id: "home",
        group: "Actions",
        label: "Home",
        icon: <HouseIcon className="size-4 shrink-0" />,
        keywords: "approve approval waiting questions needs me",
        run: go("/"),
      },
      {
        id: "portfolio",
        group: "Actions",
        label: "Portfolio",
        icon: <SquaresFourIcon className="size-4 shrink-0" />,
        keywords: "all projects status",
        run: go("/portfolio"),
      },
      {
        id: "notes",
        group: "Actions",
        label: "Workspace notes",
        icon: <NotepadIcon className="size-4 shrink-0" />,
        keywords: "context conventions repository database",
        run: go("/context"),
      },
      {
        id: "settings",
        group: "Actions",
        label: "Settings",
        icon: <GearSixIcon className="size-4 shrink-0" />,
        keywords: "simple detailed detail level theme dark light role preferences",
        run: go("/settings"),
      },
      {
        id: "help",
        group: "Actions",
        label: "Help and glossary",
        icon: <QuestionIcon className="size-4 shrink-0" />,
        keywords: "how it works gate stage crew definition",
        run: () => {
          onOpenChange(false);
          onOpenHelp();
        },
      },
    ];
    const toEntry = (project: Project, group: Entry["group"]): Entry => ({
      id: `project:${project.id}`,
      group,
      label: project.name,
      hint: `${STATION_META[project.station].label} · ${timeAgo(project.updated_at)}`,
      icon: <ProjectIcon project={project} />,
      run: go(`/projects/${project.id}`),
    });

    // only projects this API still has - a recent without one is stale, not a destination
    const recents = recentProjects.flatMap((r) => projectsById[r.id] ?? []);
    const q = query.trim().toLowerCase();
    if (!q) {
      return [...actions, ...recents.slice(0, RECENT_LIMIT).map((p) => toEntry(p, "Recent projects"))];
    }

    const recentIds = new Set(recents.map((p) => p.id));
    const matches = Object.values(projectsById)
      .filter((p) => p.name.toLowerCase().includes(q))
      .sort(
        (a, b) =>
          Number(recentIds.has(b.id)) - Number(recentIds.has(a.id)) ||
          b.updated_at.localeCompare(a.updated_at),
      )
      .slice(0, RESULT_LIMIT)
      .map((p) => toEntry(p, "Projects"));
    return [
      ...actions.filter((a) => `${a.label} ${a.keywords ?? ""}`.toLowerCase().includes(q)),
      ...matches,
    ];
  }, [recentProjects, projectsById, query, navigate, onOpenChange, onOpenHelp]);

  const clamped = Math.min(cursor, Math.max(entries.length - 1, 0));
  const active = entries[clamped];

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [clamped, entries]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setQuery("");
          setCursor(0);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 animate-fade bg-fg/25" />
        <Dialog.Content className="fixed top-[14vh] left-1/2 z-50 flex max-h-[72vh] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 animate-pop flex-col overflow-hidden rounded-md border border-line bg-overlay shadow-overlay">
          <Dialog.Title className="sr-only">Search projects and commands</Dialog.Title>
          <Dialog.Description className="sr-only">
            Type to filter. Use the arrow keys to move and Enter to open.
          </Dialog.Description>

          <div className="flex shrink-0 items-center gap-3 border-b border-line-subtle px-4">
            <MagnifyingGlassIcon className="size-5 shrink-0 text-fg-subtle" />
            <input
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={active ? `${listId}-${active.id}` : undefined}
              aria-label="Search projects and actions"
              className="h-14 flex-1 bg-transparent text-base text-fg placeholder:text-fg-subtle focus:outline-none"
              placeholder="Search projects and actions…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCursor(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setCursor((c) => Math.min(c + 1, entries.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setCursor((c) => Math.max(c - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  active?.run();
                }
              }}
            />
          </div>

          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Results"
            className="min-h-0 flex-1 overflow-y-auto p-2"
          >
            {entries.length === 0 && (
              <li role="presentation" className="px-3 py-10 text-center text-sm text-fg-subtle">
                <Artwork id="d5-search" className="mx-auto mb-3 block h-16 w-auto" />
                Nothing matches “{query}”.
              </li>
            )}
            {entries.map((entry, i) => (
              <li key={entry.id} role="presentation">
                {entry.group !== entries[i - 1]?.group && (
                  <p
                    role="presentation"
                    className={cn("px-3 pb-1.5 text-2xs font-medium text-fg-subtle", i === 0 ? "pt-1" : "pt-3")}
                  >
                    {entry.group}
                  </p>
                )}
                <div
                  id={`${listId}-${entry.id}`}
                  role="option"
                  aria-selected={i === clamped}
                  onMouseMove={() => setCursor(i)}
                  onClick={entry.run}
                  className={cn(
                    "flex h-10 cursor-pointer items-center gap-3 rounded-sm px-3 text-sm",
                    i === clamped ? "bg-sunken text-fg" : "text-fg-muted",
                  )}
                >
                  {entry.icon}
                  <span className="truncate">{entry.label}</span>
                  {entry.hint && (
                    <span className="ml-auto shrink-0 pl-3 text-xs text-fg-subtle">{entry.hint}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-4 border-t border-line-subtle px-4 py-2.5 text-2xs text-fg-subtle">
            <span className="flex items-center gap-1.5">
              <Key>
                <ArrowUpIcon className="size-3" aria-label="Up" />
              </Key>
              <Key>
                <ArrowDownIcon className="size-3" aria-label="Down" />
              </Key>
              to move
            </span>
            <span className="flex items-center gap-1.5">
              <Key>
                <ArrowElbowDownLeftIcon className="size-3" aria-label="Enter" />
              </Key>
              to open
            </span>
            <span className="flex items-center gap-1.5">
              <Key>Esc</Key>
              to close
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
