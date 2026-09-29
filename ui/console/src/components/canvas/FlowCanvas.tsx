import "@xyflow/react/dist/base.css";
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import {
  Background,
  BackgroundVariant,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import { CornersOutIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from "@phosphor-icons/react";
import { cn } from "../../lib/cn";
import { IconButton } from "../ui/IconButton";
import { NODE_H, NODE_W, type BoxNode, type BoxTone } from "./flow";

const TONE: Record<BoxTone, string> = {
  default: "border-line",
  focal: "border-accent",
  danger: "border-danger",
  external: "border-dashed border-line-strong bg-canvas",
};

/** One node, drawn to Diagram Design's rules: hairline border, no shadow, radius under
 * 10px, a fixed 176x64 box so the layout grid holds. The one accent is spent on focus. */
function Box({ data, selected }: NodeProps<BoxNode>) {
  return (
    <div
      style={{ width: NODE_W, height: NODE_H }}
      className={cn(
        "flex flex-col justify-center overflow-hidden rounded-[8px] border bg-surface px-3 text-left transition-colors",
        TONE[data.tone ?? "default"],
        selected && "border-accent bg-accent-bg",
      )}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} className="opacity-0!" />
      <div className="flex items-center gap-1.5">
        {data.badge && (
          <span
            className={cn(
              "tabular shrink-0 rounded-sm px-1 text-2xs font-semibold",
              data.tone === "focal" ? "bg-accent text-fg-on-accent" : "bg-sunken text-fg-muted",
            )}
          >
            {data.badge}
          </span>
        )}
        <p title={data.label} className="line-clamp-2 text-xs leading-snug font-medium text-fg">
          {data.label}
        </p>
      </div>
      {data.mono && <p className="truncate font-mono text-2xs text-fg-subtle">{data.mono}</p>}
      {data.sub && <p className="mt-0.5 line-clamp-1 text-2xs leading-snug text-fg-muted">{data.sub}</p>}
      <Handle type="source" position={Position.Right} isConnectable={false} className="opacity-0!" />
    </div>
  );
}

const NODE_TYPES = { box: Box };

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface CanvasProps {
  nodes: BoxNode[];
  edges: Edge[];
  /** What the canvas shows, for assistive tech - the outline view is the full text path. */
  label: string;
  onSelect?: (id: string | null) => void;
  minimap?: boolean;
  className?: string;
  /** Extra toolbar controls, placed before zoom. */
  toolbar?: ReactNode;
}

function Canvas({ nodes, edges, label, onSelect, minimap = false, className, toolbar }: CanvasProps) {
  const flow = useReactFlow();
  const wrapper = useRef<HTMLDivElement>(null);
  const duration = () => (reducedMotion() ? 0 : 200);
  // reading order: left to right by rank, then top to bottom within it
  const order = [...nodes].sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y).map((n) => n.id);

  const select = (id: string | null) => {
    flow.setNodes((current) => current.map((n) => ({ ...n, selected: n.id === id })));
    onSelect?.(id);
  };

  const focus = (id: string) => {
    wrapper.current?.querySelector<HTMLElement>(`.react-flow__node[data-id="${CSS.escape(id)}"]`)?.focus();
    const node = flow.getNode(id);
    if (node) {
      void flow.setCenter(node.position.x + NODE_W / 2, node.position.y + NODE_H / 2, {
        zoom: flow.getZoom(),
        duration: duration(),
      });
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      void flow.zoomIn({ duration: duration() });
      return;
    }
    if (e.key === "-") {
      e.preventDefault();
      void flow.zoomOut({ duration: duration() });
      return;
    }
    if (e.key === "0") {
      e.preventDefault();
      void flow.fitView({ duration: duration(), padding: 0.15 });
      return;
    }
    if (e.key === "Escape") {
      select(null);
      return;
    }
    const id = (document.activeElement as HTMLElement | null)?.closest(".react-flow__node")?.getAttribute("data-id");
    if (!id) return;
    const at = order.indexOf(id);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = order[Math.min(at + 1, order.length - 1)];
      if (next) focus(next);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = order[Math.max(at - 1, 0)];
      if (prev) focus(prev);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(id);
    }
  };

  return (
    <div
      ref={wrapper}
      role="group"
      aria-label={`${label}. Arrow keys move between nodes, Enter selects, plus and minus zoom, 0 fits.`}
      onKeyDown={onKeyDown}
      className={cn("relative overscroll-contain rounded-md border border-line-subtle bg-canvas", className)}
    >
      <ReactFlow
        defaultNodes={nodes}
        defaultEdges={edges}
        nodeTypes={NODE_TYPES}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesFocusable={false}
        onNodeClick={(_, node) => select(node.id)}
        onPaneClick={() => select(null)}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={1.75}
        zoomOnDoubleClick={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--color-line-strong)" />
        {minimap && (
          <MiniMap
            pannable
            zoomable
            ariaLabel="Overview of the whole canvas"
            nodeColor="var(--color-line-strong)"
            maskColor="color-mix(in srgb, var(--color-canvas) 70%, transparent)"
            bgColor="var(--color-surface)"
            className="overflow-hidden rounded-md border border-line-subtle"
          />
        )}
      </ReactFlow>
      <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-md border border-line-subtle bg-surface p-0.5">
        {toolbar}
        <IconButton
          label="Zoom out"
          size="sm"
          icon={<MagnifyingGlassMinusIcon className="size-4" />}
          onClick={() => void flow.zoomOut({ duration: duration() })}
        />
        <IconButton
          label="Zoom in"
          size="sm"
          icon={<MagnifyingGlassPlusIcon className="size-4" />}
          onClick={() => void flow.zoomIn({ duration: duration() })}
        />
        <IconButton
          label="Fit to view"
          size="sm"
          icon={<CornersOutIcon className="size-4" />}
          onClick={() => void flow.fitView({ duration: duration(), padding: 0.15 })}
        />
      </div>
    </div>
  );
}

/** A pannable, zoomable, keyboard-navigable diagram (React Flow). Uncontrolled: remount it
 * with a new `key` when the graph itself changes. */
export function FlowCanvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
