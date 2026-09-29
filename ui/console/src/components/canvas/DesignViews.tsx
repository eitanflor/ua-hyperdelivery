import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowsOutSimpleIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import type { Edge } from "@xyflow/react";
import {
  list,
  str,
  type Component,
  type DataEntity,
  type IntegrationPoint,
  type Requirement,
  type UnitOfWork,
} from "../../api/artifacts";
import type { Artifact } from "../../api/types";
import { buildSteps, componentEdges, layoutGraph, unitGraph, type Edge as GraphEdge } from "../../lib/graphs";
import { Markdown } from "../../lib/markdown";
import { cn } from "../../lib/cn";
import { useProjectsStore, type ViewMode } from "../../store/useProjectsStore";
import { IconButton } from "../ui/IconButton";
import { FlowCanvas } from "./FlowCanvas";
import { edge, NODE_H, NODE_W, type BoxNode } from "./flow";

const NO_ARTIFACTS: Artifact[] = [];

/** The detail ladder (Diagram Design): how many components survive in each view. Past the
 * inline limit the full view shows everything on a canvas instead of a capped picture. */
const LADDER = { pm: 7, developer: 12 } as const;

function firstSentence(text: string): string {
  const plain = text.replace(/[*_`#>]/g, "").trim();
  const end = plain.search(/[.!?](\s|$)/);
  return end === -1 ? plain : plain.slice(0, end + 1);
}

/** The most connected nodes first, kept in plan order - leaves drop before hubs. */
function keepMostConnected<T extends { id: string }>(items: T[], edges: GraphEdge[], max: number): T[] {
  if (items.length <= max) return items;
  const degree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
    degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
  }
  const kept = new Set(
    [...items]
      .sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0))
      .slice(0, max)
      .map((i) => i.id),
  );
  return items.filter((i) => kept.has(i.id));
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [T, string][];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex w-fit items-center rounded-sm border border-line p-0.5">
      {options.map(([id, text]) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "rounded-[3px] px-2.5 py-1 text-2xs font-medium transition-colors",
            value === id ? "bg-sunken text-fg" : "text-fg-subtle hover:text-fg-muted",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function Legend({ items }: { items: { swatch: string; label: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-2xs text-fg-subtle">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={cn("h-3 w-5 rounded-[3px] border", item.swatch)} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------------------
// Architecture

interface ArchitectureModel {
  nodes: BoxNode[];
  edges: Edge[];
  shown: number;
  total: number;
}

/** An integration touches the components whose build tasks serve the same requirements -
 * the blueprint links integrations to requirements, not to components. */
function integrationLinks(point: IntegrationPoint, units: UnitOfWork[]): string[] {
  const served = new Set(point.requirement_ids ?? []);
  return [
    ...new Set(
      units.filter((u) => (u.requirement_ids ?? []).some((r) => served.has(r))).flatMap((u) => u.component_ids ?? []),
    ),
  ];
}

function architectureModel(content: Record<string, unknown>, viewMode: ViewMode, max: number | null): ArchitectureModel {
  const components = list<Component>(content, "components");
  const units = list<UnitOfWork>(content, "units_of_work");
  const integrations = list<IntegrationPoint>(content, "integration_points");
  const allEdges = componentEdges(components, units);
  const kept = max === null ? components : keepMostConnected(components, allEdges, max);
  const keptIds = new Set(kept.map((c) => c.id));
  const edges: GraphEdge[] = allEdges.filter((e) => keptIds.has(e.from) && keptIds.has(e.to));

  const external = integrations.map((point) => ({ point, links: integrationLinks(point, units).filter((id) => keptIds.has(id)) }));
  const extEdges: { from: string; to: string; both: boolean }[] = external.flatMap(({ point, links }) =>
    links.map((componentId) =>
      point.direction === "outbound"
        ? { from: componentId, to: point.id, both: false }
        : { from: point.id, to: componentId, both: point.direction === "bidirectional" },
    ),
  );

  const boxes = [...kept.map((c) => c.id), ...integrations.map((p) => p.id)].map((id) => ({
    id,
    width: NODE_W,
    height: NODE_H,
  }));
  const positions = layoutGraph(boxes, [...edges, ...extEdges]);
  const detailed = viewMode === "developer";

  const nodes: BoxNode[] = [
    ...kept.map<BoxNode>((c) => ({
      id: c.id,
      type: "box",
      position: positions.get(c.id) ?? { x: 0, y: 0 },
      data: {
        label: c.name,
        mono: detailed ? c.id : undefined,
        sub: detailed ? firstSentence(c.responsibility) : undefined,
      },
    })),
    ...integrations.map<BoxNode>((p) => ({
      id: p.id,
      type: "box",
      position: positions.get(p.id) ?? { x: 0, y: 0 },
      data: { label: p.system, mono: detailed ? p.direction : undefined, sub: "Outside system", tone: "external" },
    })),
  ];
  const flowEdges = [
    ...edges.map((e) => edge(e.from, e.to)),
    ...extEdges.map((e) => {
      const base = edge(e.from, e.to);
      return e.both ? { ...base, markerStart: base.markerEnd, style: { ...base.style, strokeDasharray: "4 4" } } : { ...base, style: { ...base.style, strokeDasharray: "4 4" } };
    }),
  ];
  return { nodes, edges: flowEdges, shown: kept.length, total: components.length };
}

function ComponentDetails({
  id,
  content,
  requirements,
}: {
  id: string;
  content: Record<string, unknown>;
  requirements: Map<string, string>;
}) {
  const components = list<Component>(content, "components");
  const units = list<UnitOfWork>(content, "units_of_work");
  const integrations = list<IntegrationPoint>(content, "integration_points");
  const component = components.find((c) => c.id === id);
  const point = integrations.find((p) => p.id === id);
  if (point) {
    return (
      <div className="rounded-md border border-line-subtle bg-surface p-3">
        <p className="text-2xs font-semibold tracking-wide text-fg-subtle uppercase">Outside system · {point.direction}</p>
        <h4 className="mt-0.5 text-sm font-semibold text-fg">{point.system}</h4>
        <div className="mt-1 text-xs leading-relaxed text-fg-muted">
          <Markdown text={point.description} />
        </div>
      </div>
    );
  }
  if (!component) return null;
  const builtBy = units.filter((u) => (u.component_ids ?? []).includes(id));
  const serves = [...new Set(builtBy.flatMap((u) => u.requirement_ids ?? []))];
  const talksTo = integrations.filter((p) => integrationLinks(p, units).includes(id));
  return (
    <div className="rounded-md border border-line-subtle bg-surface p-3">
      <p className="text-2xs font-semibold tracking-wide text-fg-subtle uppercase">Component</p>
      <h4 className="mt-0.5 text-sm font-semibold text-fg">{component.name}</h4>
      <div className="mt-1 text-xs leading-relaxed text-fg-muted">
        <Markdown text={component.responsibility} />
      </div>
      {serves.length > 0 && (
        <div className="mt-2.5">
          <p className="text-2xs font-medium text-fg-subtle">Serves</p>
          <ul className="mt-1 flex flex-col gap-1">
            {serves.map((rid) => (
              <li key={rid} className="flex gap-2 text-xs text-fg">
                <code className="tabular shrink-0 font-mono text-2xs text-fg-subtle">{rid}</code>
                <span className="text-fg-muted">{requirements.get(rid) ?? ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {builtBy.length > 0 && (
        <div className="mt-2.5">
          <p className="text-2xs font-medium text-fg-subtle">Built in</p>
          <ul className="mt-1 flex flex-col gap-0.5 text-xs text-fg-muted">
            {builtBy.map((u) => (
              <li key={u.id}>{u.title}</li>
            ))}
          </ul>
        </div>
      )}
      {talksTo.length > 0 && (
        <p className="mt-2.5 text-xs text-fg-muted">
          <span className="text-2xs font-medium text-fg-subtle">Talks to </span>
          {talksTo.map((p) => p.system).join(", ")}
        </p>
      )}
    </div>
  );
}

function ArchitectureOutline({ content }: { content: Record<string, unknown> }) {
  const components = list<Component>(content, "components");
  const units = list<UnitOfWork>(content, "units_of_work");
  const edges = componentEdges(components, units);
  const name = new Map(components.map((c) => [c.id, c.name]));
  return (
    <ul className="flex flex-col divide-y divide-line-subtle rounded-md border border-line-subtle bg-surface">
      {components.map((c) => {
        const needs = edges.filter((e) => e.to === c.id).map((e) => name.get(e.from) ?? e.from);
        const usedBy = edges.filter((e) => e.from === c.id).map((e) => name.get(e.to) ?? e.to);
        return (
          <li key={c.id} className="px-3 py-2.5">
            <p className="text-sm font-medium text-fg">{c.name}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{firstSentence(c.responsibility)}</p>
            {(needs.length > 0 || usedBy.length > 0) && (
              <p className="mt-1 text-2xs text-fg-subtle">
                {needs.length > 0 && <>Needs {needs.join(", ")}. </>}
                {usedBy.length > 0 && <>Used by {usedBy.join(", ")}.</>}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ArchitectureView({
  content,
  viewMode,
  requirements,
  title,
}: {
  content: Record<string, unknown>;
  viewMode: ViewMode;
  requirements: Map<string, string>;
  title: string;
}) {
  const [mode, setMode] = useState<"canvas" | "outline">("canvas");
  const [selected, setSelected] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const details = useRef<HTMLDivElement>(null);
  // the details land under the canvas, usually below the fold of the panel
  useEffect(() => {
    if (selected && !full) details.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected, full]);
  const inline = architectureModel(content, viewMode, LADDER[viewMode]);
  const complete = architectureModel(content, viewMode, null);
  const integrations = list<IntegrationPoint>(content, "integration_points");

  if (inline.total === 0) {
    return (
      <p className="text-sm leading-relaxed text-fg-muted">
        This plan names no components yet, so there is no architecture to draw. Gate 2 reports
        that as a gap.
      </p>
    );
  }

  const legend = [
    { swatch: "border-line bg-surface", label: "Component" },
    ...(integrations.length > 0 ? [{ swatch: "border-dashed border-line-strong bg-canvas", label: "Outside system" }] : []),
  ];
  const openFull = (
    <IconButton
      label="Open the full view"
      size="sm"
      icon={<ArrowsOutSimpleIcon className="size-4" />}
      onClick={() => setFull(true)}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Show the architecture as"
          options={[
            ["canvas", "Diagram"],
            ["outline", "Outline"],
          ]}
          value={mode}
          onChange={setMode}
        />
        <Legend items={legend} />
      </div>

      {mode === "outline" ? (
        <ArchitectureOutline content={content} />
      ) : (
        <>
          <FlowCanvas
            key={`inline-${viewMode}`}
            nodes={inline.nodes}
            edges={inline.edges}
            label={`Architecture: ${inline.shown} components`}
            onSelect={setSelected}
            className="h-80"
            toolbar={openFull}
          />
          {inline.shown < inline.total && (
            <p className="text-2xs text-fg-subtle">
              Showing the {inline.shown} most connected of {inline.total} components.{" "}
              <button type="button" onClick={() => setFull(true)} className="text-accent-text hover:underline">
                Open the full view
              </button>{" "}
              for all of them.
            </p>
          )}
          {selected ? (
            <div ref={details} className="scroll-mt-4">
              <ComponentDetails id={selected} content={content} requirements={requirements} />
            </div>
          ) : (
            <p className="text-2xs text-fg-subtle">Select a component to see what it does and which requirements it serves.</p>
          )}
        </>
      )}

      <Dialog.Root open={full} onOpenChange={setFull}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 animate-fade bg-fg/25" />
          <Dialog.Content className="fixed inset-4 z-50 flex animate-pop flex-col overflow-hidden rounded-md border border-line bg-overlay shadow-overlay">
            <div className="flex shrink-0 items-center gap-3 border-b border-line-subtle px-4 py-3">
              <Dialog.Title className="text-sm font-semibold text-fg">{title} · Architecture</Dialog.Title>
              <Dialog.Description className="text-2xs text-fg-subtle">
                {complete.total} components{integrations.length > 0 ? `, ${integrations.length} outside systems` : ""}
              </Dialog.Description>
              <Dialog.Close asChild>
                <IconButton label="Close" size="sm" icon={<XIcon className="size-4" />} className="ml-auto" />
              </Dialog.Close>
            </div>
            <div className="flex min-h-0 flex-1 gap-4 p-4">
              <FlowCanvas
                key={`full-${viewMode}`}
                nodes={complete.nodes}
                edges={complete.edges}
                label={`Architecture: all ${complete.total} components`}
                onSelect={setSelected}
                minimap
                className="h-full min-w-0 flex-1"
              />
              <aside aria-label="Selected component" className="hidden w-80 shrink-0 overflow-y-auto lg:block">
                {selected ? (
                  <ComponentDetails id={selected} content={content} requirements={requirements} />
                ) : (
                  <p className="text-xs text-fg-subtle">Select a component to see its details.</p>
                )}
              </aside>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

// ---------------------------------------------------------------------------------------
// Build order

function BuildSteps({ units, requirements }: { units: UnitOfWork[]; requirements: Map<string, string> }) {
  const steps = buildSteps(units);
  const { cycles } = unitGraph(units);
  return (
    <ol className="flex gap-3 overflow-x-auto pb-2">
      {steps.map(({ step, units: members }) => {
        const looped = members.some((u) => cycles.has(u.id));
        return (
          <li key={step} className="flex w-56 shrink-0 flex-col gap-2">
            <div>
              <p className="stencil text-xs text-fg">{looped ? "Needs untangling" : `Step ${step}`}</p>
              <p className="text-2xs text-fg-subtle">
                {looped
                  ? "These depend on each other in a loop"
                  : step === 1
                    ? `${members.length} can start now`
                    : `${members.length} after step ${step - 1}`}
              </p>
            </div>
            {members.map((u) => (
              <div
                key={u.id}
                className={cn(
                  "rounded-md border bg-surface px-3 py-2",
                  looped ? "border-danger/40" : "border-line-subtle",
                )}
              >
                <p className="text-xs font-medium text-fg">{u.title}</p>
                {(u.requirement_ids ?? []).length > 0 && (
                  <p
                    className="mt-1 text-2xs text-fg-subtle"
                    title={(u.requirement_ids ?? []).map((r) => `${r}: ${requirements.get(r) ?? ""}`).join("\n")}
                  >
                    Delivers {(u.requirement_ids ?? []).join(", ")}
                  </p>
                )}
              </div>
            ))}
          </li>
        );
      })}
    </ol>
  );
}

function BuildGraph({ units }: { units: UnitOfWork[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const graph = unitGraph(units);
  const positions = layoutGraph(
    units.map((u) => ({ id: u.id, width: NODE_W, height: NODE_H })),
    graph.edges.filter((e) => !(graph.cycles.has(e.from) && graph.cycles.has(e.to))),
  );
  const nodes: BoxNode[] = units.map((u) => ({
    id: u.id,
    type: "box",
    position: positions.get(u.id) ?? { x: 0, y: 0 },
    data: {
      label: u.title,
      mono: u.id,
      badge: graph.cycles.has(u.id) ? "loop" : String((graph.rank.get(u.id) ?? 0) + 1),
      tone: graph.cycles.has(u.id) ? "danger" : graph.critical.has(u.id) ? "focal" : "default",
    },
  }));
  const edges = graph.edges.map((e) =>
    edge(
      e.from,
      e.to,
      graph.cycles.has(e.from) && graph.cycles.has(e.to)
        ? "danger"
        : graph.criticalEdges.has(`${e.from}->${e.to}`)
          ? "focal"
          : "none",
    ),
  );
  const unit = units.find((u) => u.id === selected);

  return (
    <div className="flex flex-col gap-3">
      <Legend
        items={[
          { swatch: "border-line bg-surface", label: "Build task (number = step)" },
          ...(graph.critical.size > 0 ? [{ swatch: "border-accent bg-surface", label: "Critical path - sets how long the build takes" }] : []),
          ...(graph.cycles.size > 0 ? [{ swatch: "border-danger bg-surface", label: "Loop - no valid order" }] : []),
        ]}
      />
      {graph.cycles.size > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-danger">
          <WarningIcon weight="fill" className="size-3.5" />
          {graph.cycles.size} tasks depend on each other in a loop, so they cannot be ordered. Gate 2 should send this back.
        </p>
      )}
      <FlowCanvas
        key="build-graph"
        nodes={nodes}
        edges={edges}
        label={`Build order: ${units.length} tasks`}
        onSelect={setSelected}
        className="h-80"
      />
      {unit && (
        <div className="rounded-md border border-line-subtle bg-surface p-3">
          <p className="font-mono text-2xs text-fg-subtle">{unit.id}</p>
          <h4 className="text-sm font-semibold text-fg">{unit.title}</h4>
          <div className="mt-1 text-xs leading-relaxed text-fg-muted">
            <Markdown text={unit.description} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------
// Data model

/** Entities as cards, not a graph: the plan names no relationships between them, and a
 * diagram of unconnected boxes teaches less than a well-set list. */
function DataModel({ content }: { content: Record<string, unknown> }) {
  const entities = list<DataEntity>(content, "data_entities");
  const componentName = new Map(list<Component>(content, "components").map((c) => [c.id, c.name]));
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {entities.map((entity) => (
        <section key={entity.id} aria-label={entity.name} className="rounded-md border border-line-subtle bg-surface">
          <header className="border-b border-line-subtle px-3 py-2">
            <h4 className="text-xs font-semibold text-fg">{entity.name}</h4>
            <p className="text-2xs text-fg-subtle">{componentName.get(entity.component_id) ?? entity.component_id}</p>
          </header>
          <table className="w-full text-left text-2xs">
            <caption className="sr-only">Fields of {entity.name}</caption>
            <tbody className="divide-y divide-line-subtle">
              {(entity.fields ?? []).map((field) => (
                <tr key={field.name}>
                  <th scope="row" className="px-3 py-1.5 font-mono font-normal text-fg">{field.name}</th>
                  <td className="px-2 py-1.5 font-mono text-fg-subtle">{field.type}</td>
                  <td className="px-3 py-1.5 text-fg-muted">{field.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------------------

type View = "architecture" | "build" | "data";

/** The Design tab of a build plan: the architecture, the build order and the data model -
 * explorable canvases in place of a capped picture (docs/design/patterns/canvas-and-diagrams.md).
 * Loaded on demand, so the canvas library costs nothing until someone opens it. */
export default function DesignViews({
  projectId,
  artifact,
  viewMode,
}: {
  projectId: string;
  artifact: Artifact;
  viewMode: ViewMode;
}) {
  const artifacts = useProjectsStore((s) => s.artifactsByProject[projectId] ?? NO_ARTIFACTS);
  const spec = artifacts.find((a) => a.agent === "distill")?.content ?? {};
  const requirements = new Map(list<Requirement>(spec, "requirements").map((r) => [r.id, r.description]));
  const units = list<UnitOfWork>(artifact.content, "units_of_work");
  const hasData = viewMode === "developer" && list<DataEntity>(artifact.content, "data_entities").length > 0;
  // in the URL, like the panel and section: switching tabs and back, or sharing the link,
  // lands on the same view
  const [params, setParams] = useSearchParams();
  const view = (params.get("design") ?? "architecture") as View;
  const setView = (next: View) =>
    setParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        if (next === "architecture") out.delete("design");
        else out.set("design", next);
        return out;
      },
      { replace: true },
    );
  const active: View =
    (view === "data" && !hasData) || (view === "build" && units.length === 0) || !["architecture", "build", "data"].includes(view)
      ? "architecture"
      : view;
  const title = str(artifact.content, "title") ?? "Build plan";

  return (
    <div className="flex flex-col gap-4">
      <Segmented<View>
        label="Design view"
        options={[
          ["architecture", "Architecture"],
          ...(units.length > 0 ? ([["build", "Build order"]] as [View, string][]) : []),
          ...(hasData ? ([["data", "Data model"]] as [View, string][]) : []),
        ]}
        value={active}
        onChange={setView}
      />
      {active === "architecture" && (
        <ArchitectureView content={artifact.content} viewMode={viewMode} requirements={requirements} title={title} />
      )}
      {active === "build" &&
        (viewMode === "pm" ? <BuildSteps units={units} requirements={requirements} /> : <BuildGraph units={units} />)}
      {active === "data" && <DataModel content={artifact.content} />}
    </div>
  );
}
