<!-- Point-in-time research, retrieved 2026-10-25 for the UA-DLC plan. Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words Bryntum DHTMLX Excalidraw Graphviz Planby SVAR SVAR's Sparklines Supabase TTFT autoplay beautifului borderless diceui fxtwitter interactjs libavoid lobehub oklch paywalled pinnable shadcnblocks tablecn tldraw waitee waitee's wireframes -->

# Tool chips, the trace, tables, timelines and diagrams for HyperDelivery

> The dark-theme variants described here are out of scope since 2026-10-26: HyperDelivery is light theme only for now.

Key: `chips-tables-diagrams`. Researched 2026-10-25. This builds on [ux-direction.md](../ux-direction.md) (tokens, "red means you", danger is never a fill, transforms and opacity only), [platform-architecture.md section 8](../platform-architecture.md) (three layers, one trace per station turn, metadata-only data spans), [research/agent-traces-observability.md](agent-traces-observability.md) (AgentPrism, OTel contract) and [docs/design/patterns/canvas-and-diagrams.md](../../design/patterns/canvas-and-diagrams.md) (xyflow plus dagre, detail ladder, outline view). It does not repeat them.

**Access notes.** The Beautiful UI page and its embedded component source were read directly (HTML, CSS and the "View code" payload). The reference trace was studied frame by frame from the post's 21.6s video, extracted locally. The Kobra component page was used live, but its source is paywalled and obfuscated, so nothing here comes from Kobra's code. diceui.com returned Cloudflare error 526 all day, so Dice UI facts come from its GitHub repo (docs and changelog files). I could not confirm Microsoft's terms for showing product icons inside an app UI (as opposed to diagrams and docs).

## 1. Beautiful UI tool chips: exact anatomy

