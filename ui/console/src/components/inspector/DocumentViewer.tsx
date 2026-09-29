import { lazy, Suspense, useEffect, useRef, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ArrowsClockwiseIcon,
  DownloadSimpleIcon,
  FileDocIcon,
  FilePdfIcon,
  LinkSimpleIcon,
  MarkdownLogoIcon,
} from "@phosphor-icons/react";
import type { Artifact, Station } from "../../api/types";
import {
  artifactKind,
  completeness,
  list,
  str,
  type Coverage,
} from "../../api/artifacts";
import { AGENT_META, AGENT_STATIONS, PIPELINE, STATION_META, stationIndex } from "../../lib/pipeline";
import { documentStats } from "../../lib/documentStats";
import { downloadMarkdown, downloadWord, printDocument, type ExportMeta } from "../../lib/exportDocument";
import { lastSeenVersion, markSeen } from "../../lib/seenVersions";
import { formatWhen, timeAgo } from "../../lib/time";
import { personName } from "../../lib/people";
import { cn } from "../../lib/cn";
import { useProjectsStore, type ViewMode } from "../../store/useProjectsStore";
import { AgentFace } from "../agents/AgentFace";
import { ChangesView } from "./ChangesView";
import { SelectionActions } from "./SelectionActions";
import { BlueprintView, DemoView, GenericView, ReviewView, SpecView } from "./views";

// the canvas library is the heaviest thing in the console; nobody pays for it until they
// open a Design tab
const DesignViews = lazy(() => import("../canvas/DesignViews"));

type TabId = "design" | "content" | "raw" | "changes";

function ContentBody({
  artifact,
  viewMode,
  asking,
}: {
  artifact: Artifact;
  viewMode: ViewMode;
  /** The project is still at this document's station, so its open questions are live. */
  asking: boolean;
}) {
  switch (artifactKind(artifact.agent)) {
    case "spec":
      return <SpecView content={artifact.content} viewMode={viewMode} asking={asking} />;
    case "blueprint":
      return <BlueprintView content={artifact.content} viewMode={viewMode} />;
    case "review":
      return <ReviewView content={artifact.content} viewMode={viewMode} />;
    case "demo":
      return <DemoView content={artifact.content} viewMode={viewMode} />;
    default:
      return <GenericView content={artifact.content} />;
  }
}

