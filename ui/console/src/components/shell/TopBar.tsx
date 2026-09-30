import type { ReactNode } from "react";
import {
  CommandIcon,
  MagnifyingGlassIcon,
  NotepadIcon,
  QuestionIcon,
  SidebarSimpleIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import { Link, NavLink } from "react-router";
import type { Project } from "../../api/types";
import { LineIndicator } from "./LineIndicator";
import { UserMenu } from "./UserMenu";
import { IconButton } from "../ui/IconButton";
import { cn } from "../../lib/cn";

/** A labeled destination. The label collapses to the icon on narrow screens but stays the
 * accessible name, so nothing in the chrome is an unexplained glyph. */
function NavItem({
  to,
  label,
  icon,
  compact,
}: {
  to: string;
  label: string;
  icon: ReactNode;
  /** On a project page the line needs the room, so labels wait for a wider screen. */
  compact: boolean;
}) {
  return (
    <NavLink
      to={to}
      aria-label={label}
      title={label}
      className={({ isActive }) =>
        cn(
          "flex h-8 items-center gap-1.5 rounded-sm px-2 text-2xs font-medium transition-colors",
          isActive ? "bg-sunken text-fg" : "text-fg-subtle hover:bg-sunken hover:text-fg",
        )
      }
    >
      {icon}
      <span aria-hidden="true" className={cn("hidden", compact ? "2xl:inline" : "lg:inline")}>
        {label}
      </span>
    </NavLink>
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
  onOpenHelp,
}: {
  project: Project | null;
  needsYouCount: number;
  railOpen: boolean;
  onToggleRail: () => void;
  onOpenPalette: () => void;
  onOpenHelp: () => void;
}) {
  const compact = project !== null;
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line-subtle bg-surface px-3">
      <IconButton
        label={railOpen ? "Collapse project list" : "Expand project list"}
        icon={<SidebarSimpleIcon className="size-4" />}
        size="sm"
        onClick={onToggleRail}
      />

      <Link to="/" className="flex shrink-0 items-center gap-2">
        <img src="/ua-logo.png" alt="" className="size-6 object-contain" aria-hidden="true" />
        <span className="hidden text-xs font-semibold tracking-tight text-fg sm:inline">
          Hyperdelivery
        </span>
        <span className="sr-only">Hyperdelivery Console — home</span>
      </Link>

      <div className="@container flex min-w-0 flex-1 items-center justify-center gap-3">
        {project && (
          <>
            <span className="hidden max-w-48 min-w-0 truncate text-xs font-medium text-fg-muted @min-[44rem]:block">
              {project.name}
            </span>
            <LineIndicator station={project.station} />
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenPalette}
        className="hidden h-8 shrink-0 items-center gap-2 rounded-sm border border-line bg-canvas px-2.5 text-xs text-fg-subtle transition-colors hover:border-line-strong hover:text-fg-muted md:flex md:w-44 lg:w-56 xl:w-64"
      >
        <MagnifyingGlassIcon className="size-4 shrink-0" />
        <span className="truncate">Search projects and actions</span>
        <kbd className="ml-auto flex shrink-0 items-center gap-0.5 rounded-sm border border-line-subtle bg-surface px-1.5 py-0.5 font-sans text-2xs text-fg-subtle">
          <CommandIcon className="size-3" />K
        </kbd>
      </button>

      {needsYouCount > 0 && (
        <Link
          to="/"
          aria-label={`${needsYouCount} waiting for approval`}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent-line bg-accent-bg px-2 py-0.5 text-2xs font-medium whitespace-nowrap text-accent-text transition-colors hover:border-accent"
        >
          <span className="tabular">{needsYouCount}</span> waiting
          <span className={cn("hidden", compact ? "2xl:inline" : "lg:inline")}>for approval</span>
        </Link>
      )}

      <nav aria-label="Main" className="flex shrink-0 items-center gap-0.5">
        <NavItem
          to="/portfolio"
          label="Portfolio"
          icon={<SquaresFourIcon className="size-4" />}
          compact={compact}
        />
        <NavItem
          to="/context"
          label="Workspace notes"
          icon={<NotepadIcon className="size-4" />}
          compact={compact}
        />
      </nav>

      <IconButton
        label="Help"
        icon={<QuestionIcon className="size-4" />}
        size="sm"
        onClick={onOpenHelp}
      />

      <UserMenu />
    </header>
  );
}