Source: [beautifului.dev #05 Tool Chips](https://www.beautifului.dev/#tool-chips), MIT. The component is called "an agent run as compact rows: tool calls with inline chips, then file-diff chips summarizing the edits".

**Tokens it uses** (from the site's stylesheet). Font Inter, plus a mono face. Radii: chip 6px, control 8px, card 10px, window 14px. Ease `cubic-bezier(.23,1,.32,1)`. Light theme: `ink` oklch(24.7%), `ink-2` oklch(50.6%), `ink-3` oklch(69.5%), `field` oklch(96.1%), `line` oklch(94.6%), `line-strong` oklch(91.2%), `hover-2` oklch(93.3%). Borders are never CSS borders: `shadow-hairline` is `0 0 0 1px var(--line)` and `shadow-btn` is a 1px `line-strong` ring plus `0 0 4px #0000000a`. Dark theme swaps to `surface` oklch(26%), `field` oklch(29.3%), `ink-2` oklch(73.1%), and `shadow-btn` becomes a 10% white ring plus `0 1px 2px` black at 30%.

**Run header.** A button reading "4 tool calls, 2 messages": 12.5px, `ink-2`, tabular figures, 6px gap, 4px by 6px padding, 8px radius. A 12px chevron (stroke 2.2) rotates from -90° to 0° over 200ms. Hover fills `hover-2`. The body opens and closes by animating `grid-template-rows` 0fr to 1fr plus opacity over 300ms.

**Tool row** (one per call, 4px apart). A 28px-high button with 8px radius, 8px gap and 3px side padding that bleeds into the margin, so the hover pill extends past the text column without shifting it.
- **Icon slot:** 16px, `ink-3`. The glyph is 13px: a filled sparkle for Thinking, stroked (2px) pen, terminal and file glyphs for Write, Run and Read. **There are no brand logos in the tool chips.** On row hover the glyph fades out in 100ms and a 12px chevron fades in over 150ms; the chevron points down when the row is open.
- **Label:** a verb phrase ("Write 204 lines", "Rebuild and verify", "Read image") at 12.5px, weight 500, `ink`, never truncated.
- **Chip:** the object of the verb. 22px high, fills the remaining width and truncates, 6px radius, `field` background, hairline ring, 6px side padding, 11.5px `ink-2`. Mono when the object is an identifier (`ChurnSchedule.tsx`, `npm run freeze`, `flavor-chart.png`), sans when it is prose ("Planning the churn schedule…"). Hover darkens to `hover-2`.
- **Detail when expanded:** indented 8px, a 1px `line` rule on the left, 14px padding, 11.5px lines at 1.6 leading, truncated. Additions are green; build output is plain `ink-2`.
- **Entrance:** in the demo each row arrives 700ms after the last with a 300ms fade-up, a replay of the run.

**File-diff chips** (footer). Separated by a 1px `line` rule with 10px above and below; chips wrap with 6px gaps. Each chip is 28px high, 6px radius, `surface` background, `shadow-btn` ring, 8px padding, mono 11.5px `ink`, then `+13` in green and `−41` in red, tabular. They pop in over 250ms, 80ms apart. Hover or focus opens a 288px diff preview in a portal (10px radius, overlay shadow, 11px mono lines on green or red tints). "+2 more" is a borderless `ink-3` text button that underlines on hover.

**Where status and logos live instead.**
- **Task Rows (#06)** carries status. Running is a 24px ring with a 28% arc spinning every 1.1s and the step number inside. Done is a filled green disc with a check plus a "Completed" pill. Failed is a filled red disc with an X plus a "Failed" pill holding a spinning retry glyph, which then resolves to Completed.
- **Real logos** appear in the **Prompt Bar (#08)** `@` menu: full-color inline SVG marks (Figma 11x16, Slack 15x15, Gmail 15x12) set bare in a 22px slot with no tile, beside stroked glyphs for internal sources. **Streaming Text (#03)** uses 12px source favicons with a 3px radius inside an 18px inline chip.

**What HyperDelivery should keep, change and add**
- **Keep:** verb label plus object chip, hover-to-chevron, the hairline-ring borders, tabular counts, the collapsed run header, and diff chips.
- **Change, because of our rules:**
  - The grid-rows height animation becomes a snap plus an opacity and 4px-translate fade ("transforms and opacity only").
  - The filled red and green status discs become a text status with a small glyph ("status is text with a small glyph, never a filled colored chip"; danger is never a fill).
  - Diff deletions must not be red. Use `muted` with the minus sign, and a strike in the preview.
- **Add:** the logo, and status on the row itself.

## 2. HyperDelivery tool chip and model chip spec

One `ToolChip` row replaces today's `ToolTile` glyph (`ui/console/src/components/thread/ToolTile.tsx`, which maps a wire name to six Phosphor kinds).

| Part | Spec |
|---|---|
| Logo tile | 16px slot in Layer 1 rows, 20px tile in Layer 3 rows. Radius 4-5px, `surface` fill with a 1px `line` ring in light theme, `#1b1b1b` with a 10% white ring in dark. Mark at 12px (16px in the 20px tile). Multi-color marks keep their colors and are never recolored. Mono marks use `currentColor` (`ink`). Fallback: the existing Phosphor kind glyph in `ink-3`. On hover the slot swaps to the chevron, as in Beautiful UI |
| Label | Layer 1: outcome words, "Checked 3 Confluence pages", "Read the Jira ticket". Layer 3: action plus system in `muted`, "Search pages · Confluence", then the wire name in the popover |
| Object chip | 22px, 6px radius, `surface-2`/field fill, hairline ring, 11.5px. Mono for identifiers (Jira key, page title, query id, file). **Data-bearing steps show metadata only:** "query 01b2… · 50 rows · 12 MB scanned", never values |
| Status (right edge) | Running: a 12px spinner plus a live elapsed time in tabular figures; the label gets a slow shimmer that stops under reduced motion. Done: the duration ("2.4s"). Failed: a `danger` outline X plus the word "Failed", with the reason as the first detail line and a "Retry from this step" action where allowed. Interrupted (`ToolStatus.INTERRUPTED`): "Stopped" in `muted`. Writing tool awaiting authority: "Waiting for Dana" in `muted`, and the solid red decision notch with a label **only when the viewer is the one being waited on** |
| States | Hover `hover` fill. Focus: the global ink ring with a 2px offset. Expanded: chevron down, detail rule. Queued: label in `muted`, no time. Collapsed group: "4 lookups, 1 change" (Layer 1 wording) with logo stack (max 3, then "+2") |
| Model chip | Layer 3 and the audit trail only (principle "One voice"). Provider mark plus model name in `muted`: "Orchestrator · Claude Sonnet 5.5"; "via Amazon Bedrock" in the tooltip. Cortex Code shows the Snowflake mark; the coding agent shows the GitHub Copilot mark |

**Logo sources and license hygiene.** Use one `brands.ts` registry with the source and terms recorded per mark.
- **Models and providers:** [lobe-icons](https://github.com/lobehub/lobe-icons) (MIT code). It has `claude`, `anthropic`, `bedrock`, `aws`, `nova`, `snowflake`, `githubcopilot` and `microsoft` in mono and color variants (checked in `@lobehub/icons-static-svg` 1.100.0).
- **Developer tools:** [Simple Icons](https://github.com/simple-icons/simple-icons) (CC0 code). It has Snowflake, Jira, Confluence, Atlassian, GitHub, GitHub Copilot, Claude, Notion, Figma and Supabase. It **no longer carries Microsoft, AWS, Slack or OpenAI marks**.
- **AWS services:** the official [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/), which customers may use to create architecture diagrams; the package is dated 31 Jul 2026.
- **Microsoft 365:** Microsoft's [icon set](https://learn.microsoft.com/en-us/microsoft-365/solutions/architecture-icons-templates) is permitted "in architectural diagrams, training materials, or documentation". In-app chip use of Teams, OneDrive and SharePoint marks is not covered there, so **add it to the Brand review** the plan already requires.
- **Code licenses are not trademark licenses.** Never ship a mark into generated prototypes without the vendor's terms.
- **Existing support:** AgentPrism already renders a span's `metadata.brand.type` as a logo avatar (`SpanCard/getSpanBrandAvatar.tsx`), so the registry key can ride on the span.

## 3. The reference trace, and how Layer 3 and Layer 2 adopt it

The sources are [Harsh Singh's post](https://x.com/haaarshsingh/status/2113295780450587049) (22 Oct 2026, about 53k views; read via fxtwitter) and the live [Kobra Trace Waterfall](https://kobra.systems/components/trace-waterfall). The latter costs $19 or comes with Kobra Pro, takes `spans: TraceSpan[]` and `now`, and is built on Base UI Popover. The prior research note covers the attribution dispute with affectUI. **Build our own on AgentPrism's data model; take the grammar, not anyone's code.**

**What the reference does, frame by frame**
- **Summary strip:** six equal cells (Duration, Cost, Tokens, LLM calls, Tool calls, Errors) with label over value. They reflow to two columns when narrow.
- **Steps tree:**
  - Agent rows: a chevron, the model's logo in a near-black rounded tile, the agent name in bold and the model in gray ("Writer Sonnet 5.5", "Coder GPT-6 Astra" with the OpenAI mark).
  - Tool rows: the tool's logo (Notion, Figma, Google Drive, Slack, GitHub, Stripe, Supabase, Sentry, Vercel, Cloudflare, Gmail, X, a globe for web, a magnifier for `web_search`), the action in white and the system in gray.
  - **Agent rows stay pinned** while their children scroll beneath them, and 1px tree guides show nesting.
  - The span column is resizable.
- **Time axis:** ticks at round intervals that rescale as the run grows (0-10s, then 0-45s, then 0-80s). Pinch or scroll zooms. A horizontal scrollbar appears when zoomed. A hover scrubber line follows the pointer, and a live "now" cursor with a dot marks the head of the run.
- **Bars, colored per agent:** Orchestrator gray, Researcher blue, Writer purple, Coder orange, Launcher green. **Model calls are the bright tint and tool calls the darker shade** of the same hue. The agent row shows a composite strip of its children.
- **Waiting:** hatched, outlined segments on the parent while children work.
- **Handoffs:** an elbow connector drops from the parent's row to the child's first bar, drawn in the child's color.
- **Failed:** a filled red bar with a white X; the label turns red with a warning triangle.
- **Retry:** the next attempt in the agent's color with a circular-arrow glyph.
- **In progress:** a spinner before the label, the label dimmed, and a bar with a gradient head.
- **"Slowest":** an amber pill on the slowest step.
- **Per row:** "17s · $0.15" sits right of the bar.
- **Footer:** play/pause, restart, a speed select (0.5x-4x), and a legend (Model call, Tool call, Waiting, Handoff, Failed).
- **Click a bar:** a popover shows logo, name and a status pill, then Duration, Started (+9.4s), Cost, Tokens in and out, an error box ("Rate limited: two agents hit the model's 40k tokens a minute at once") and the Input.
- **One flaw:** in the live demo every row exposes a hidden image named "<step> failed" to screen readers. Do not copy it.

**Layer 3 (engineers and admins): adopt almost all of it, with these changes**
1. **Summary strip:** Duration, Cost, Tokens, Model calls, Tool calls, Errors, plus **Snowflake credits** when Cortex Code ran (credits and warehouse; dollars marked as estimated). Errors > 0 shows a `danger` outline glyph, never a fill.
2. **Agent palette** applies in Layers 2 and 3 only, as adopted in [ux-direction.md](../ux-direction.md) section 6.
   - Orchestrator indigo, resource reader teal, Cortex Code sky, coding agent violet (lane B dashed), reviewers and QA steel, each validated for color-vision deficiency in both themes. The palette **excludes UA red, the danger brick, caution amber and success green**.
   - The full hue means working, the tint with a hue border means waiting on a tool, and hatched gray means waiting on a person. (The reference instead uses the tint for model calls and the shade for tool calls.)
   - Color never stands alone: every bar's row has the logo and the name.
3. **Failures:** a `danger` **outline** bar (1.5px stroke, canvas fill) with an X glyph, the word "Failed" in the row, and the reason in the popover. The label stays `ink`. This keeps red for "waiting on you" and honors "danger is never a fill". The retry bar links back to its failed attempt. **Check:** dark `danger` #ff8a80 is close in hue to dark `decision` #ff3b3f. Run both through the CVD check and, if needed, shift dark danger toward orange-salmon; form (outline plus X versus solid notch plus label) remains the primary cue.
4. **Delegated agents are often black boxes.**
   - Cortex Code and the Copilot coding agent are remote `invoke_agent` CLIENT spans. Draw each as one bar with an "External agent" marker and whatever the callee reports (Cortex: query ids, rows scanned, bytes scanned; Copilot: session link, PR, checks).
   - **The data that came back is shown as size, not content**, which matches "returns only what is needed".
   - **Compress long idle gaps.** A Copilot session can run 40 minutes inside one station turn. Gaps longer than a threshold collapse to a zigzag axis break labeled "38 min".
5. **Rollups stated explicitly:** an agent row's cost includes its children (shown as "incl. 3 sub-steps").
6. **"Slowest"** is a neutral outline pill with a clock glyph rather than amber, because caution already means "waiting long".
7. **Playback.** Live mode has the now cursor. Replay mode adds pause, restart, 0.5x-4x, **Jump to failure** and **Jump to slowest**.
   - Keys: Space toggles play, Left and Right step between span starts, Cmd+F searches.
   - Under reduced motion there is no autoplay: show the complete final frame and step on demand.
8. **Popover becomes a details drawer:** model, tokens including cache, cost, TTFT, error, a summarized input (metadata only for data-bearing spans), span and trace ids, and the CloudWatch deep link.
9. **Accessibility:** the tree is `role="treegrid"`, and each bar is a button labeled with name, kind, model, duration and status. An outline (table) view carries the same rows for screen readers and print.

**Layer 2 (project leads): the same grammar at project scale, calmer**
- **Lanes are actors:** the assistant (orchestrator), each delegated agent, and **each person**.
  - Agents keep logo tiles and their hue on lane bars. Agent color never reaches Layer 1, so "calm by default" holds where business users work.
  - Person lanes show avatar, name and role.
- **Human waits** are hatched segments labeled with age ("Waiting for Dana · 2d"). They turn `caution` after 2 business days in the waitee's time zone, per ux-direction section 5. When the waitee is the viewer, the segment ends in the **solid red notch with "Your approval"**.
- **Gates** are vertical ink rules topped with the line's square notch, carrying split time and initials ("4d 2h · MC").
- **Handoffs** between lanes are elbow connectors in ink.
- **Decision records** are small notches at the decision time; click one to open the record (options, the recommendation, rationale, who chose).
- **Side effects** (repo created, Jira issue filed, Confluence page written) are logo ticks that open the ledger.
- **Failures** use the same outline treatment with a "last good at" stamp.
- **Scale:** the axis is hours and days with weekends shaded, and today is marked.

**One timeline core for three views.** Build a shared `Timeline` package (time scale, axis with breaks, bar, hatch pattern, elbow connector, markers, playback clock) once. Render the Layer 3 trace (seconds), the Layer 2 lanes (hours and days) and the decision timeline (days and weeks, section 5) from it, so the grammar is identical everywhere.

## 4. Data tables

| Option (checked 2026-10-25) | License | Engine | Fit |
|---|---|---|---|
| [TanStack Table v9](https://tanstack.com/blog/announcing-tanstack-table-v9) | MIT | Headless; stable since 4 Aug 2026 (npm 9.3.1) | The base under everything below. Tree-shakable `tableFeatures()`, TanStack Store, React Compiler friendly. The project claims large memory and speed gains. New: cell range selection, cell spanning, multiple aggregations. [Examples](https://github.com/TanStack/table/tree/main/examples/react) include `kitchen-sink-shadcn-radix/base`, `column-pinning-sticky`, `filters-faceted`, `virtualized-rows`, `web-worker-row-models` and `realtime-trading` |
| [shadcn Data Table](https://ui.shadcn.com/docs/components/data-table) | MIT | Guide on TanStack v9 | A teaching guide, not a component: sort, filter, visibility, selection, pagination, row actions |
| [Dice UI](https://github.com/sadmann7/diceui) Data Table and Data Grid (source: [tablecn](https://tablecn.com)) | MIT | TanStack v9, Radix **and** Base UI variants (Sep 2026) | **Data Table:** typed filters (text, number, range, date, date range, boolean, select, multi-select) as a list or command menu; multi-sort; **URL state via nuqs** (per-column params since 11 Oct); client or server mode; pinning `start`/`end`; visibility, ordering and sizing; selection with an action bar; keyboard shortcuts; RTL; an a11y audit. **Data Grid:** spreadsheet editing across 9+ cell types, clipboard (TSV from Excel), undo and redo, find, row heights, and row and column virtualization that stays smooth at 100k rows (19 Oct). Shipped breaking changes three times in October |
| [ReUI](https://reui.io/docs/data-grid) | MIT core, paid Pro | TanStack **v8** plus Virtual | 29 grid patterns: sticky header, dense, striped, pinnable columns, draggable rows, sub-grids. A good pattern source |
| [Origin UI](https://github.com/cosscom/ui) (now coss.com/ui) | **Mixed:** `apps/origin` and `apps/ui` MIT, rest of repo AGPL-3.0 | TanStack | Copy only from the MIT directories |
| [Kibo UI table](https://www.kibo-ui.com/components/table) | MIT ([repo](https://github.com/shadcnblocks/kibo), now shadcnblocks) | TanStack v8 | Minimal (sort, custom columns); repo quiet since May 2026 |
| [Material React Table](https://github.com/KevinVandy/material-react-table) | MIT | TanStack v8 plus MUI | Last release 3.2.1, Mar 2025. TanStack hosts a v9 plus MUI v9 port example. Wrong design system |
| [AG Grid Community](https://www.ag-grid.com/react-data-grid/community-vs-enterprise/) | MIT (36.2.0) | Own engine | Row and column virtualization free. **Sparklines** (imported from `ag-grid-enterprise`), row grouping, pivot, master/detail, range selection, Excel-like clipboard and tool panels are Enterprise. Its own Theming API |
| [Glide Data Grid](https://github.com/glideapps/glide-data-grid) | MIT | Canvas | Very fast, but stable 6.0.3 declares React <=18. Canvas cells resist Tailwind tokens and React content. Last push Jan 2026 |
| react-data-grid 7 (beta.63) | MIT | Own | Peer React ^19.2; an alternative spreadsheet engine |

**Recommendations**
- **Console: TanStack Table v9 plus TanStack Virtual, with Dice UI's Data Table (Radix variant) copied through the shadcn CLI as the pattern source and restyled to UA tokens.**
  - It matches the stack already chosen in ux-direction section 11: Radix, TanStack, `nuqs` for "filters as addresses".
  - It is MIT and current with v9.
  - Pin the copied version and log it, since upstream is churning.
  - Use it for Inbox lists, Library facts, requirements and findings, Admin (roles, budgets), the side-effect ledger and cost tables.
  - **Row selection's action bar must never offer approve.** "No bulk approve, ever."
- **Generated prototypes: the UA app kit ships a pre-wired `DataTable` built from the same Dice UI Data Table (client mode) in the golden-path template.** The coding agent then only writes column definitions, and every prototype table looks like UA built it.
  - Escape hatches: Dice UI Data Grid when the brief needs spreadsheet-style editing; **AG Grid Community** for very large, Excel-like analytic grids.
  - Add a lint rule that fails on any `ag-grid-enterprise` import, so a prototype never ships an unlicensed Enterprise feature.

**What a modern table shows, in UA terms**
- **Sticky header**, plus a sticky first column when the table scrolls sideways.
- **Pinned columns** at `start` and `end` (selection and name left, actions right), with an edge shadow only while scrolled.
- **Sort:** click to sort, Shift-click for multi-sort, the direction glyph beside the label, and the sort kept in the URL.
- **Faceted filters** with counts per value ("Finance 12"), as chips in a toolbar, plus a "Clear filters" action.
- **Column visibility** and order in a View menu, remembered per user.
- **Density:** three settings that move row height (28-42, 44-56, 56-92px), padding and type size together. This maps onto Dice UI's row-height menu.
- **Row selection** by checkbox with Shift-range, and an action bar showing "3 selected".
- **Inline sparklines:**
  - A hand-rolled 64x16 SVG: no axes, the last point dotted, the value beside it in tabular figures. No chart library is needed.
  - Prototypes only, or console cost trends. Never on KPI tiles, per the taste-skill findings.
- **Status:** a small glyph plus text, never a filled chip. The decision red notch appears only on rows waiting on the viewer.
- **Virtualization** past about 200 rows, keeping the sticky header.
- **Pagination counts:** "1-50 of 1,284" in tabular figures, a page-size select, and server or client mode.
- **Empty states:**
  - No data: keep the frame, one sentence, and the first action where the rows will appear.
  - Filtered empty: "No matches" plus Clear filters.
  - A real zero prints "0"; missing data is a gray dash.
- **Loading:** skeleton rows at the current density under the real header.
- **Error:** shown inside the table with "last good at 09:14".
- **Keyboard:** arrow-key cell navigation and `/` to search.

## 5. Gantt and timeline components for the decision timeline by person

| Option | License | Notes |
|---|---|---|
| [SVAR React Gantt](https://svar.dev/react/gantt/) 2.8 (7 Oct 2026) | MIT core since 2.4 ([blog](https://svar.dev/blog/react-gantt-pro-2-4-released/)); PRO commercial (from about $524 per developer, SaaS only in higher tiers) | React 18/19. The MIT core has hierarchy, dependencies, drag editing, zoom, sorting, filtering and custom bar templates. **Task grouping, resource planning and markers are PRO**, so a by-person view needs PRO or people modeled as summary tasks |
| [Kibo UI Gantt](https://www.kibo-ui.com/components/gantt) | MIT | shadcn-style, built on dnd-kit, jotai and date-fns. Daily, monthly or quarterly range, markers, a today marker, groups, and **lanes (several items per row)**, which fits "by person". No hours; quiet repo |
| [react-calendar-timeline](https://github.com/namespace-ee/react-calendar-timeline) | MIT | The data model is groups (people) by items (decisions) natively. The current line is 0.30 beta (interactjs, dayjs) |
| [frappe-gantt](https://github.com/frappe/gantt) 1.2.2 | MIT | Vanilla SVG, task-centric: dependencies, progress, read-only, holidays, hour to year views. No resource rows |
| [DHTMLX Gantt](https://dhtmlx.com/blog/dhtmlx-gantt-10-0/) 10 | Community Edition MIT from v10 (v9 and earlier stay GPL); PRO paid | Capable but heavy, vanilla JS |
| [vis-timeline](https://github.com/visjs/vis-timeline) 8.5 | Apache-2.0 or MIT | Groups and items, vanilla JS, dated look |
| Bryntum Gantt | Commercial | Excellent and expensive; skip |
| Planby | Custom license | Skip |
| gantt-task-react | MIT, **archived** | Skip |

**Recommendation.** Build the decision timeline on the shared `Timeline` core from section 3. The view is read-only, so a library's editing engine buys little, and the time axis, hatching, notches and markers must match the trace and lanes exactly. Kibo's MIT lanes code is a reference for packing several items per row.
- **Rows and bars:** one row per person (avatar, name, role), grouped by function. A bar runs from "asked" (outline) through "deciding" (solid, in the person's color) to "decided".
- **Open decisions** extend to now, hatched, labeled with age; `caution` after 2 business days in that person's time zone.
- **Waiting on the viewer:** the bar ends in the solid red notch labeled "Your decision".
- **Settled:** a diamond with the decision id (D-3).
- **Handoffs:** elbow arrows for "asked Dana" and "reassigned to Jordan".
- **Sent back:** the old bar is struck through and kept, and "Round 2" starts.
- **Approvals:** black square notches on a top rail, plus a today line.
- **Controls:** zoom by day or week, filter by role, and a click opens the decision record.
- **If a library is preferred:** react-calendar-timeline once 0.30 is stable, or SVAR PRO if dependency arrows and editing become needs.
- **For generated prototypes that need a project plan:** SVAR's MIT core, with PRO imports blocked by lint.

## 6. Interactive architecture diagrams

**Libraries**
- **[@xyflow/react](https://reactflow.dev) 12.12 (MIT): keep it.**
  - Group (parent) nodes with `parentId` and `extent: "parent"` give boundaries.
  - Custom nodes are ordinary React components, so they take our tokens.
  - It also brings MiniMap, `colorMode`, and `onlyRenderVisibleElements`.
- **[React Flow UI](https://reactflow.dev/ui)** (shadcn CLI, React 19 and Tailwind 4): Base Node, Status Indicator, Tooltip, Appendix, **Labeled Group node**, Database Schema node, Labeled and Button Handles, Animated SVG Edge, Edge with Node Data, Node Search and Zoom Slider. The page states no license; the xyflow repo is MIT, so confirm before copying.
- **Layout: dagre versus elkjs.** React Flow's own [comparison](https://reactflow.dev/learn/layouting/layouting) says:
  - dagre (MIT, 3.1.3, already in the console) is fast and simple, but sub-flows break when their nodes connect outside the group (an open issue), and it has no edge routing.
  - elkjs supports sub-flows, dynamic sizes and edge routing, but is complex, asynchronous and about 1.4 MB.
  - elkjs is `EPL-2.0 OR GPL-3.0-or-later`. EPL-2.0 is weak copyleft that attaches to modified ELK files, not to an app that depends on it unmodified, but it still needs a legal note and a decision-log entry.
  - **Recommendation: keep dagre for build order and small DAGs. For the architecture artifact, use a zoned layout:** boundaries are fixed columns placed by rule, with dagre inside each zone. That is deterministic, readable and license-free. Adopt elkjs (in a web worker) only if real diagrams outgrow it.
  - React Flow's libavoid edge routing example is Pro.
- **Architecture as code: [LikeC4](https://github.com/likec4/likec4)** (MIT, 1.60).
  - A DSL for model, views and **dynamic views** (scenario walkthroughs), icons `aws:`, `azure:` and `tech:`, React embedding, and an MCP server.
  - It renders on xyflow and lays out with Graphviz WASM. **Graphviz itself is EPL**: same note as elkjs.
  - It is a strong format for Blueprint to emit into generated repositories, so the console and the repo docs render one source of truth.
- **[Excalidraw](https://github.com/excalidraw/excalidraw)** (MIT, 0.18): the hand-drawn register suits "Shape, not final" wireframes and workshop sketches, not the precise architecture artifact.
- **[tldraw](https://tldraw.dev/pricing):** production needs a commercial license (100-day trial, hobby by application). Avoid unless bought; never in prototypes.
- Mermaid (MIT) and D2 (MPL-2.0) are fine for static docs only.

**Design patterns for a clear, good-looking system diagram**
1. **Read left to right: inputs, the system, outputs.**
   - Inputs: people and resources pointed at (Teams recording, OneDrive folder, Jira ticket, Confluence page).
   - The system: the HyperDelivery AWS account, with orchestrator, specialized agents, the per-project knowledge base, AgentCore Memory, Step Functions, DynamoDB and S3.
   - Outputs: preview, repository, Jira issues, Confluence page, Teams card.
   - Snowflake sits beside AWS with Cortex Code inside its boundary; GitHub (Copilot coding agent, Actions) sits on the build side.
2. **Boundaries are zones, not boxes of boxes.**
   - Each zone is a light tint (`surface`) with a 1px `line` hairline, 8px radius and no shadow.
   - A label tab at top-left holds the vendor logo (16px), the name and a mono sublabel ("AWS · hd-prod", "Snowflake · UA_EDM", "Microsoft 365 · UA tenant", "Atlassian Cloud", "GitHub · ua-prototypes").
   - **Trust boundaries are dashed**; ownership boundaries are solid.
   - Nest at most two levels (account, then service group).
3. **Nodes:**
   - 4px grid, 8px radius, a 20px logo tile at left, the name, and a mono sublabel in Detailed view.
   - One accent spent on the one or two focal nodes. Red only if a node is waiting on the viewer, which is rare.
   - The detail ladder from the canvas pattern (7, 12, 24 nodes) still applies.
4. **Edges:**
   - Orthogonal with 6px corners, an arrow in the direction of data, and dashed when asynchronous.
   - **Label every edge with what crosses it and its classification:** "transcript text", "metadata only", "DataTask → DataFindings, never rows", "BuildUnit → BuildResult", "signed gate token", "PR + checks". This is the plan's data rule made visible.
5. **Interaction:**
   - Hover a node to highlight its paths and dim the rest. Click it for a side panel (responsibility, requirements served, data touched, owner).
   - **"Replay a request"** playback steps through numbered edges, as a LikeC4 dynamic view does.
   - Zooming out collapses a zone into one logo node with a count.
   - Fit to view, an outline view, and SVG/PNG export named from context.
   - Animated edges appear only on hover or playback, and never under reduced motion.
6. **A legend** whenever line style or color carries meaning: solid versus dashed, trust boundary, classification.
7. **Logos come from the official packs** (section 2), are never recolored, and are listed in a credits line on export.

## Sources not accessible or unverified
- diceui.com (Cloudflare 526); used [the repo's changelog files](https://github.com/sadmann7/diceui/tree/main/docs/content/docs/changelog) instead.
- Kobra Trace Waterfall source (paywalled); only the live demo and the post's video were used.
- Microsoft's terms for product icons inside an app UI; ReUI's v9 timeline; the React Flow UI license.
- Official AWS group-icon color and dash rules (they are in the icon deck, not on the page).

---

## Appendix A: reference trace measurements (from the 1560px video frames, roughly 1.56x)

- Panel about 1000px wide, 14px radius, dark surface. Header 52px with "Trace" title left and a search field with a Cmd+F hint right.
- Summary strip about 60px; cells divided by 1px rules; label 13px muted over value 20px.
- Rows about 32px at 1x. Logo tile about 20px with a 5px radius. Tree indent about 18px per level with 1px guides. The steps column is about 48% of the width and resizable.
- Bars about 16px high on a 32px row, fully rounded. Tool-call bars are often narrower slivers (4-8px wide when short). The value label sits 8px right of the bar end.
- Hatch: a 45° line every 6px inside a 1px outline, same height as bars.
- Handoff connector: 1.5px, elbow with about 6px corner radius, from the parent row's delegation instant down to the child's first bar.
- Failed bar: about 40px wide, filled red, white 12px X. Retry bar: agent hue with a white 12px circular-arrow glyph.
- Now cursor: 1.5px vertical line with an 8px dot at the axis.

## Appendix B: Beautiful UI tool chip source facts

- Constants: `STEP_MS = 700`; row data `{icon, label, chip, mono, detailMono, detail[]}`; diffs `{file, add, del}`; props `steps`, `diffs`, `diffLines`, `labels`, `onOpenChange`, `onToggleRow`.
- Classes (Tailwind v4): row `h-7 gap-2 rounded-control px-[3px] hover:bg-hover-2`; chip `h-5.5 rounded-chip bg-field px-1.5 text-[11.5px] text-ink-2 shadow-hairline`; diff chip `h-7 rounded-chip bg-surface px-2 font-mono text-[11.5px] shadow-btn`.
- Task Rows timeline comment: rows enter 80ms apart, ring sweeps, a row expands, a row flips to Failed with a spinning retry, then resolves to Completed.