/** A ring for a single percentage - reads faster than a bar in a tile this size. */
function Ring({ pct }: { pct: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const tone = pct === 100 ? "text-success" : pct >= 75 ? "text-warning" : "text-danger";
  return (
    <svg viewBox="0 0 36 36" className={cn("size-9 -rotate-90", tone)} aria-hidden="true">
      <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3.5" className="stroke-sunken" />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        className="transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  );
}

interface DocState {
  label: string;
  tone: "neutral" | "accent" | "success" | "warning";
  title?: string;
}

const TONE: Record<DocState["tone"], string> = {
  neutral: "bg-sunken text-fg-muted",
  accent: "bg-accent-bg text-accent-text",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
};

/** Where this document stands on the line, in one chip: still a draft, waiting at its gate,
 * approved (and by whom), or sent back. */
function useDocState(projectId: string, agent: string): DocState {
  const project = useProjectsStore((s) => s.projects[projectId]);
  const decisions = useProjectsStore((s) => s.decisionsByProject[projectId]);
  if (!project) return { label: "Draft", tone: "neutral" };
  const gate = PIPELINE.find((station) => STATION_META[station].reviewing === agent) as Station | undefined;
  if (!gate) {
    return project.station === "done" ? { label: "Final", tone: "success" } : { label: "Draft", tone: "neutral" };
  }
  if (project.station === gate) return { label: `Waiting at ${STATION_META[gate].label}`, tone: "accent" };
  const decision = decisions?.findLast((d) => d.station === gate);
  if (decision && !decision.approved && project.station === agent) {
    return { label: "Sent back, being revised", tone: "warning", title: decision.comment ?? undefined };
  }
  if (stationIndex(project.station) > stationIndex(gate)) {
    if (!decision) return { label: `Approved at ${STATION_META[gate].label}`, tone: "success" };
    const who = personName(decision.signer);
    const when = new Date(decision.decided_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return { label: `Approved by ${who} · ${when}`, tone: "success", title: decision.signer };
  }
  return { label: "Draft", tone: "neutral" };
}

const MENU_ITEM =
  "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-fg-muted outline-none data-disabled:cursor-default data-disabled:opacity-40 data-highlighted:bg-sunken data-highlighted:text-fg";

/** One document, readable end to end: a cover that says what it is and where it stands,
 * the numbers that matter, a contents bar that follows the reader, linkable sections,
 * selection actions, export, and what changed since the last draft
 * (docs/design/patterns/artifacts-and-panels.md). */
export function DocumentViewer({
  projectId,
  artifact,
  section,
  onSection,
}: {
  projectId: string;
  artifact: Artifact;
  section?: string;
  onSection: (id: string | null) => void;
}) {
  const meta = AGENT_META[artifact.agent];
  const project = useProjectsStore((s) => s.projects[projectId]);
  const viewMode = useProjectsStore((s) => s.viewMode);
  const builds = useProjectsStore((s) => s.buildsByProject[projectId]);
  const setComposerDraft = useProjectsStore((s) => s.setComposerDraft);
  const state = useDocState(projectId, artifact.agent);

  const hasDesign = artifactKind(artifact.agent) === "blueprint";
  const showRaw = viewMode === "developer";
  const [seen] = useState(() => lastSeenVersion(projectId, artifact.agent));
  const updatedSinceSeen = seen !== undefined && seen < artifact.version;
  const [tab, setTab] = useState<TabId>(() =>
    // a link that names a Design view (`?design=`) opens on the Design tab
    hasDesign && new URLSearchParams(window.location.search).has("design") ? "design" : "content",
  );
  const activeTab: TabId =
    (tab === "design" && !hasDesign) || (tab === "raw" && !showRaw) || (tab === "changes" && artifact.version < 2)
      ? "content"
      : tab;

  const scroller = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [sections, setSections] = useState<{ id: string; title: string; count?: string }[]>([]);
  const [active, setActive] = useState<string | null>(null);

  const title = str(artifact.content, "title") ?? meta?.output ?? artifact.agent;
  // a quality report's headline is how much of the brief the build meets; the document's own
  // completeness score only says the report is filled in, and read beside "0/7 met" it lies
  const coverage = artifact.agent === "review" ? list<Coverage>(artifact.content, "coverage") : [];
  const score = completeness(artifact.content)?.score;
  const ring =
    coverage.length > 0
      ? {
          pct: Math.round((coverage.filter((c) => c.met).length / coverage.length) * 100),
          value: `${coverage.filter((c) => c.met).length}/${coverage.length}`,
          label: "met",
        }
      : score !== undefined
        ? { pct: Math.round(score * 100), value: `${Math.round(score * 100)}%`, label: "complete" }
        : undefined;
  const stats = documentStats(artifact.agent, artifact.content, builds).filter(
    (s) => s.label !== "complete" && !(ring?.label === "met" && s.label === "requirements met"),
  );
  const exportMeta: ExportMeta = {
    projectName: project?.name ?? "Project",
    output: meta?.output ?? "Document",
    version: artifact.version,
  };
  const askAs =
    project && AGENT_STATIONS.includes(project.station) ? AGENT_META[project.station]?.name : undefined;

  useEffect(() => {
    markSeen(projectId, artifact.agent, artifact.version);
  }, [projectId, artifact.agent, artifact.version]);

  // the contents bar lists whatever sections the current view actually rendered, so it
  // never offers a section Simple mode hides
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const collect = () =>
      setSections(
        [...el.querySelectorAll<HTMLElement>("section[data-section-title]")].map((node) => ({
          id: node.id,
          title: node.dataset.sectionTitle ?? "",
          count: node.dataset.sectionCount,
        })),
      );
    const frame = requestAnimationFrame(collect);
    const observer = new MutationObserver(collect);
    observer.observe(el, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [activeTab, artifact]);

  // a linked section opens at that section once, after the view has laid out - later
  // changes come from the contents bar, which scrolls itself
  const [linkedSection] = useState(section);
  useEffect(() => {
    if (!linkedSection) return;
    const frame = requestAnimationFrame(() =>
      document.getElementById(linkedSection)?.scrollIntoView({ block: "start" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [linkedSection]);

  const onScroll = () => {
    const root = scroller.current;
    if (!root) return;
    const top = root.getBoundingClientRect().top + 64;
    let current: string | null = sections[0]?.id ?? null;
    for (const s of sections) {
      const node = document.getElementById(s.id);
      if (node && node.getBoundingClientRect().top <= top) current = s.id;
    }
    setActive(current);
  };

  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "smooth" });
    onSection(id);
  };

  const quote = (text: string, lead: string) => {
    const quoted = text
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
    const draft = useProjectsStore.getState().composerDrafts[projectId] ?? "";
    setComposerDraft(projectId, `${lead}\n${quoted}\n\n${draft}`.trimEnd() + "\n");
    requestAnimationFrame(() => document.getElementById("composer")?.focus());
  };

  const tabs: { id: TabId; label: string }[] = [
    ...(hasDesign ? [{ id: "design" as const, label: "Design" }] : []),
    { id: "content", label: meta?.output ?? "Document" },
    ...(artifact.version > 1 ? [{ id: "changes" as const, label: "What changed" }] : []),
    ...(showRaw ? [{ id: "raw" as const, label: "JSON" }] : []),
  ];

  return (
    <div ref={scroller} onScroll={onScroll} className="flex-1 overflow-y-auto">
      <header className="px-4 pt-4">
        <div className="flex items-start gap-3">
          {meta && (
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", meta.bg, meta.fg)}>
              <AgentFace agent={meta.face} state="done" className="size-5.5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-2xs font-semibold tracking-wide text-fg-subtle uppercase">
              {meta?.output} · {meta?.name}
            </p>
            <h2 className="mt-0.5 text-base leading-snug font-semibold text-fg">{title}</h2>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-fg-subtle">
              <span title={state.title} className={cn("rounded-full px-2 py-0.5 font-medium", TONE[state.tone])}>
                {state.label}
              </span>
              <span className="tabular">Version {artifact.version}</span>
              <span aria-hidden="true">·</span>
              <span title={formatWhen(artifact.created_at)}>Updated {timeAgo(artifact.created_at)}</span>
            </p>
          </div>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                aria-label="Share or export"
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-sm border border-line px-2.5 text-2xs font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
              >
                <DownloadSimpleIcon className="size-3.5" />
                Export
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="z-50 min-w-48 animate-pop rounded-md border border-line bg-overlay p-1 shadow-overlay"
              >
                <DropdownMenu.Item
                  className={MENU_ITEM}
                  onSelect={() => void navigator.clipboard.writeText(window.location.href)}
                >
                  <LinkSimpleIcon className="size-4" />
                  Copy link to this document
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-line-subtle" />
                <DropdownMenu.Item
                  className={MENU_ITEM}
                  onSelect={() => downloadMarkdown(artifact.agent, artifact.content, exportMeta)}
                >
                  <MarkdownLogoIcon className="size-4" />
                  Markdown
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={MENU_ITEM}
                  disabled={activeTab !== "content"}
                  onSelect={() => body.current && downloadWord(body.current, title, exportMeta)}
                >
                  <FileDocIcon className="size-4" />
                  Word
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={MENU_ITEM}
                  disabled={activeTab !== "content"}
                  onSelect={() => body.current && printDocument(body.current, exportMeta)}
                >
                  <FilePdfIcon className="size-4" />
                  PDF (print)
                </DropdownMenu.Item>
                {activeTab !== "content" && (
                  <p className="px-2 pt-1 pb-1.5 text-2xs text-fg-subtle">
                    Word and PDF export the {meta?.output.toLowerCase() ?? "document"} tab.
                  </p>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {(stats.length > 0 || ring) && (
          <dl className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ring && (
              <div className="flex items-center gap-2.5 rounded-sm border border-line-subtle bg-surface px-3 py-2">
                <Ring pct={ring.pct} />
                <div className="flex flex-col-reverse">
                  <dt className="text-2xs text-fg-muted">{ring.label}</dt>
                  <dd className="tabular text-sm font-semibold text-fg">{ring.value}</dd>
                </div>
              </div>
            )}
            {stats.slice(0, ring ? 3 : 4).map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col-reverse rounded-sm border border-line-subtle bg-surface px-3 py-2"
              >
                <dt className="text-2xs text-fg-muted">{stat.label}</dt>
                <dd
                  className={cn(
                    "tabular text-lg font-semibold",
                    stat.tone === "danger" ? "text-danger" : stat.tone === "warning" ? "text-warning" : "text-fg",
                  )}
                >
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {updatedSinceSeen && activeTab !== "changes" && (
          <p className="mt-3 flex animate-rise items-center gap-2 rounded-sm border border-info/25 bg-info-bg px-3 py-2 text-xs text-info">
            <ArrowsClockwiseIcon className="size-3.5 shrink-0" />
            <span className="flex-1">
              Updated since you last looked - version {seen} to {artifact.version}.
            </span>
            <button type="button" onClick={() => setTab("changes")} className="font-medium underline-offset-2 hover:underline">
              See what changed
            </button>
          </p>
        )}

        {tabs.length > 1 ? (
          <div role="tablist" aria-label="Document view" className="mt-3 flex gap-1 border-b border-line-subtle">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setTab(id)}
                className={cn(
                  "-mb-px border-b-2 px-2.5 py-1.5 text-2xs font-medium transition-colors",
                  activeTab === id
                    ? "border-accent text-fg"
                    : "border-transparent text-fg-subtle hover:text-fg-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-3 border-b border-line-subtle" />
        )}
      </header>

      {activeTab === "content" && sections.length > 1 && (
        <nav
          aria-label="In this document"
          className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-line-subtle bg-canvas/95 px-4 py-2 backdrop-blur-sm"
        >
          {sections.map((s) => {
            const current = (active ?? sections[0]?.id) === s.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-current={current ? "location" : undefined}
                onClick={() => jump(s.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-2xs font-medium whitespace-nowrap transition-colors",
                  current ? "bg-fg text-canvas" : "text-fg-subtle hover:bg-sunken hover:text-fg",
                )}
              >
                {s.title}
                {s.count && <span className="tabular opacity-70">{s.count}</span>}
              </button>
            );
          })}
        </nav>
      )}

      <div className="px-4 pt-4 pb-10">
        {activeTab === "design" && (
          <Suspense
            fallback={<div role="status" aria-label="Loading the diagram" className="h-80 animate-pulse rounded-md bg-sunken" />}
          >
            <DesignViews key={artifact.version} projectId={projectId} artifact={artifact} viewMode={viewMode} />
          </Suspense>
        )}
        {activeTab === "changes" && (
          <ChangesView projectId={projectId} agent={artifact.agent} since={updatedSinceSeen ? seen : undefined} />
        )}
        {activeTab === "raw" && showRaw && <GenericView content={artifact.content} />}
        {activeTab === "content" && (
          <SelectionActions askAs={askAs} onQuote={quote} documentTitle={title}>
            <div ref={body}>
              <ContentBody artifact={artifact} viewMode={viewMode} asking={project?.station === artifact.agent} />
            </div>
          </SelectionActions>
        )}
      </div>
    </div>
  );
}
