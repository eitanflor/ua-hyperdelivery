import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { useProjectsStore } from "../../store/useProjectsStore";
import { STATION_META } from "../../lib/pipeline";
import { cn } from "../../lib/cn";

interface Entry {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

/** Keyboard-first project switching. The rail is for browsing; this is for people who
 * already know where they are going. */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const recentProjects = useProjectsStore((s) => s.recentProjects);
  const projectsById = useProjectsStore((s) => s.projects);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  const entries = useMemo<Entry[]>(() => {
    const go = (path: string) => () => {
      onOpenChange(false);
      void navigate(path);
    };
    const items: Entry[] = [{ id: "new", label: "New project", run: go("/") }];
    for (const p of recentProjects) {
      const station = projectsById[p.id]?.station;
      items.push({
        id: p.id,
        label: p.name,
        hint: station ? STATION_META[station].full : undefined,
        run: go(`/projects/${p.id}`),
      });
    }
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;
  }, [recentProjects, projectsById, query, navigate, onOpenChange]);

  const clamped = Math.min(cursor, Math.max(entries.length - 1, 0));

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
        <Dialog.Content className="fixed top-[18vh] left-1/2 z-50 w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 animate-pop overflow-hidden rounded-md border border-line bg-overlay shadow-overlay">
          <Dialog.Title className="sr-only">Search projects and commands</Dialog.Title>
          <Dialog.Description className="sr-only">
            Type to filter. Use the arrow keys to move and Enter to open.
          </Dialog.Description>

          <div className="flex items-center gap-2 border-b border-line-subtle px-3">
            <MagnifyingGlassIcon className="size-4 shrink-0 text-fg-subtle" />
            <input
              autoFocus
              className="h-11 flex-1 bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
              placeholder="Search projects…"
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
                  entries[clamped]?.run();
                }
              }}
            />
          </div>

          <ul className="max-h-72 overflow-y-auto p-1">
            {entries.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-fg-subtle">
                Nothing matches “{query}”.
              </li>
            )}
            {entries.map((entry, i) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={entry.run}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-xs",
                    i === clamped ? "bg-sunken text-fg" : "text-fg-muted",
                  )}
                >
                  {entry.id === "new" && <PlusIcon className="size-3.5 shrink-0" />}
                  <span className="truncate">{entry.label}</span>
                  {entry.hint && (
                    <span className="ml-auto shrink-0 text-2xs text-fg-subtle">
                      {entry.hint}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
