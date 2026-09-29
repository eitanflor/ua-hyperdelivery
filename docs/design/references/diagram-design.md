# Diagram Design

| | |
|---|---|
| Source | Gallery <https://cathrynlavery.github.io/diagram-design/> - repo <https://github.com/cathrynlavery/diagram-design> |
| Retrieved | 2026-09-28 |
| What it is | An agent skill (Claude Code, Codex, Copilot and others) that produces editorial-quality diagrams as self-contained HTML and SVG, matched to a brand. |
| License | MIT. Its icon set draws on Tabler Icons (MIT) and Simple Icons (CC0). |

## Why it is in the library

Coach produces an architecture, a data model, integration points and a dependency-ordered
list of build tasks. The console draws one of those, capped at 12 components, and hides the
rest in Simple mode. This project is the clearest statement of how a diagram should look
and, more usefully, how it should **degrade for its audience** - which is the Simple versus
Detailed problem restated for diagrams.

## The design system in one paragraph

One accent color, spent on 1-2 focal elements. Titles and callouts in a serif; node names in
Geist; technical sublabels in Geist Mono (mono is for ports, URLs and field types, not a "dev"
costume). One-pixel hairlines, **no shadows**, radius at most 10px. Every coordinate, width
and gap divisible by 4 - "it's what keeps the diagrams from feeling AI-generated". Target
density 4/10. "The highest-quality move is usually deletion. Every node earns its place."

## When not to draw

- A list of things -> a table or bullets.
- Before and after -> a table.
- One box with a label -> a sentence.
- Ask first: would a reader learn more from this than from a well-written paragraph?

## The four settings

| Setting | Values | What it controls |
|---|---|---|
| Format | html, svg, png, html+png | The deliverable |
| Size | doc-inline, doc-wide, slide 16:9 and 4:3, social, print (A4, A3, letter), fit | The viewBox and the type ramp - a projected slide gets 16px node names, not 12px |
| Detail | faithful (up to 24 nodes, zoned), balanced (up to 12), simplified (up to 7) | How much survives, through a fixed ladder: drop decorations, then duplicates, then leaf clusters, then infrastructure |
| Audience | engineer, mixed, executive | The **wording**, not the count. "Auth Service / JWT RS256 :8443" becomes "Auth Service / token check" becomes "Sign-in" |

Every import ends with a fidelity ledger: what was merged, collapsed or dropped.

## Types

Architecture, IT current-state, Flowchart, Sequence, State machine (and lifecycle), ER / data
model, Timeline, Swimlane, Quadrant, Radar, Loop / flywheel, Nested, Tree, Org chart, Layer
stack, Venn, Pyramid / funnel, Bar, Treemap, Line (slopegraph, ridgeline, streamgraph), Gantt,
Scatter (bubble, beeswarm), High-level, Process, Medallion, Data flow, Data-platform
integration, Data-platform security matrix, Sankey, Fishbone, Wardley map, Kanban, User
journey, Deployment, Dependency graph, UML class, Story map, Database schema, Polar,
Waterfall, Heatmap, Marimekko, Data lake.

## Semantic patterns

Behavior is chosen before layout. Nine routed patterns: fan-in queues and bottlenecks,
repeated stage slots, unstructured-input transformation, paired policy traces, secure paved
roads, governance catalogs, compensating security layers, traceable block decomposition, and
lifecycle phase maps. Each defines triggers, primitives, budget, anti-patterns, a static
fallback and the nearest visual type.

## Motion and accessibility

- Motion modes are `none` (default), `reveal`, `step` and `loop`. Every animated diagram has a
  complete static first frame; reduced motion shows only that frame and hides playback
  controls.
- Every SVG has `role="img"`, a resolving `aria-labelledby`, and first-child `<title>` and
  `<desc>`, with IDs prefixed per diagram so several can share a page.

## Mapping to Hyperdelivery

| Hyperdelivery content | Diagram type / pattern | Notes |
|---|---|---|
| The line itself (4 stations, 3 gates) | *Repeated stage slots* + *lifecycle phase map* | The overview canvas in [../patterns/canvas-and-diagrams.md](../patterns/canvas-and-diagrams.md) |
| Scout turning a messy brief into a structured spec | *Unstructured-input transformation* | An explainer on the landing page and in onboarding |
| Coach's components and connections | Architecture | Replaces the capped SVG diagram |
| Coach's build tasks and their dependencies | Dependency graph (fan-in, ranks, cycles) | Simple mode shows ranks as a numbered build order instead |
| Coach's data entities and fields | ER / database schema | Detailed mode only |
| Coach's integration points | Data flow / data-platform integration | Direction arrows already exist in the data |
| Ref's coverage of requirements | Heatmap / matrix | Met vs unmet per requirement |
| Ref's builds by state | Kanban | Alongside the existing build board |
| Host's demo script | Timeline / user journey | Walkthrough order with narration per requirement |
| Portfolio across projects | Swimlane or kanban by station | Detailed view of Home |

**Settings map onto modes.** The *audience* setting is our Simple / Detailed switch applied to
diagram labels. The *detail* ladder replaces today's hard cap: simplified (7) in Simple mode,
balanced (12) as the inline default, faithful (24, zoned) in the expanded view, and the
interactive canvas beyond that.

## Token mapping

| Diagram Design role | Console token |
|---|---|
| paper | `--color-canvas` |
| paper-2 (containers) | `--color-surface` |
| ink | `--color-fg` |
| muted | `--color-fg-muted` |
| hairline | `--color-line` |
| accent (focal only) | `--color-accent` (UA red) |

No serif. Titles and callouts use Geist and, for names, the stencil lockup - the console
already has its two families and does not need a third.
