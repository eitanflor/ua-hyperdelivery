import { CommandIcon, MagnifyingGlassIcon, SidebarSimpleIcon } from "@phosphor-icons/react";
import type { Project } from "../../api/types";
import { LineIndicator } from "./LineIndicator";
import { UserMenu } from "./UserMenu";
import { IconButton } from "../ui/IconButton";
import { Badge } from "../ui/Badge";

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

      <UserMenu />
    </header>
  );
}
