import { CommandIcon, FileTextIcon, MagnifyingGlassIcon, SidebarSimpleIcon, SquaresFourIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import type { Project } from "../../api/types";
import { useProjectsStore, type ViewMode } from "../../store/useProjectsStore";
import { LineIndicator } from "./LineIndicator";
import { UserMenu } from "./UserMenu";
import { IconButton } from "../ui/IconButton";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/cn";

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: "developer", label: "Developer" },
  { value: "pm", label: "PM" },
];

/** Developer sees the full trace behind every turn; PM sees only the synthesized reply
 * and the structured artifact - same data, less of the how. Global, not per-project: it
 * is how this person reads the console, not something about the work itself. */
function ViewModeToggle() {
  const viewMode = useProjectsStore((s) => s.viewMode);
  const setViewMode = useProjectsStore((s) => s.setViewMode);
  return (
    <div
      role="radiogroup"
      aria-label="Detail level"
      className="hidden items-center rounded-sm border border-line p-0.5 sm:flex"
    >
      {VIEW_MODES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={viewMode === value}
          onClick={() => setViewMode(value)}
          className={cn(
            "rounded-[3px] px-2 py-1 text-2xs font-medium transition-colors",
            viewMode === value
              ? "bg-sunken text-fg"
              : "text-fg-subtle hover:text-fg-muted",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** 56px of chrome that never changes shape: what this is, where the work is, who you
 * are. Everything else in the app scrolls; this does not. */
export function TopBar({
  project,
  needsYouCount,
  railOpen,
  onToggleRail,
  onOpenPalette,
}: {
  project: Project | null;
  needsYouCount: number;
  railOpen: boolean;
  onToggleRail: () => void;
  onOpenPalette: () => void;
}) {
  const navigate = useNavigate();
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line-subtle bg-surface px-3">
      <IconButton
        label={railOpen ? "Collapse project list" : "Expand project list"}
        icon={<SidebarSimpleIcon className="size-4" />}
        size="sm"
        onClick={onToggleRail}
      />

      <a href="/" className="flex shrink-0 items-center gap-2">
        <img src="/ua-logo.png" alt="" className="size-6 object-contain" aria-hidden="true" />
        <span className="hidden text-xs font-semibold tracking-tight text-fg sm:inline">
          Hyperdelivery
        </span>
        <span className="sr-only">Hyperdelivery Console — home</span>
      </a>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
        {project && (
          <>
            <span className="hidden min-w-0 truncate text-xs font-medium text-fg-muted lg:block">
              {project.name}
            </span>
            <LineIndicator station={project.station} />
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenPalette}
        className="hidden h-8 items-center gap-2 rounded-sm border border-line px-2.5 text-2xs text-fg-subtle transition-colors hover:border-line-strong hover:text-fg-muted md:flex"
      >
        <MagnifyingGlassIcon className="size-3.5" />
        Search
        <kbd className="ml-2 flex items-center gap-0.5 rounded-sm bg-sunken px-1 py-0.5 font-sans text-2xs text-fg-subtle">
          <CommandIcon className="size-2.5" />K
        </kbd>
      </button>

      {needsYouCount > 0 && (
        <Badge tone="accent">
          {needsYouCount} need{needsYouCount === 1 ? "s" : ""} you
        </Badge>
      )}

      <ViewModeToggle />

      <IconButton
        label="Context"
        icon={<FileTextIcon className="size-4" />}
        size="sm"
        onClick={() => navigate("/context")}
      />

      <IconButton
        label="Project portfolio"
        icon={<SquaresFourIcon className="size-4" />}
        size="sm"
        onClick={() => navigate("/portfolio")}
      />

      <UserMenu />
    </header>
  );
}
