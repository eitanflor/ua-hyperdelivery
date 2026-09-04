import type {
  ApiContract,
  Component,
  DataEntity,
  IntegrationPoint,
  UnitOfWork,
} from "../../api/artifacts";
import {
  buildGraph,
  MAX_DIAGRAM_NODES,
  NODE_H,
  NODE_W,
  PAD,
  type DiagramNode,
} from "../../lib/architectureGraph";

const DIRECTION_ARROW = { inbound: "→", outbound: "←", bidirectional: "↔" } as const;

function Node({ node }: { node: DiagramNode }) {
  return (
    <g>
      <rect
        x={node.x}
        y={node.y}
        width={NODE_W}
        height={NODE_H}
        rx={3}
        className="fill-surface stroke-line-subtle"
        strokeWidth={1}
      />
      <text x={node.x + 10} y={node.y + 19} className="fill-fg text-[11px] font-medium">
        {node.label.length > 18 ? `${node.label.slice(0, 17)}…` : node.label}
      </text>
      {node.sub && (
        <text x={node.x + 10} y={node.y + 33} className="fill-fg-subtle text-[9px]">
          {node.sub.length > 22 ? `${node.sub.slice(0, 21)}…` : node.sub}
        </text>
      )}
    </g>
  );
}

/** The blueprint's own component graph, drawn from the stored artifact rather than
 * described by the model - so it cannot show a shape the plan does not actually have. */
export function ArchitectureDiagram({
  components,
  units,
  integrations,
  entities,
  contracts,
}: {
  components: Component[];
  units: UnitOfWork[];
  integrations: IntegrationPoint[];
  entities: DataEntity[];
  contracts: ApiContract[];
}) {
  if (components.length === 0) {
    return (
      <p className="text-xs leading-relaxed text-fg-subtle">
        This blueprint names no components yet, so there is no architecture to draw — the
        G2 gate reports that as a gap.
      </p>
    );
  }
  if (components.length > MAX_DIAGRAM_NODES) {
    return (
      <p className="text-xs leading-relaxed text-fg-subtle">
        {components.length} components is past the point where a diagram helps — the
        Requirements tab lists them with their responsibilities.
      </p>
    );
  }

  const { nodes, edges } = buildGraph(components, units);
  const position = new Map(nodes.map((n) => [n.id, n]));
  const width = Math.max(...nodes.map((n) => n.x + NODE_W)) + PAD;
  const height = Math.max(...nodes.map((n) => n.y + NODE_H)) + PAD;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-sm border border-line-subtle bg-sunken p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label={`Architecture: ${components.length} components, ${edges.length} dependencies`}
        >
          <defs>
            <marker
              id="architecture-arrow"
              viewBox="0 0 8 8"
              refX={7}
              refY={4}
              markerWidth={6}
              markerHeight={6}
              orient="auto-start-reverse"
            >
              <path d="M0,1 L7,4 L0,7 z" className="fill-fg-subtle" />
            </marker>
          </defs>
          {edges.map((edge) => {
            const from = position.get(edge.from);
            const to = position.get(edge.to);
            if (!from || !to) return null;
            const x1 = from.x + NODE_W;
            const y1 = from.y + NODE_H / 2;
            const x2 = to.x;
            const y2 = to.y + NODE_H / 2;
            const mid = (x1 + x2) / 2;
            return (
              <path
                key={`${edge.from}->${edge.to}`}
                d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`}
                className="fill-none stroke-line-subtle"
                strokeWidth={1}
                markerEnd="url(#architecture-arrow)"
              />
            );
          })}
          {nodes.map((node) => (
            <Node key={node.id} node={node} />
          ))}
        </svg>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        {(
          [
            ["Integrations", integrations.length],
            ["Data entities", entities.length],
            ["Endpoints", contracts.length],
          ] as const
        ).map(([label, count]) => (
          <div key={label} className="rounded-sm border border-line-subtle bg-surface px-2.5 py-2">
            <dt className="text-2xs text-fg-subtle">{label}</dt>
            <dd className="tabular mt-0.5 text-sm font-semibold text-fg">{count}</dd>
          </div>
        ))}
      </dl>

      {integrations.length > 0 && (
        <ul className="flex flex-col gap-1">
          {integrations.map((point) => (
            <li key={point.id} className="flex items-baseline gap-1.5 text-2xs">
              <span className="font-mono text-fg-subtle">{DIRECTION_ARROW[point.direction]}</span>
              <span className="font-medium text-fg">{point.system}</span>
              <span className="text-fg-subtle">{point.description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
