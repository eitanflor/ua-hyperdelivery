import { useEffect, useState } from "react";
import {
  ArrowsInSimpleIcon,
  ArrowsOutSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import type { Artifact } from "../../api/types";
import {
  artifactKind,
  hasContent,
  list,
  str,
  type ApiContract,
  type Component,
  type DataEntity,
  type IntegrationPoint,
  type UnitOfWork,
} from "../../api/artifacts";
import { AGENT_META, AGENT_STATIONS } from "../../lib/pipeline";
import { AgentFace } from "../agents/AgentFace";
import { IconButton } from "../ui/IconButton";
import { cn } from "../../lib/cn";
import { useProjectsStore } from "../../store/useProjectsStore";
import { ArchitectureDiagram } from "./ArchitectureDiagram";
import { BlueprintView, DemoView, GenericView, ReviewView, SpecView } from "./views";

type TabId = "design" | "content" | "raw";

function ContentBody({ artifact }: { artifact: Artifact }) {
  switch (artifactKind(artifact.agent)) {
    case "spec":
      return <SpecView content={artifact.content} />;
    case "blueprint":
      return <BlueprintView content={artifact.content} />;
    case "review":
      return <ReviewView content={artifact.content} />;
    case "demo":
      return <DemoView content={artifact.content} />;
    default:
      return <GenericView content={artifact.content} />;
  }
}

function DesignBody({ artifact }: { artifact: Artifact }) {
  return (
    <ArchitectureDiagram
      components={list<Component>(artifact.content, "components")}
      units={list<UnitOfWork>(artifact.content, "units_of_work")}
      integrations={list<IntegrationPoint>(artifact.content, "integration_points")}
      entities={list<DataEntity>(artifact.content, "data_entities")}
      contracts={list<ApiContract>(artifact.content, "api_contracts")}
    />
  );
}

/** The structured output of each station, rendered by a view that knows what it is
 * looking at. A spec, a plan, a gap report and a demo package are different documents
 * and no longer share one generic field walk. */
export function Inspector({
  artifacts,
  selectedAgent,
  onSelectAgent,
  onClose,
}: {
  artifacts: Artifact[];
  selectedAgent: string | null;
  onSelectAgent: (agent: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TabId>("content");
  const [expanded, setExpanded] = useState(false);
  const viewMode = useProjectsStore((s) => s.viewMode);
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
  const selected = documents.find((a) => a.agent === selectedAgent) ?? null;
  // Only a blueprint has an architecture to draw; switching stations must not strand the
  // panel on a tab that no longer exists.
  const hasDesign = selected !== null && artifactKind(selected.agent) === "blueprint";
  const showRaw = viewMode === "developer";
  const activeTab: TabId =
    (tab === "design" && !hasDesign) || (tab === "raw" && !showRaw) ? "content" : tab;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tabs: { id: TabId; label: string }[] = [
    ...(hasDesign ? [{ id: "design" as const, label: "Design" }] : []),
    { id: "content", label: "Requirements" },
    // raw JSON is debug detail, not something a PM reading for the outcome needs
    ...(showRaw ? [{ id: "raw" as const, label: "JSON" }] : []),
  ];

  return (
    <aside
      aria-label="Artifacts"
      className={cn(
        "flex min-w-0 flex-col border-l border-line-subtle bg-canvas transition-[flex-basis,width] duration-200",
        // half the screen by default - a fixed rem width left a wide viewport with a
        // narrow reading column on one side and a big idle gutter on the other, which
        // read as a layout bug rather than the comfortable-measure choice it was
        expanded ? "w-[min(64rem,70vw)] shrink-0" : "min-w-[20rem] flex-1",
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line-subtle px-3">
        <h2 className="text-2xs font-semibold tracking-wide text-fg-subtle uppercase">Artifacts</h2>
        <IconButton
          label={expanded ? "Collapse artifacts" : "Expand artifacts"}
          size="sm"
          icon={
            expanded ? (
              <ArrowsInSimpleIcon className="size-4" />
            ) : (
              <ArrowsOutSimpleIcon className="size-4" />
            )
          }
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto"
        />
        <IconButton
          label="Close artifacts"
          size="sm"
          icon={<XIcon className="size-4" />}
          onClick={onClose}
        />
      </div>

      {documents.length === 0 ? (
        <p className="p-5 text-xs leading-relaxed text-fg-subtle">
          Each station hands its work over here as it finishes — the scouting report from
          Scout, the call sheet from Coach, the grade sheet from Ref, and the run of show
          from Host.
        </p>
      ) : (
        <>
          <div className="flex gap-1 overflow-x-auto border-b border-line-subtle p-2">
            {documents.map((a) => {
              const meta = AGENT_META[a.agent];
              const active = a.agent === selectedAgent;
              return (
                <button
                  key={a.agent}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectAgent(a.agent)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-2xs font-medium transition-colors",
                    active
                      ? cn(meta?.bg, meta?.fg)
                      : "text-fg-subtle hover:bg-sunken hover:text-fg-muted",
                  )}
                >
                  {meta && <AgentFace agent={meta.face} className="size-4" />}
                  {meta?.name ?? a.agent}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-semibold text-fg">
                {str(selected.content, "title") ?? AGENT_META[selected.agent]?.output ?? selected.agent}
              </h3>
              <p className="tabular mt-0.5 text-2xs text-fg-subtle">
                {new Date(selected.created_at).toLocaleString()}
              </p>

              <div
                role="tablist"
                aria-label="Artifact view"
                className="mt-3 mb-4 flex gap-1 border-b border-line-subtle"
              >
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

              {activeTab === "design" && <DesignBody artifact={selected} />}
              {activeTab === "content" && <ContentBody artifact={selected} />}
              {activeTab === "raw" && showRaw && <GenericView content={selected.content} />}
            </div>
          )}
        </>
      )}
    </aside>
  );
}
