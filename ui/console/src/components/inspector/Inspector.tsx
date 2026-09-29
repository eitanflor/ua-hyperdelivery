import { useState, type ReactNode } from "react";
import {
  ArrowsInSimpleIcon,
  ArrowsOutSimpleIcon,
  BooksIcon,
  FlowArrowIcon,
  ListChecksIcon,
  XIcon,
} from "@phosphor-icons/react";
import type { Artifact } from "../../api/types";
import { hasContent } from "../../api/artifacts";
import { AGENT_META, AGENT_STATIONS } from "../../lib/pipeline";
import { AgentFace } from "../agents/AgentFace";
import { IconButton } from "../ui/IconButton";
import { Tooltip } from "../ui/Tooltip";
import { cn } from "../../lib/cn";
import { rovingKeyDown } from "../../lib/roving";
import { DocumentViewer } from "./DocumentViewer";
import { ProgressView } from "./ProgressView";
import { SourcesView } from "./SourcesView";
import { TraceView } from "./TraceView";

/** Past this many tabs the row no longer fits a normal-width panel, so Progress, Sources and
 * Trace (whose icons are distinct) show only their icon when not open. The agents' tabs never
 * do: two robot faces with no name are indistinguishable. The open tab always keeps its name. */
const COMPACT_AT = 5;

function PanelTab({
  active,
  onClick,
  className,
  title,
  icon,
  label,
  compact = false,
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
  title?: string;
  icon: ReactNode;
  label: string;
  compact?: boolean;
}) {
  const iconOnly = compact && !active;
  const tab = (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? undefined : title}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-sm py-1.5 text-2xs font-medium transition-colors",
        iconOnly ? "px-2" : "px-2.5",
        active ? (className ?? "bg-sunken text-fg") : "text-fg-subtle hover:bg-sunken hover:text-fg-muted",
      )}
    >
      {icon}
      {!iconOnly && label}
    </button>
  );
  return iconOnly ? <Tooltip content={title ? `${label} · ${title}` : label}>{tab}</Tooltip> : tab;
}

/** The side panel: where the project is, what the crew read, then each station's document.
 * Which tab is open lives in the URL (`?panel=`, `?section=`), so a copied link reopens the
 * same document at the same section. */
export function Inspector({
  projectId,
  artifacts,
  panel,
  section,
  onPanel,
  onSection,
  onClose,
}: {
  projectId: string;
  artifacts: Artifact[];
  /** "progress", "sources", or the agent whose document is open. */
  panel: string;
  section?: string;
  onPanel: (panel: string) => void;
  onSection: (id: string | null) => void;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // An intake turn is persisted but is not a document - it belongs above the composer as
  // a question, not in here as something to review. Sorted by the station's place on the
  // line rather than array order, which reflects whichever agent last wrote an artifact.
  const documents = artifacts
    .filter((a) => hasContent(a.content))
    .sort(
      (a, b) =>
        (AGENT_STATIONS as string[]).indexOf(a.agent) -
        (AGENT_STATIONS as string[]).indexOf(b.agent),
    );
  const selected = documents.find((a) => a.agent === panel) ?? null;
  const canTrace = documents.some((a) => a.agent === "distill");
  const view =
    panel === "sources" ? "sources" : panel === "trace" && canTrace ? "trace" : selected ? "document" : "progress";
  const compact = !expanded && 2 + (canTrace ? 1 : 0) + documents.length >= COMPACT_AT;

  return (
    <aside
      aria-label="Progress, sources and documents"
      className={cn(
        // shrinks before the thread does: the conversation keeps a readable column however
        // wide the panel is asked to be, with the project list open or not
        "flex min-w-[20rem] shrink flex-col border-l border-line-subtle bg-canvas transition-[width] duration-200",
        // a steady width rather than half the screen: the reading column beside it keeps
        // its measure, and the panel does not jump as documents arrive
        expanded ? "w-[min(64rem,70vw)]" : "w-[clamp(22rem,34vw,38rem)]",
      )}
    >
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-line-subtle px-2">
        <div
          role="tablist"
          aria-label="Panel views"
          onKeyDown={(e) => rovingKeyDown(e, '[role="tab"]', (tab) => tab.click())}
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto"
        >
          <PanelTab
            active={view === "progress"}
            onClick={() => onPanel("progress")}
            icon={<ListChecksIcon className="size-4" />}
            label="Progress"
            compact={compact}
          />
          <PanelTab
            active={view === "sources"}
            onClick={() => onPanel("sources")}
            icon={<BooksIcon className="size-4" />}
            label="Sources"
            compact={compact}
          />
          {canTrace && (
            <PanelTab
              active={view === "trace"}
              title="Each requirement from plan to demo"
              onClick={() => onPanel("trace")}
              icon={<FlowArrowIcon className="size-4" />}
              label="Trace"
              compact={compact}
            />
          )}
          {documents.length > 0 && <span aria-hidden="true" className="mx-0.5 my-1.5 w-px shrink-0 bg-line-subtle" />}
          {documents.map((a) => {
            const meta = AGENT_META[a.agent];
            return (
              <PanelTab
                key={a.agent}
                active={a.agent === selected?.agent}
                title={meta?.output}
                className={cn(meta?.bg, meta?.fg)}
                onClick={() => onPanel(a.agent)}
                icon={meta ? <AgentFace agent={meta.face} className="size-4" /> : null}
                label={meta?.name ?? a.agent}
              />
            );
          })}
        </div>
        <IconButton
          label={expanded ? "Narrow the panel" : "Widen the panel"}
          size="sm"
          icon={
            expanded ? (
              <ArrowsInSimpleIcon className="size-4" />
            ) : (
              <ArrowsOutSimpleIcon className="size-4" />
            )
          }
          onClick={() => setExpanded((v) => !v)}
        />
        <IconButton
          label="Close panel"
          size="sm"
          icon={<XIcon className="size-4" />}
          onClick={onClose}
        />
      </div>

      {view === "progress" && <ProgressView projectId={projectId} documents={documents} onOpen={onPanel} />}
      {view === "sources" && <SourcesView projectId={projectId} artifacts={documents} />}
      {view === "trace" && <TraceView artifacts={documents} />}
      {view === "document" && selected && (
        <DocumentViewer
          key={selected.agent}
          projectId={projectId}
          artifact={selected}
          section={section}
          onSection={onSection}
        />
      )}
    </aside>
  );
}
