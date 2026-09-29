# Pattern: canvas, agent maps and diagrams

Where the line, a project's architecture and its build order are drawn. The goal is a
canvas a PM can read at a glance and an engineer can dig into, using one visual language.

## What exists

- **The line indicator** in the top bar: eight stations as a compact stepper with a spring
  cursor and tooltips ([LineIndicator.tsx](../../../ui/console/src/components/shell/LineIndicator.tsx)).
  Good orientation; too small to explain anything.
- **Canvases** (Phase 5): a build plan's Design tab renders the architecture, build order
  and data model with React Flow and dagre, loaded on demand
  ([DesignViews.tsx](../../../ui/console/src/components/canvas/DesignViews.tsx),
  [FlowCanvas.tsx](../../../ui/console/src/components/canvas/FlowCanvas.tsx),
  [graphs.ts](../../../ui/console/src/lib/graphs.ts)). The detail ladder replaced the old
  12-component cap, and every canvas has an outline view.
- **Traceability** is a Trace tab in the side panel, and Portfolio has a board view.
- Not yet: the line map, and SVG/PNG export of a canvas.

Before Phase 5 the architecture was a hand-laid-out SVG capped at 12 components, with no
pan, zoom, minimap or build-order view, and Simple mode hid most of the plan.

## Principles, from Diagram Design

See [../references/diagram-design.md](../references/diagram-design.md). Applied here:

- One accent (UA red), spent on the 1-2 focal nodes: the current station, the thing that needs
  you, the critical path.
- Hairlines, no shadows on diagram nodes, radius at most 10px, a 4px grid for every
  coordinate.
- A legend whenever color or line style carries meaning.
- Target density 4/10. Delete before adding.
- **Detail ladder instead of a cap:** simplified (up to 7 nodes) in Simple mode, balanced (up
  to 12) inline, faithful (up to 24, zoned) in the expanded view, the interactive canvas beyond.
- **Audience setting:** Simple mode rewrites node labels in plain words; Detailed mode shows
  technical sublabels in Geist Mono.
- If a table would teach more, show the table.

## The canvases

### 1. Line map (project overview)

The whole project on one surface: four stations and three gates as nodes, the current one
focal. Each station shows a small stack of its artifacts (a layer lift on hover reveals the
sections). Each gate shows its state: waiting (hazard), signed (ticket stub with signer), or
not yet reached. Click a station to jump to its chapter in the thread; click an artifact to
open it.

- **Simple mode:** the isometric version - a factory-floor line with the crew at their
  stations ([../asset-briefs.md](../asset-briefs.md), brief A1). Illustration, not interaction
  beyond click targets.
- **Detailed mode:** flat nodes with run times, token totals and version numbers.

### 2. Architecture (Coach)

Components as nodes, grouped into zones (interface, services, data, external systems),
dependencies and data flows as edges.

- Pan (drag or trackpad), zoom (pinch, Cmd +/-), fit to view, minimap.
- Selecting a node opens a side panel: responsibility, requirements it serves, build tasks
  that touch it, integrations.
- Integration points render as external nodes with direction arrows (inbound, outbound, both).
- Export SVG and PNG, named from context: *Line plan tool - Architecture.svg*
  (`interactivity-25`).

### 3. Build order (Coach)

Build tasks and their dependencies.

- **Simple mode:** a numbered build order in ranked columns ("Step 1 - 3 tasks can start
  now"), not a graph. Each task shows its plain title and the requirements it delivers.
- **Detailed mode:** the dependency graph with ranks, fan-in, the critical path in accent, and
  cycles flagged.

### 4. Data model (Coach, Detailed only)

Entities and fields as an ER view. The data is already in the blueprint.

### 5. Traceability (Analyst)

Requirement to build task to finding to talk-track line, as linked columns. Unmet
requirements are focal. This answers the analyst's core question - "is everything we asked for
actually covered?" - without reading four documents.

### 6. Portfolio board

Every project as a card in a swimlane per station; gate columns show who owns the decision
once approver assignment exists. A split-flap "stadium board" treatment is a Phase 6 option
for Home.

## Interaction and accessibility

- Dotted grid background (React Bits Dot Grid or plain CSS), never animated.
- Keyboard: Tab into the canvas, arrow keys move between nodes in reading order, Enter
  selects, Escape clears, `+`/`-` zoom, `0` fits. Focus ring on nodes uses the global
  treatment.
- `overscroll-behavior: contain` so a scroll inside the canvas never scrolls the page
  (`interactivity-15`); horizontal swipes never trigger browser back (`interactivity-14`).
- Every canvas has an **outline view**: the same nodes and edges as a nested list or table.
  It is the screen-reader path and the print path.
- Reduced motion: no animated edges, no fly-to; jumps are instant.
- Performance: canvases are lazy-loaded route chunks; layout runs in a web worker for graphs
  over ~50 nodes.

## Libraries

| Library | Role | License | Note |
|---|---|---|---|
| `@xyflow/react` (React Flow) | Pan, zoom, selection, minimap, custom node components | MIT | Nodes are ordinary React components, so our tokens and primitives apply |
| `elkjs` | Layered layout with ports and zones | EPL-2.0 | Check EPL compatibility before adoption; the alternative below avoids the question |
| `dagre` | Simpler layered layout | MIT | Enough for the build order and small architectures |

Adopted in Phase 5: `@xyflow/react` and `@dagrejs/dagre` (see docs/decisions.md, which also
records why ELK was not needed and why the static SVG diagram was retired rather than kept).
