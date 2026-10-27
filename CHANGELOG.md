<!-- cspell:words pandoc -->

# Changelog

Notable changes to the Hyperdelivery factory line. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Add your entry under `Unreleased` as part of the change, not afterwards - see the
Definition of Done in [AGENTS.md](AGENTS.md).

## [Unreleased]

### Added

- `docs/ua-dlc/`: the proposal for HyperDelivery's next phase under the UA-DLC process, as a
  draft for leadership review. It holds the leadership plan with an ask in three tranches, milestones
  and stop rules (`enterprise-plan.md`), the operating model (`operating-model.md`), the platform
  architecture (`platform-architecture.md`), the UI/UX direction (`ux-direction.md`), a
  file-referenced picture of the repo today (`current-state.md`) and the sourced research behind
  it (`research/`, two rounds). The plan runs in three phases: Current State (baseline by week
  2), the Final MVP (an orchestrator that hands Snowflake work to Cortex Code and coding to a
  sandboxed coding agent, projects started from a Jira ticket or pointed resources, a per-project
  index, with a short do-no-harm floor in weeks 1 and 2, then a pilot) and Enterprise; UA-DLC
  keeps engineering's step names in a four-phase line. `design-system.md` sets HyperDelivery's look on UA Baselayer (tokens, type, the app
  shell, components, icons), and the research folder adds a fourth round (more factory write-ups, UA
  engineering's AI-DLC tooling, Baselayer, harness engineering) with an index of every source the owner
  shared (`research/sources.md`); the architecture doc explains why Step Functions stays and where
  LangGraph would fit, and the coding agent now runs in HyperDelivery's sandbox on an AgentCore harness
  with a swappable engine instead of GitHub Copilot's cloud agent. Concept screens are published separately and linked from the folder README.
  The README and the design library point to it; nothing in it changes code or the MVP plan of
  record. See docs/decisions.md.

- `docs/ua-dlc/`, round 7: the plan now runs in three phases instead of five stages. Current State
  ends with the baseline measured in week 2; the Final MVP is built to MVP ready in week 14 and then
  tried in a real testing pilot through week 22; Enterprise (governance, identity, audit, budgets,
  evals, policy and HyperDelivery's own production environment) is decided at the pilot readout. Each phase has its own
  architecture diagram, and enterprise work never holds up the Final MVP or its pilot. Guidance on
  which tool to use moves out of the concept screens into the plan's complexity and use-case
  matrices (sourced in `research/tool-landscape.md`). The design targets desktop and laptop browsers
  in the light theme only, help moves behind a "?" in the top bar, Start is generic, Inbox and
  Projects screens are added, and the tier "T2 MVP" becomes "T2 Department app". A standalone concept
  site lives in `docs/ua-dlc/site/` (the plan page and a clickable canvas of the 22 concept screens,
  static HTML): `make site` serves it, and `make site-plan` rebuilds the plan page with
  `scripts/build_ua_dlc_plan.py` (needs pandoc). `current-state.md` is corrected against the code
  (two DynamoDB tables, uploads failing on `dev`, agent runtimes outside CDK, the approval 3 merge),
  and earlier research reports keep their findings with a note that maps their stage numbers to the
  phases. See docs/decisions.md.

- `docs/ua-dlc/`, round 8: HyperDelivery's build now stops at Inception. Following the UA-DLC outputs
  agreed with another UA team (Ideation a visual mockup, Inception a prototype on a hosted sandbox with
  dev data, Construction a production-ready version on production data, Operations the deployments and
  promotions), approval 1 signs the brief and the mockup at the end of Ideation, approval 3 accepts the
  sandbox prototype at the end of Inception, and every project ends with a handoff package. How
  Construction is done (AI-driven or AI-assisted with engineers) is a named decision after the handoff,
  not a fourth approval; prototypes run only on dev data, and T1 to T3 become target tiers built in
  Construction. Approval 2 now unlocks only the prototype repository, pushes, the sandbox, dev-data
  grants and build spend; the Jira epic and issues, with engineering's AI-DLC context files, are
  filed at the handoff after approval 3. The line reads Discover, Plan, Prototype, Handoff. The concept screens move to a
  collapsible side nav, a chat-first Home and one workspace per project (the conversation beside an
  artifact panel holding the brief, mockup, plan and prototype), use UA Baselayer's three-dot loader in
  place of spinners, and drop showcase cards such as "Shipped Across UA This Week". The plan adds a guide
  to who else is building toward UA-DLC (`research/dlc-landscape.md`, with a coverage visual), the tool
  matrices show the real Factory and Cursor marks with a generic mark for other agentic IDEs, and the
  research folder adds a read-only pass over UA's Figma libraries (`research/figma-libraries.md`) and a
  study of how leading AI apps lay out their UI (`research/ai-app-layouts.md`). The competitor claims
  are checked against their sources: engineering agents can query Snowflake through MCP, so the
  difference is binding numbers to certified definitions, and Snowflake's apps are built by analysts
  and engineers rather than business users. See docs/decisions.md.

- `docs/ua-dlc/`, round 9: the UI direction goes to a team vote instead of being assumed. The concept
  canvas gets four pages: Compare and Vote (`Compare.dc.html`, opened first: the three directions side by
  side, each with a wireframe of its Home, what it feels like, who it suits, honest pros and cons, then a
  comparison table, what stays the same and a link to the vote page), A · Top Bar (`A_*.dc.html`, the round
  7 header design rebuilt with today's content and rules, without its showcase cards), B · Side Nav and
  Chat (today's boards, unchanged, the reference build) and C · Guided Path (`C_*.dc.html`, new: the line
  is the navigation, one next step at a time, with the assistant on call in a drawer). A and C each draw
  Home, Inbox, Projects, New project, Project, Approval and Handoff with B's facts, at the same positions
  as B's boards, so switching pages swaps the UI in place. Votes are collected on a separate page the
  owner shares, and the decision stays open until then. `ux-direction.md` section 3 describes the three
  directions and how the vote works, `design-system.md` section 7.1 notes that it documents Variant B's
  shell, and the plan's "Before the meeting" list adds the vote. On the canvas, Esc first closes a
  board's open menu (focus back on its button) or leaves a text field, and only the next Esc leaves the
  board; a link to part of another board, such as an Inbox item, opens that board on that part. See
  docs/decisions.md.

- A turn's usage now carries its dollar cost (`cost_usd`) and the `model_id` that ran it beside
  the token counts, and the console shows the cost next to the token total (`142K tok · $0.31`,
  exact figure and model in the tooltip).
  Rates live in `config/model_pricing.yaml`, keyed by model ID, and the cost is computed when
  the turn is recorded, so a later price change does not rewrite history. A model with no
  entry reports no cost rather than $0, and `tests/unit/test_pricing.py` fails if an agent
  is moved to a model that has none. Turns recorded before this show tokens only.

- Console UI checks: `vitest` in `ui/console` (`pnpm test`, `pnpm coverage`), covering the
  pure logic in `src/lib/`, `api/client.ts` (requests, errors, SSE parsing, the WebSocket opener)
  and `useProjectsStore` (recents, delete/rename, the undoable gate decision, local and deployed
  runs, build polling), and `pnpm typecheck` (`tsc -b`). `make check` and CI run lint,
  typecheck and tests with a coverage floor as the `ui` gate (skipped locally when `pnpm` is
  missing). See docs/decisions.md.

### Security

- `POST /projects/{id}/decisions` records the authenticated caller as the signer (email,
  or object id when the token has none). The request body no longer carries a signer, and
  one sent by an older client is ignored, so a caller can no longer sign as someone else.
  `HyperdeliveryClient.submit_decision` drops its `signer` parameter. See docs/decisions.md.

### Changed

- Claude Code's graft wiring is refreshed for graft 0.25 (`.claude/settings.json`,
  `.claude/helpers/`, `.claude/skills/graft/`): hook timeouts are now in seconds, as Claude Code
  expects (the old values were milliseconds read as seconds), and new hooks cover the shell
  pre-check, failed shell commands and session end. The Cursor, Copilot and AGENTS.md wiring is
  unchanged.
- The Sources tab immediately shows the last list of uploads read during this browser session
  while refreshing it from S3 in the background on every open, instead of a loading skeleton.
  An upload through the composer also starts a background refresh, and a read that began before
  an upload can no longer overwrite the refresh that follows it.
- The four station agents (Distill, Blueprint, Review, Showroom) now run on Claude Sonnet 5.5
  (`global.anthropic.claude-sonnet-5-5`, was `global.anthropic.claude-sonnet-5`). Deployed
  AgentCore runtimes pick this up only when redeployed with `scripts/deploy_agent.sh <agent>`.
  The Snowflake Cortex Agent orchestration model moves to `claude-sonnet-5` (was
  `claude-sonnet-4-5`); Cortex has no Sonnet 5.5, so it cannot match the Bedrock agents. The
  project-namer stays on Haiku 4.5 - no Haiku 5 exists in Bedrock.
- API errors now carry a stable `code` next to `detail`: `{"detail": "project not found",
  "code": "project_not_found"}`. `detail` is unchanged, so existing clients keep working. Each
  code has one HTTP status (`api/errors.py`), the routers document `ErrorResponse` in OpenAPI,
  and the console words each code itself: a missing `GITHUB_PAT` or S3 setting reads "This isn't
  set up on the server" instead of "This project moved on without you". A failed stream request
  now shows the server's message rather than the raw JSON body. A failed agent turn's `error`
  stream event also carries a `code` (`TurnErrorCode`: `agent_timeout`, `agent_output_limit`,
  `agent_no_result`, `agent_failed`, `invalid_prompt`, `invalid_project`, `turn_failed`), kept on
  the turn record as `error_code` and returned by `GET /projects/{id}/turns`; the console words
  each ("The agent took too long", "The document was too big to finish"). The Python SDK raises
  `HyperdeliveryError`, still an `httpx.HTTPStatusError`, with the API's `code`. See
  docs/decisions.md.
- Stream events, tool statuses and the stopped marker are `StreamEvent`, `ToolStatus` and
  `TURN_STOPPED` in `core.constants` instead of repeated string literals, mirrored in the
  console's `api/protocol.ts` with a test that fails if they differ. The GitHub REST clients
  share `providers/github/http.py`, review severities live in `core.domain.review`, and the
  local agent ports use `AgentName`. A stopped turn now reads "This run was stopped" rather
  than "did not finish". The wire format is unchanged. See docs/decisions.md.
- A tool call that returns an error is reported as `failed` in the `tool_call` event, not
  `done` (Strands hands an errored call back as an ordinary result, so the two were
  indistinguishable). Console clients that only know `running`, `done` and `interrupted`
  will treat it as unknown. A failed `create_pull_request_with_copilot` or
  `assign_copilot_to_issue` no longer counts as a side effect worth saving.
- Console: a failed tool call shows a red mark, opens to its reason, and counts as "N failed"
  on the collapsed trace chip, in Simple mode's steps and in its summary line; a failed read
  is no longer listed as a source. The Progress tab lists what the crew did outside the
  console (files written, issues and pull requests, Jira changes) with a link to each and a
  "did not go through" note for failures. The tab title names the agent that is working, and a
  run that finishes while the tab is out of sight shows "Finished" and a green dot until you
  look at it.
- The API records each finished agent turn (text, tool calls, usage, duration, and the error if
  it failed or was stopped) as a `TURN#<start>#<agent>` item under the project, from both the
  local stream and the deployed invoker, and serves them at `GET /projects/{id}/turns`. Tool
  results are clipped to 1,500 characters and a turn to 60 calls, and a failed save is logged,
  not raised into the run. No table or index change. The console reads the trace from there
  instead of `localStorage`, so it survives a reload and shows on any machine. See
  docs/decisions.md.
- The turn record also carries the person's message, and a deployed create or answer is
  recorded as a message-only turn. The console rebuilds the whole conversation from the
  server on open and keeps only the recent-projects list and detail level in `localStorage`
  (no conversations, signatures or quota-eviction fallback; old stored copies are ignored).
  The "seen document versions" map is capped at the 300 newest. A failed turn reads as
  "This run did not finish" with its reason.
- A turn is recorded after its artifact is saved (local stream and deployed invoker), so a
  failed save is on the record. A deployed run that finishes with nobody in the tab waiting on
  it now refreshes the project, documents, decisions and turns from the socket's `done` or
  `error` event (at 1.5s, 5s and 12s after, since `done` precedes the saves), so a build plan
  released by a gate appears without reopening the page. Unconsumed socket events are capped
  at 200.
- Console: each step in the tool trace has a small icon for its kind (read, search, query,
  write, question) and a failed step shows a red cross, all under the trace's quiet left rule.
- Console Portfolio: the filter chips show how many projects each would list (for the
  current search), and Project, Stage and Updated sort the table. The sort is kept in the
  URL (`?sort=name&dir=asc`), and Updated, newest first, stays the default.
- Console Home is one bento that fits a laptop screen: every tile shows at most four rows
  (the first tile spans two columns and lists eight when the grid would otherwise leave a
  gap), "View all" opens the matching Portfolio filter, and the crew is a tile of the same
  height. `⌘K` is the standard size (640px, 56px input) with grouped results, searches every
  project rather than only recent ones, and shows key hints; the header search trigger is
  wider and labeled.
- The console defaults to **Simple**: the "Developer / PM" switch is now "Simple / Detailed"
  (stored choices are kept). Simple narrates a run as plain steps with status marks instead
  of going silent, and hides raw JSON and token counts. Thread, gate and document text is
  one size larger; the content tab is named for the document; remaining copy says
  "document", "stage" and "build task". Ref and Host moved to violet and magenta so no
  agent color matches a status color. Enter no longer sends mid-IME-composition, the logo
  navigates without reloading, and small attach/remove buttons have 24px hit areas.
- The console's names are plain around the named crew: stages are Requirements, Plan, Build
  check and Demo; outputs are the requirements brief, build plan, quality report and demo
  script; gates read "Approve requirements", "Approve the plan", "Approve the build"; each
  agent shows a job title. The landing page now names all three gates instead of two.
  Display strings only - wire ids and the API contract are unchanged. See docs/decisions.md.
- The default `make check` skips slow AWS infrastructure validation; `make check-full`
  runs it explicitly, and CI continues to run the full gate.

### Fixed

- Console, from a second review of the live app:
  - The project rail is a short list instead of three folded groups above an empty column:
    "Needs you" (up to five, a red dot, "+N more waiting" into Portfolio), then "Recent"
    (the 8 most recently updated), with "View all N in Portfolio" pinned at the bottom.
    The project you are in is always listed and highlighted, a search shows every match in
    one list, and the station moved from a chip into the row's tooltip. The rail now shares
    the page's background, with plain rows and no per-row dots, instead of a grey panel.
  - A reply where the agent has already spoken no longer repeats itself with the generic
    "Before I draft anything..." line, and a question card that is greyed out while the run
    finishes says why.
  - Text an agent streams before and after a tool call no longer runs together ("...a few
    basics from you:I checked..."); the first chunk after a call starts a new paragraph.
  - A project opens at the end of its thread, where the gate is. The thread follows any
    growth (streamed text, and the documents and signatures that land after first paint)
    while the reader is at the end, so Approve is no longer left below the fold.
  - The thread holds a skeleton until documents and decisions are in, so the gate no longer
    paints first and jumps down when the turns above it arrive.
  - The artifacts panel's tabs are a real tablist with arrow-key
    movement, and the agents' tabs always show their names (Scout and Coach were two
    unlabeled robot faces).
  - A signed document no longer says questions are waiting "above the message box" once the
    station has handed off.
  - Disabled primary buttons and the composer's send button are neutral, not faded red.
    Selected options in Settings, the starting-point picker and question answers are
    neutral; red stays for the primary action, current station and gates.
  - Portfolio shows skeleton counts and no "No projects match" while the list loads, and
    the table shows 40 rows with "Show more" instead of all of them. The project rail no
    longer flashes "No projects yet." on first paint.
  - Signature lines, the document tooltip and Workspace notes share one date format.
  - Home's "What brings you here?" sits below the queues instead of pushing them down; the
    composer hint shows on focus, and its placeholder says "Add a note" while questions are
    open. A tool call's expand state is derived rather than set in an effect.
- Console, from a review of the live app:
  - A question the crew parked on the server now shows in the project's thread for everyone,
    not only in the browser that asked it.
  - A local stage that should be running and is not offers "Start {agent}".
  - Gate 3 lists the requirements the build check found not met. A project shipped with
    open requirements says so and does not celebrate.
  - A quality report's ring shows requirements met, not the report's own completeness.
  - Finished-turn replies and document cards state real counts ("4 of 7 met").
  - People show by name: "Eitan Flor", initials "EF", signers named from their email.
  - The thread keeps a readable column when the project list and a widened panel are both
    open, and crowded panel tabs collapse to labeled icons.
  - Portfolio's four counts add up to the total, stale crew stages are marked idle, and
    table rows and board cards are real links.
  - Search results show each project's stage and last update.
  - Every page has its own tab title, and there is a skip link.
  - Opening a project at a gate no longer raises "moved on without you".
  - Project names no longer take a chat reply from the naming model, or a file path from
    the brief.
- Console: the station line in the top bar no longer runs over the logo and search box -
  its labels now appear only as room allows, and inactive gate labels stay hidden as
  intended. The Portfolio page scrolls. `⌘K` no longer lists projects this API does not
  have (deleted, or visited against another environment); recents are pruned whenever the
  project list loads.
- The VS Code graft hook no longer creates a stray `graft/.cache` directory when an agent
  tries to read a path that does not exist.
- WebSocket broadcasting no longer constructs an AWS management client when no console
  connection is watching the project.
- AgentCore invocations now isolate request state and stream Snowflake tool progress over
  non-blocking HTTP.
- Deployed SSE responses are consumed incrementally for live WebSocket updates.
- Distill deployments receive configured Snowflake settings.
- AgentCore runtimes receive scoped read access to global context.
- Deployed turns buffer early frames and wait for persisted Distill state before accepting
  another answer; connection queries now paginate.
- Local and deployed turns use the same standing-context formatter and authoritative
  completeness evaluator before artifacts are persisted.
- G3 approval now waits for build status and rejects open `[WIP]` pull requests in both
  the console and API before attempting a merge.
- Distill questions survive reloads, deployed socket/poll races cancel their losing
  watcher, and context save errors remain visible without discarding the draft.
- Project creation now rejects duplicate caller-supplied IDs instead of overwriting state.

### Removed

- Removed the obsolete Streamlit agent test harness and its development dependency; the
  React console is the supported human interface.
- The capped static architecture diagram (`ArchitectureDiagram.tsx`,
  `lib/architectureGraph.ts`), replaced by the canvas.

### Added

- Console visual signature: an isometric drawing of the line, built in code from the tokens,
  on Home's first run, in the Help panel and at the top of Progress in Simple mode. In Help it
  is a full-color overview on a loop: a brief rides the belt, each crew member adds a sheet
  in their color, each gate swings open, and the demo gets a spotlight. In Progress it shows
  only that project - finished stages have documents, the gate it waits at is red and
  pulses, and the belt turns only while a run is active. Three authored moments: signing a gate
  stamps the ticket stub and sends the document along to the next crew member; the first
  project a browser starts opens a one-time kickoff card; a project's first view after
  shipping sends up a burst in the crew's colors. Document cards in the thread lift their
  pages on hover; the running project on Home shows a pixel-grid wave; the not-found page
  has an animated ASCII crew head; crew player cards carry the jersey number on a halftone
  portrait. Every illustration slot takes a dropped-in file from
  `ui/console/src/assets/illustrations/` and falls back to the code version until then.
  Prompts for generating each one are in `docs/design/asset-prompts.md`.

- Console canvases (React Flow and dagre, loaded only when a Design tab opens): the build
  plan's architecture with pan, zoom, fit, a minimap in the full view, keyboard navigation
  (arrows between nodes, Enter to select, +/- and 0) and an Outline alternative; selecting
  a component shows what it does, the requirements it serves and the tasks that build it.
  The inline view keeps the 7 (Simple) or 12 (Detailed) most connected components; the full
  view has no cap. A build-order view - step columns in Simple, a dependency graph with the
  critical path and loops in Detailed - and a data-model view. A Trace tab follows each
  requirement from plan to check to demo, gaps first. Portfolio gains a Board view with a
  column per stage.
- `GET /projects/{id}/artifacts/{agent}/versions` (every draft of a document, oldest first)
  and `GET /projects/{id}/documents` (uploads, under their original names, empty when S3 is
  not configured). Artifact responses now carry `version`.
- Console documents: a cover with the document's state (draft, waiting at a gate, approved
  by whom, sent back), version and export (Markdown, Word, PDF); the numbers that matter
  with a completeness ring; a sticky contents bar that follows the scroll; a copy-link on
  every section, with `?panel=` and `?section=` reopening the same place; citation chips
  that open the excerpt as a context card; filter chips on long requirement and finding
  lists; *What changed* between any two drafts, and a notice when a document changed since
  you last looked; selecting text offers *Explain*, *Ask {agent}* (quoted into the message
  box) and *Copy with link*. A Sources tab lists uploads, what the crew read, and what the
  requirements cite. Simple mode shows the numbered build order, the demo walkthrough and
  sample data, plain severity and the spec's open questions. Finished turns collapse their
  trace to tool chips in Detailed mode and name the files they read.
- `GET /projects/{id}/decisions`: every gate decision on a project, oldest first
  (`ProjectRepository.list_decisions`, `HyperdeliveryClient.list_decisions`).
- Console approvals and questions: the gate card shows what you are approving (real
  numbers from the document), criteria sentence-first with a confirmed count, what is still
  missing, what happens next, send-back starter phrases with a check for very short notes,
  a filling undo bar, and *Copy link for another approver*. Cleared gates are ticket stubs
  naming the signer from the server trail, and the Progress tab lists every decision under
  Activity. Questions come one at a time with an own-words answer, Back/Skip, and *I don't
  know - ask someone*, which copies a link to a new answer-only page (`/answer/:projectId`).
- Console working states: a thought line under a running agent that narrates the current
  step in plain words, rotates the crew member's working phrases through silence, shows
  elapsed time and offers Stop for local runs; Simple mode shows the document's outline
  filling in section by section instead of a "Writing" line; finished turns in Simple read
  "finished in 2m 14s · 6 steps". The thread follows the stream only while you are at the
  end, with a Jump to latest button otherwise. Receipts appear when a run or decision
  finishes on another project, and the tab title and favicon show waiting approvals and
  running work.
- Console Settings page (`/settings`, account menu or `⌘K`) for detail level, theme and
  role. The Simple/Detailed switch left the header and the role list left the account
  menu. A Home button joins the header navigation.
- The workspace side panel is open by default on wide screens, keeps a steady width and
  starts on a **Progress** tab: every stage with its state, what is happening now, what
  happens next and links to finished documents. The chat keeps one readable width whether
  or not the panel is open, and `/start` is two columns so it fits a laptop screen.
- Console Home at `/`: tiles for waiting for approval, questions waiting, in flight and
  recently shipped, ordered by a role the person picks on first visit (account menu to
  change). Starting a project moved to `/start` with starting points, a guided brief, a
  multi-file drop zone and a missing-attachment check. A help panel with the crew, gates
  and glossary; crew and gate tooltips; command-palette actions; a not-found page;
  labeled Portfolio and Workspace notes links. "Needs you" now reads "Waiting for
  approval", and the portfolio drops the "Stages complete" count.
- graft is wired into Copilot in VS Code: `.vscode/mcp.json` registers the graft MCP server
  and `.github/hooks/graft.json` keeps the graph fresh after agent edits. Setup per agent is
  in CONTRIBUTING.md.
- `docs/design/`: a UI/UX library for the console - an adoption-focused audit for
  non-technical personas, personas, principles, naming options, a phased roadmap with its
  backend dependencies, asset briefs, cross-cutting patterns, and one reference file per
  inspiration source (Kobra, detail.design, React Bits, Beautiful UI, Diagram Design).
  Docs only; no console behavior changed.
- Deployed turns stream through authenticated, one-time-ticket WebSocket subscriptions,
  with deterministic connection registration and polling fallback.
- `ProjectResponse.orchestration_mode` lets the console select local SSE or deployed Step
  Functions behavior.
- CDK configures the hosted console origin and required Entra settings on the console API.
- Blueprint, Review and Showroom are now deployed as real Bedrock AgentCore Runtimes
  (`hyperdelivery_blueprint`/`_review`/`_showroom`, us-east-1), alongside the already-live
  `hyperdelivery_distill`, using the existing `hyperdelivery-agentcore-execution` IAM
  role. The Step Functions/console-API orchestration stacks were already deployed in
  `dev` - this closes the gap so all four stations of the line run for real, not just
  locally. See docs/decisions.md.
- Fixed three bugs that had never surfaced because no Step Functions execution had ever
  actually run: `agent_invoker`'s Lambda was missing `pydantic` (unbundled package), its
  IAM policy granted the wrong action name for `ListAgentRuntimes`, and it decoded
  AgentCore Runtime's SSE response as a single JSON document. Threaded the real project
  brief and each station's predecessor artifacts into the state machine's prompts,
  replacing the `"Project {id}"` placeholder. See docs/decisions.md.
- Distill can now ask clarifying questions inside the real (non-local) Step Functions
  path, not just locally: a new `WaitForDistillAnswer` wait/loop (mirroring the approval
  gates' `WAIT_FOR_TASK_TOKEN` pattern) and `POST /projects/{id}/answer` let a human
  answer, folding the exchange into Distill's next turn instead of failing the execution.
  Verified live end-to-end, including a run needing two rounds of questions before
  Distill drafted a real `StructuredSpec` and reached the `blueprint_approval` gate. See
  docs/decisions.md.
- The console UI is now hosted in AWS (`ConsoleUiStack`: private S3 + CloudFront, no
  custom domain - `https://d2rl9sl66w9a5f.cloudfront.net` in `dev`), instead of only
  running via local `pnpm dev`. See docs/decisions.md - the deployed URL still needs
  adding as an Entra ID app registration redirect URI by hand before sign-in works there.
- There is now a single, global standing `context` (repo, database, design system,
  conventions) - like a system prompt, not scoped to any one project - set via
  `PATCH /context`, editable from a new `/context` page (linked from a top bar icon
  button, always visible). Short context is inlined straight into every station's
  prompt; long context is only previewed there, with a new `get_context` tool (added
  to every agent) fetching the rest on demand, so a page-long note isn't resent in
  full on every turn and retry. See docs/decisions.md.
- The console now calls `POST /projects/{id}/preview` itself once a project reaches
  `done`, and the "Off the line" banner shows the returned backend/frontend URLs as
  clickable links - previously the backend could start the local demo preview
  automatically but nothing surfaced a hyperlink anywhere in the UI. See
  docs/decisions.md.
- A Developer/PM toggle in the top bar (`useProjectsStore`'s persisted `viewMode`).
  Developer (default) is unchanged; PM hides the tool-call trace and raw streamed agent
  text in the thread and hides the raw-JSON tab in the artifact inspector, showing only
  the synthesized reply, the artifact card, and the structured content/design views. No
  new summarization - reuses `composeReply`/`artifactStats`, which already ran for every
  turn. PM mode also hides the build-detail sections within each station's own artifact
  view: Scout's "Machine-readable rules" and "Rule correlations", Coach's "Components",
  "Data model", "Integration points" and "Units of work", and Host's "Talk track" and
  "Seed data" (`ui/console/src/components/inspector/views.tsx`). See docs/decisions.md.
- The console can now upload a document (PDF/DOCX/PPTX/XLSX/PNG/JPEG) straight from the
  chat composer's new attach button, and from the landing page's "what are we building"
  box (uploaded once the project it names exists, then cited in Distill's first turn):
  `POST /projects/{id}/documents` stores it in the documents bucket and the chat turn
  cites its S3 key, which Distill already knows to fetch via `s3_get_document_text`.
  That tool now parses every format the local-file ingestion tool does (previously
  .txt/.md/.pdf only) - the format-specific parsing moved into a shared
  `providers/documents/parsing.py`. See docs/decisions.md.
- Distill can ingest local files as normalized Markdown, archive normalized local/S3
  inputs under `projects/<project-id>/normalized/distill/...` in the managed documents
  bucket, and keep incomplete FSDs in Distill when mandatory sections or completeness
  checks are missing.
- Review now asks Copilot to keep iterating on a finding's already-open pull request
  instead of reassigning the issue. Before calling `assign_copilot_to_issue`, it checks
  whether the finding's issue already has an open pull request; if so, it posts an
  `@copilot`-mentioning `add_issue_comment` on that PR's own number instead, recorded via
  `CopilotAssignment`'s new optional `pull_request_number` field. Avoids starting a
  second, colliding coding-agent session on the same base branch. See docs/decisions.md.

- A merge can now start a local preview automatically, with no human needing to pull or
  run anything. Optional (`PREVIEW_CHECKOUT_PATH` and friends, unset by default): both
  merge paths pull the target repo's default branch (`git pull --ff-only`) and start its
  own preview script in the background after a successful merge
  (`infrastructure/local_preview.py`), and `POST /projects/{id}/preview` /
  `.../preview/stop` let a human trigger or stop it by hand. Single machine, single
  checkout, single preview at a time - a laptop-demo convenience, not the hosted
  "preview per pull request" `docs/hyperdelivery-plan.md`'s Phase 3 describes. See
  docs/decisions.md.

- Merging a build pull request no longer requires the human to touch git. A human can
  explicitly merge one build from the console
  (`POST /projects/{id}/builds/{number}/merge`), and approving at the G3 gate now merges
  every build Review recorded automatically before the approval completes - bringing a
  behind branch up to date first (`providers/github/merge.py`'s `resolve_and_merge`), and
  failing the whole approval, with GitHub's own message, if a build has a real conflict
  it cannot safely resolve. No agent tool gained merge access. See docs/decisions.md.

- `resolve_and_merge` now also takes a build's pull request out of GitHub's draft state
  first, via GraphQL's `markPullRequestReadyForReview` (REST's "Update a pull request"
  has no field for this). Copilot-authored PRs are opened as drafts and do not reliably
  flip themselves to ready, and GitHub refuses to merge a draft regardless of CI or
  approval - so signing the G3 gate on one used to fail the whole approval with "Pull
  Request is not mergeable" even though the code was correct. See docs/decisions.md.

- The Blueprint architecture diagram can now be expanded into a full dialog
  (`ArchitectureDiagram`'s new expand button) - the same graph at a size that doesn't
  depend on how wide the artifact panel happens to be.

### Removed

- Deleted `notebooks/distill_agent_tools.ipynb`, an unreferenced exploratory scratch
  notebook that had been exempted from `make check` entirely rather than fixed. See
  docs/decisions.md.

### Fixed

- The `cspell` pre-commit hook now restates `--no-must-find-files` in its `args`
  (`.pre-commit-config.yaml`) - without it, staging a file deletion made every commit
  fail `cspell` with exit code 1 and no error output at all. See docs/decisions.md.
- The console API now decides its orchestration path (real Step Functions vs. local
  dev's `LocalAgentClient`) from the new `core.constants.Environment` enum
  (`local`/`dev`/`prod`, backing `Settings.environment`) instead of implicitly from
  whether `STATE_MACHINE_ARN` happened to be set. `dev`/`prod` now fail fast at startup
  with a clear error if `STATE_MACHINE_ARN` is missing, instead of silently falling back
  to the local-only path. See docs/decisions.md.
- `ConsoleApiFunction` (the console API Lambda) now has real dependency bundling
  (`infra/stacks/console_api_stack.py`'s `BundlingOptions`, exporting `uv.lock` to a
  pip-installable `requirements-lambda.txt` at synth time) - previously it shipped with
  no third-party packages at all and failed every invocation with `No module named
  'mangum'`. Bundling pins `--platform manylinux2014_x86_64 --python-version 3.11
  --implementation cp --abi cp311` so wheels resolve correctly regardless of the host
  machine's architecture (an Apple Silicon host otherwise produces arm64 wheels, e.g.
  `pydantic_core`, that fail to import on Lambda's x86_64 runtime). `providers/agents`
  (not all of `providers/`) is now the only excluded subpackage, since
  `api/routers/projects.py` imports `providers.documents`/`providers.github`/
  `providers.storage` directly. `requests` moved from the `dev` dependency group to
  `[project.dependencies]` in the root `pyproject.toml`, since
  `orchestration/local_agent_client.py` is production code that `api/main.py` imports
  and instantiates unconditionally. See docs/decisions.md.
- `STATE_MACHINE_ARN` was never wired into the console API Lambda's environment, so
  `create_project` could never actually start the Step Functions execution.
  `ConsoleApiStack` now takes the orchestration stack's `state_machine` and grants
  `states:StartExecution`/task-response permissions.
- The token/duration usage reported for a turn (`agent_invocation`'s `usage_payload`)
  was every turn the container had ever served summed together, not that turn's own
  cost - Strands' `EventLoopMetrics.accumulated_usage` accumulates across the whole
  life of the `Agent` object, and `agent` is one shared instance reused for every
  invocation. A late "hey" on a long-running dev server could report hundreds of
  thousands of tokens for a two-line reply with no tool calls. `agent_invocation` now
  replaces `agent.event_loop_metrics` with a fresh `EventLoopMetrics()` alongside the
  existing `agent.messages = []` reset, so usage reflects only the current turn.
- The console's persisted store (`hyperdelivery-console` in localStorage) could throw
  `QuotaExceededError` out of an unrelated `set()` call (e.g. a mid-stream token flush)
  once enough conversation history built up - `conversationByProject` was persisted in
  full, including per-turn `toolCalls` (whose `result` can be a whole fetched document
  or query result set) and every project ever visited, not just the 30 most recent.
  Persisted turns now drop large generic tool results and the mid-stream-only fields
  (`draft`/`waitingSeconds`/`streaming`) while retaining Distill's question call, and
  `conversationByProject`/`signaturesByProject` are
  trimmed to `recentProjects` before writing. `useProjectsStore.ts`'s storage adapter
  also now evicts the oldest recent project's history and retries on a quota error
  instead of throwing, as a fallback for conversations that still don't fit.

### Changed

- Every stand-alone narrative field across the artifact inspector now renders as
  Markdown instead of a plain string - gate criteria and rule correlation descriptions
  (`SpecView`), component/data-entity/integration-point/unit descriptions and API
  contract summaries (`BlueprintView`), finding descriptions and Copilot assignment
  notes (`ReviewView`), and talk-track narration and demo seed descriptions
  (`DemoView`), alongside the `architecture_summary`/`summary` fields already converted
  above. Each agent's prompt now says so, with a `**bold**`/short-bullet-list nudge for
  the fields long enough to benefit - short structured fields (a requirement's
  description, business value, evidence citations, acceptance criteria) are left as
  plain text since they sit inline next to badges that Markdown's block-level output
  would not align.
- PM mode also hides the spec's "Gate criteria" section in the artifact inspector
  (`SpecView`, `ui/console/src/components/inspector/views.tsx`) - a PM already sees the
  same gate criteria in `GateConsole` at sign-off, so repeating them in the artifact
  panel was developer-only detail, same as the sections already gated there.
- The synthesized chat reply (`composeReply` in `lib/formatArtifact.ts`) no longer
  repeats a not-yet-complete artifact's raw validator gap text (unit/requirement/
  contract ids) in the thread - it now just says how many things are still open and
  points at the artifact panel, which already renders each gap in full. Applies to
  every agent's turn, not just Distill's.
- A project no longer ships itself the instant Showroom's own deterministic score is
  gap-free - unlike Distill/Blueprint/Review, Showroom's next station is DONE (shipped)
  rather than a human approval gate, so it needs an explicit "project completed" message
  instead. The composer stays live at Showroom for as many turns as it takes; typing
  that exact phrase (case/whitespace-insensitive) advances to DONE without invoking the
  agent again, and 409s if Showroom hasn't produced a gap-free run of show yet. See
  docs/decisions.md.

### Fixed

- Distill's `max_tokens` override bumped to 32768 (`config/agents/distill.yaml`, same
  as Blueprint) - a real run grounded in Snowflake/S3 lookups still truncated
  mid-artifact with `MaxTokensReachedException` at the shared 8192 default. See
  docs/decisions.md.
- The laptop-demo preview's health check (`_HEALTH_TIMEOUT_SECONDS`) was 15s, too short
  once the target repo's own preview script started syncing dependencies (`git pull`,
  `uv sync`, `npm install`) before opening a port - a cold sync alone can take longer
  than that. Bumped to 90s per port.
- A test that never mocked `get_settings` (`test_g3_approval_proceeds_normally_...`)
  could spawn a real preview subprocess and fail on an not reaped-process
  `ResourceWarning` if the developer running the suite had `PREVIEW_CHECKOUT_PATH` set
  locally, in the file or in the shell. `tests/conftest.py`'s autouse fixture now blanks
  both. See docs/decisions.md.
- The collapsed artifacts panel's reopen control showed both an icon and the label
  "Artifacts" - now icon-only (`IconButton`, matching every other panel toggle in the
  shell), with the label moved to `aria-label`/`title` instead of visible text.
- A tool call's expanded detail repeated the raw wire name (`s3_list_reference_documents`)
  right below the row that already names the tool in words (`toolLabel`) - an
  implementation detail with no reason to reach the user. Dropped; `toolLabel` is now the
  only name shown anywhere in the trace.
- The artifacts panel was a fixed rem width regardless of viewport size, so widening the
  chat column's reading measure to fill the extra room (previous fix) still left a big,
  unused gutter on a wide screen once the panel's own fixed width was reached - looked
  like a layout bug. The panel now takes `flex-1` by default, giving chat and artifacts a
  real 50/50 split of the available width; its own expand toggle still grows it further,
  and the chat column now fills whatever width that leaves it instead of capping short.
- A tool call's expanded result was always `JSON.stringify`-ed, even for the several
  tools (document ingestion, Snowflake queries) that return a plain markdown/text
  string - which turned every newline into a literal `\n`, printing the whole document
  as one unreadable line. String results now render through the same `Markdown`
  component the chat text uses; structured (dict/list) results still render as JSON,
  since that's what they are. Both are now height-capped with scroll instead of able to
  stretch the trace to the length of whatever the tool returned.
- The station's open questions (MCQ pills, previously a separate "Send N answers"
  button above the composer) are now answered through the composer's own send instead
  of a second one - picking an option only stages it, so a pick and typed text go out as
  a single turn instead of two, and the composer's existing text/attachment rollback on
  a failed turn now covers picks too. See docs/decisions.md.
- The Inspector's artifact tabs were rendered in whichever order agents last wrote an
  artifact, not the stations' order on the line - now sorted against `AGENT_STATIONS`.
- The station's open questions had a "pick any that apply" hint sitting inline in the
  same row as the option pills, with no border/background to tell it apart from them -
  it read as an not clickable fourth option. Moved to its own line below the pills, and
  marked `select-none` so a click there can no longer land as a text selection instead.
  Also dropped the composer-adjacent "Pick an answer above, or type one below, then
  send." footer line - redundant now that the composer directly below is doing exactly
  that with its own placeholder text.
- Opening a `done` (shipped) project's thread still started the build-settled poll,
  which could post a stale "check the builds" follow-up turn for a station the project
  had already left - the state machine had moved it on first, so that post 409ed and
  surfaced as "This project moved on without you" while the human was just reviewing a
  finished project's artifacts. `Thread` now skips `watchBuilds` once the station is
  `done`.
- The project rail no longer stays open once a project has been created from the
  landing page's first message - `Landing` tags that navigation (`state: { justCreated }`)
  and `Shell` collapses the rail on it, the same way it would if the user had collapsed
  it by hand.
- `POST /projects/{id}/documents` read an uploaded file's entire body into memory with
  no size limit, risking high worker memory use on a large upload. It now reads in bounded
  chunks and 413s once the read exceeds the new `MAX_UPLOAD_BYTES` setting (25MB default).
- `put_uploaded_document` sanitized a browser-uploaded filename with the same
  segment sanitizer used for trusted ids, which allowed `/` and `..` through. Filenames
  now go through a dedicated `_safe_filename` that strips path separators.
- `createProjectFromMessage` didn't clear a previous run's `error` before starting, and
  still kicked off the first Distill turn even when an attachment upload failed -
  inconsistent with the landing page's own "any error blocks navigation" rule, and could
  leave a running project the user was never navigated to. It now clears `error` up
  front and skips the first turn entirely when an upload fails.
- Reverted an unrelated, ungrammatical sentence accidentally inserted into Review's
  system prompt (`src/config/agents/review.yaml`).

- `resolve_and_merge`'s merge step used GitHub's synchronous `PUT .../pulls/{n}/merge`,
  which GitHub refuses outright for a stacked pull request ("Merging stacked PRs via this
  endpoint is not supported. Use the asynchronous merge endpoint instead.") - a live G3
  approval failed closed on exactly that message for two stacked builds, even after the
  TLS fix below let the call reach GitHub at all. `merge_pull_request` now always calls
  `PUT .../pulls/{n}/merge-async` instead (GitHub's own docs: "required for stacked PRs,
  but also supports unstacked PRs", picking whichever merge action is appropriate on its
  own) and polls `GET .../merge-async/{uuid}` until GitHub reports the job merged or
  failed, rather than detecting stacking itself. See docs/decisions.md.

- `providers/github/merge.py` and `providers/github/pull_requests.py` built their
  `httpx.Client` without `verify=truststore.SSLContext(...)`, unlike every other outbound
  GitHub call in this repo - so under this network's TLS-inspecting proxy every one of
  their calls failed `CERTIFICATE_VERIFY_FAILED: unable to get local issuer certificate`
  (certifi's bundled CA list has no entry for the proxy's re-signed root; the OS trust
  store does). A live G3 approval failed closed on it: "could not merge every build: PR
  #21: could not reach GitHub; PR #22: could not reach GitHub" for both builds, every
  time, and the build cards showed "status unavailable" - not a real conflict, and no
  decision was recorded either time (by design), but it still meant re-signing by hand
  and, before this fix, would have kept failing forever. Now both modules use the same
  `truststore` pattern as `providers/github/files.py`/`api/auth.py`. Every GitHub call in
  `resolve_and_merge` also now retries twice more, a fifth of a second apart, on a
  dropped connection - genuinely transient blips still happen independently of this. See
  docs/decisions.md.

- The build pull request card (`BuildBoard`) said "Copilot is writing the code" for a
  still-draft pull request even after Review had already finished assessing it and handed
  off to the G3 gate - true to GitHub's `draft` flag (Copilot rarely flips it itself) but
  misleading once the actual work is done and a human is the one being waited on. Now
  reads "in draft · ready for your sign-off" once Review has handed off
  (`reviewComplete` prop, `ui/console/src/components/thread/BuildBoard.tsx`).

- The build pull request card (`BuildBoard`) used to disappear the instant Review handed
  off, because it only rendered while `project.station` was still exactly `"review"` -
  the same moment the console moves to the G3 gate to ask the human to sign off on that
  handoff. Now stays up through `showroom_approval` too (`ui/console/src/components/
  thread/Thread.tsx`), so build/Copilot status is visible for the decision it is meant to
  inform, not gone by the time it's needed.

- `get_file_contents_batch`, a new tool shared by Blueprint and Review, fetches several
  files from a repo concurrently in one call. Strands does run every tool the model asks
  for in one turn concurrently, but the model still has to request each single-file
  `get_file_contents` call one at a time - so N files still cost N sequential model round
  trips; this collapses a brownfield scan or PR-grounding read of several files down to
  one round trip. Not an MCP tool - implemented as a direct GitHub REST client
  (`providers/github/files.py`) since the remote MCP server has no batch equivalent.
  Both agents' system prompts now prefer it once more than one path is known. See
  docs/decisions.md.

- Distill no longer performs broad external searches or an opening planning-tool round
  when the input contains no explicit source identifier. This avoids unnecessary model
  calls, remote Jira/Confluence fan-out, and oversized retrieval results.

- Gate 3, the grade sheet sign-off, between Film Room and Gameday. Review files issues,
  assigns them to Copilot's coding agent and opens pull requests automatically, and two
  comments justified that by pointing at a "G3 human sign-off gate" that did not exist -
  the station they named, `REVIEW_APPROVAL`, runs *before* Review and so could never have
  reviewed its output. The station taking the most irreversible action was the only one
  with nothing after it. The line is now eight stations. See docs/decisions.md.
- Bedrock prompt caching on the system prompt and the tool schema. Every invocation
  starts from an empty message list, so both were re-sent in full on every turn - and a
  station is invoked repeatedly within one project (redraft after a gap, answers to its
  questions, a look at a finished build). Distill's and Blueprint's prompts are ~1,900
  tokens before the tool schemas, well over the minimum cacheable prefix. `strategy="auto"`
  resolves to Anthropic caching for Claude model ids and to no caching at all otherwise,
  so pointing an agent at a different model degrades instead of failing.
- The console watches the pull requests a coding agent is building. Review records each
  one in `ReviewReport.builds` (group, number, URL, the units it delivers and the issues
  it closes) plus the `repository` they live in, so the links are clickable the moment
  they exist instead of after the station finishes. `GET /projects/{id}/builds` reads
  GitHub directly - a poll should not cost a model turn - and returns each pull request's
  state and a single verdict for its checks, with `null` meaning "could not ask" rather
  than "failed". The thread polls it every 15s while anything is still moving, and once
  everything has settled it sends one follow-up turn so the station says what happened
  and what still needs a decision, in the thread, rather than leaving a status chip to be
  noticed. An unfinished check outranks a failed one, so a red mid-run build is never
  announced as broken. Nothing here can merge.
- `plan_delivery` groups a blueprint's units of work into the pull requests that can
  actually be built side by side. A coding-agent session branches from one ref, so two
  units that write the same file produce two pull requests that each rewrite it and
  cannot both be merged - which is exactly what happened on a real four-unit blueprint:
  four sessions, four branches off the default branch, four incompatible definitions of
  one schema. Units sharing a file are now collapsed into one group - one branch, one
  pull request, several issues closed - and groups that merely depend on each other
  chain through `base_ref` instead, starting from the predecessor's branch. Available to
  Blueprint, which files its issues in group order and records the grouping on each one,
  and to Review, which does the hand-off. Review also gains `list_pull_requests` (to find
  a predecessor's branch) and `add_issue_comment` (to record which pull request covers
  which issue). Merging is still nobody's job but a human's.
- The thread streams the artifact as it is written, and reports what the turn cost.
  Strands delivers structured output as a forced call to a tool named after the output
  model, so a station's document is produced as that tool's accumulating input rather
  than as free text - and `agent_runtime.factory` announced that call once and discarded
  every delta after it. The longest phase of every run therefore emitted a spinner and
  nothing else, then the whole document at once. Each delta's unsent tail now goes out as
  a `draft` event and renders live under the working agent. That tool's own "done" event
  is dropped, since its result is a validation acknowledgement that only duplicated the
  artifact card. `usage` carries the turn's input/output/total tokens, accumulated across
  every model call the agent made rather than just the one that produced the artifact,
  and shows beside the agent's name.
- The plan is pinned above the composer instead of scrolling past inside the thread,
  since it is the state of the run rather than something the agent said. It opens when a
  turn starts and folds to a one-line summary when the turn ends or a question needs
  answering first - at that point the question is the action and the plan is context.

### Changed

- MCP tool results are clipped at 60,000 characters, with a note saying how much was
  dropped and to ask for a narrower slice. Nothing between the server and the message
  list capped a single read, so a repository tree or a code search over a large repo
  answered with the whole thing - one tool call deciding how much of the context window
  the rest of the turn gets. `BoundedMCPClient` already bounded tool calls in time; it
  now bounds them in size.
- Blueprint's `max_tokens` drops from 32,768 to 16,384. Output is generated serially at
  ~85 tokens/second, so the ceiling is a time budget, and Distill grew 11.5k -> 16.2k
  output tokens on an unchanged prompt purely from having its own raised - the ceiling
  drives length as much as the need does. Truncation is not silent if 16,384 turns out
  to be too low: `MaxTokensReachedException` already surfaces as its own error.
- The prompt carries its own cache boundary. Bedrock places a cache point at the end of
  the last user message, which put the predecessor artifacts inside a prefix rewritten on
  every call - so a redraft wrote a new cache entry and never read one. The payload now
  splits into `grounding` (settled upstream artifacts) and `prompt` (this turn's
  instruction) with a cache point between them, and grounding JSON is serialized without
  `indent=2`. Showroom carries three upstream artifacts and gains the most; Distill has no
  predecessors and is unaffected. See docs/decisions.md.
- Tool calls and the reasoning disclosure lost their frames: no border, no fill, no
  "done" label, and a caret that only appears on hover. A trace of what the agent did
  should not compete with the reply it sits under.
- Agent prose renders through `react-markdown` instead of a hand-written parser, so links,
  ordered lists, tables, fenced code and nested lists all work rather than arriving as
  literal `##` and `1.`. A `components` map binds every element to the console's own
  tokens and type scale, and `img` renders nothing - a station should not be pulling remote
  images into the thread.
- Every agent's prompt now lets a turn with no real work - a bare greeting, a single reply
  with nothing to draft, look up or ask - skip `track_plan` and respond directly. It was
  unconditional, so a trivial turn paid for a full extra model round trip just to declare
  a plan nobody needed. See docs/decisions.md.
- `completeness` on every output contract (`StructuredSpec`, `Blueprint`, `ReviewReport`,
  `DemoPackage`) now defaults instead of being required. `score` and `gaps` are always
  recomputed server-side from the stored artifact and overwrite whatever the agent
  claimed, so it was a required field the model's own value for was thrown away - and on
  a trivial turn the model frequently omitted it anyway, which Strands' structured-output
  tool treats as a validation failure and sends back for a full extra model call to fix.
  Measured on Distill: a bare "hi" cost up to three model calls (two of them
  `StructuredSpec` retries) before this change, two after. See docs/decisions.md.

### Fixed

- The Copilot hand-off spun forever in the thread. A tool call is announced as running
  when its first `current_tool_use` delta arrives and only closed by the
  `AfterToolCallEvent` hook, so a call that times out inside the MCP layer - which
  `create_pull_request_with_copilot` reliably does - never closed. The console persists a
  turn's tool calls, so the spinner outlived the turn that started it, and the run read as
  hung when it had finished. Any call still open when the generator ends now gets a
  `"status": "interrupted"` event, on the failure paths as well as the success one, and a
  finished turn renders a leftover running chip as interrupted so older transcripts heal
  too.
- Review waited on Copilot instead of handing off to it. Its prompt told it to read check
  runs before grading, which for a pull request Copilot had not started writing yet meant
  polling out the rest of the turn. It now finishes once the pull requests are open and
  says so; the console's own 15-second build poll sends it a fresh turn when they settle,
  which is when the check runs are worth reading. The build board now names who is working
  ("Copilot is writing the code"), says the wait is minutes and that the station picks the
  thread back up, and links the issues each pull request closes.
- A finished tool call sat in the thread as still running until the model spoke again.
  Finished calls are drained on the next stream event, and a turn waiting on the model
  produces no stream events at all - so during exactly the silence someone is staring at,
  the trace showed stale spinners and the plan panel showed stale steps. The heartbeat
  now drains before it reports the wait.
- Five `track_plan` calls in a row before any real work. All four prompts said to call it
  "as each one finishes", with nothing saying to call it once up front - so a run opened
  with the agent restating a plan it had not acted on yet, five model round trips and
  roughly seventeen seconds before its first real lookup. Each of those round trips
  re-sends the whole conversation, so on a turn that reported 533k accumulated tokens they
  were about a quarter of the bill. The instruction now says once, then only on a step
  that actually finished - and to send that update in the same response as the next real
  tool call. Strands executes every tool call in one response together
  (`ConcurrentToolExecutor` takes a list), so a plan update that rides along with real
  work costs nothing, while one sent alone costs a whole round trip.
- Every tool call logged an OpenTelemetry `Failed to detach context` traceback. Strands
  holds a span attached across the `yield`s in its tool loop, so the span is attached on
  one step of its stream and detached on the next. The new heartbeat drove those steps
  through `asyncio.ensure_future`, which copies the current context per task - so each
  step ran under a different copy and the detach was rejected. All steps now share one
  context. The stub agent in the unit tests holds a token across its own yields the same
  way, so twelve tests fail if this regresses.
- Blueprint and Review could ground themselves in a stranger's code. `search_code` runs
  against every public repository on GitHub unless the query carries `repo:owner/repo`,
  and neither prompt said so - a design or a review finding could be shaped by a file from
  a repository nobody involved had ever seen, with nothing on the surface to show it. Both
  prompts now scope the search, and both ask for only the result `fields` they use:
  `text_matches` and `repository` are the bulk of every hit and were being carried on
  every one of them. See docs/decisions.md.
- A finished plan sat one step short of done. The agent's final step is writing the
  artifact itself, so it never gets a turn in which to report that step complete, and the
  last step spun forever on a run that had actually succeeded. A settled turn now closes
  out whatever it left open.
- Review would not build. Its prompt framed the turn as judging an existing build and
  offered "review the plan alone and say so plainly" when there wasn't one - so on a
  greenfield project, which the same prompt calls the normal case, it wrote a grade sheet
  titled "No Build Provided to Review Yet" and stopped. Getting the approved blueprint
  built is now stated as the first of its two jobs rather than a conditional aside fifty
  lines further down, and "no build yet" routes to building it.
- A station could wedge itself permanently. No MCP tool call had a timeout anywhere in the
  stack - Strands builds every tool with `timeout=None` and its session inherits none - so
  one unanswered request blocked its turn forever, and because the agent instance is shared
  across invocations, every later run of that station failed too until the container
  restarted. Observed on an eighteen-file fan-out. MCP tools now give up after 60s, and a
  whole turn after 600s.

- Review findings on #14. `score_completeness` counted duplicate requirement and gate
  criterion ids in its denominator while measuring coverage as a set, so a spec that
  repeated an id scored lower in the loop than at the gate that overrules it. The
  inspector kept one `EvidenceLink` per requirement, which is now actively wrong: the G1
  gate reasons about the *set* of a requirement's sources, so showing only the last one
  hid why it scored. The question card counted picks made against questions that were no
  longer being asked, which could enable "Send" with nothing selected on the new set.
  `GET /builds` re-raised a `ValidationError` from a stored artifact the contract had
  outgrown, turning a 15-second poll into a 500 - it now degrades to "no builds", the
  same rule `core.validation.artifacts` already applies. The GitHub poll created an
  `httpx.Client` per call and never closed it, and raised if a response body was not
  JSON. `free_dev_ports.sh` did nothing at all without `lsof` and reported success.
- A build whose pull request reported no checks never settled, so the console polled
  forever and the station never spoke. "No CI configured" and "CI has not started yet"
  are indistinguishable over the API, so a non-draft pull request reporting no checks is
  now settled once it has said so for two minutes, and the card says "no checks reported"
  rather than showing a spinner.
- A finished artifact still carried the questions that were asked on the way to it, so
  the prompt above the composer stayed up over a spec the gate had already scored at
  100%, asking about things the answers could no longer change. `evaluate_artifact` now
  drops questions once an artifact is complete, and the card also clears the questions it
  just sent rather than waiting for the next artifact to replace them.
- The plan was buried in the tool list. `track_plan` is called once per step, so a turn
  showed four near-identical `track_plan` rows and the real tool calls scrolled past them.
  The latest plan now renders as a todo list that updates in place, above the tool calls;
  the superseded snapshots are dropped. `track_plan` echoes its steps back in its result
  so the console can render them - a tool call's input never reaches the browser.
- Signing a gate made the gate form flash back before the line advanced. The undo banner
  cleared the moment the countdown expired, but the project only leaves the gate station
  once the backend has recorded the decision - for the length of that round trip the
  station was still the gate, so the console re-rendered the form the user had just
  signed. The banner now stays up, without a countdown or an undo button, until the
  decision commits, and comes back to the form if the request fails.
- The agent's narrative was thrown away the moment its artifact arrived. The console
  replaced the streaming turn with a fresh one carrying only the structured content, so
  everything the agent said while working - which table it could not reach, which source
  it fell back to - disappeared and was replaced by a summary composed from the artifact,
  which by construction cannot mention what is missing from it. The finished turn now
  keeps the narrative behind a "Reasoning" disclosure next to the tool calls.
- Read-only tools were gated on being asked, so agents skipped lookups that would have
  grounded their work. Distill never called `snowflake_query` on an FSD saying "pull the
  tier definitions from the PROMO_TIER table", because both the prompt and the tool's own
  docstring said to use it when Snowflake was the input *instead of* a document. The same
  phrasing gated the S3 reference-FSD lookup and, until this week, Blueprint's repository
  scan. Every read-only tool across the four agents now says the opposite: look whenever
  the input names something you can go and check, including in passing. Writes -
  `create_repository`, `push_files`, `jira_create_issue`, `issue_write`,
  `assign_copilot_to_issue` - still wait to be asked, since they land before the human
  gate that authorizes them.
- Ctrl-C out of `make dev-all` left listeners behind. `uv` and `pnpm` spawn the real
  process as a child, and uvicorn's `--reload` supervisor respawns its worker when only
  the worker is signalled, so a single round of SIGTERM to the process groups was not
  enough - one console API process here needed SIGKILL. Cleanup now waits for the groups
  to exit, escalates to SIGKILL, and then sweeps the ports themselves via the new
  `scripts/free_dev_ports.sh`; `dev_all.sh` also sweeps *before* starting, since a
  leftover listener means the new server cannot bind and the console silently keeps
  talking to an agent running the previous checkout's prompts and schema. `make dev-stop`
  clears the ports by hand.
- `score_review_completeness` reported "no approved spec, Blueprint, or description of
  the built deliverable was provided" for three different situations at once. A missing
  spec means the line is broken upstream; a missing *build* is the normal state of a
  greenfield project that has only been planned. It now takes a `build_reference` and
  reports them separately, and `review.yaml` tells the agent to ask which the human wants
  - a repository/PR to check, or an explicitly labeled review of the plan alone - rather
  than producing findings about code it was never shown.
- Four Distill tools were written and unit-tested but never attached to the agent:
  `detect_fsd_template`, `score_template_coverage`, `extract_field_rules` and
  `validate_rule_correlations`. `distill.yaml` instructed the agent to call the last of
  these, which it could not - and the first three meant the deterministic FSD-template
  path never ran at all, so a real UA FSD was extracted by the model as free prose. All
  four are now wired, with the prompt describing the template path.
- `ProjectNamer` reused one Strands `Agent` for the whole server process without ever
  clearing its history, so every project named in that process stayed in the naming
  model's context - each call slower, more expensive, and shown every previously named
  project. Now reset per call, matching `agent_runtime.factory`, which already did this
  for the same reason. The shared instance is also guarded by a lock: naming runs in
  FastAPI's background-task threadpool, and Strands raises `ConcurrencyException` on a
  second concurrent call to one instance, which the heuristic fallback silently swallowed
  as a worse project name.

### Added

- `EvidenceLink` carries a `source`: `source_document`, `stakeholder_answer` or
  `reference_material`. At G1 sign-off these are not interchangeable - a line in the
  submitted document can be re-read, an answer given in the console is only as good as who
  gave it, and reference material is a *different* project's document. The G1 gate flags a
  requirement whose only citation is reference material, since Distill reads past FSDs for
  grounding and one of them is never the reason this project needs something. The console
  labels each citation accordingly.
- Open questions are answered where the answer gets typed: an interactive prompt sits
  directly above the composer, with options as toggleable chips that compose into one
  message. They are deliberately not in the artifact panel, which can be closed - that
  would leave a project held at its station with no visible reason why.
- An intake turn - a station that asked questions rather than drafting a document - is
  still persisted, since it is the record of the turn and the next turn is grounded in it,
  but it no longer poses as a document: no artifact card in the thread, no slot in the
  inspector, and a reply that says what it actually did instead of claiming a first draft.
  The predicate is "has content", not "has questions", so a partial draft with open
  questions still shows normally.
- The console renders an artifact as a card in the thread - title, kind and what it
  actually contains - which opens the inspector, now with tabs (**Design** for a
  blueprint, **Requirements**, **JSON**) and an expand control that widens the panel from
  a sidebar to roughly half the window.
- **Design** draws the blueprint's component graph as SVG, derived entirely from the
  stored artifact: `components` are nodes, unit-level `depends_on` edges lifted to the
  components those units build are the arrows, laid out by longest-path depth. It is a
  pure function of the artifact, so it cannot show a shape the plan does not have, and
  falls back to the list view past twelve components rather than drawing a hairball.

- Stations can ask before they guess. `CompletenessScore` gains `questions`
  (`OpenQuestion`: text, optional concrete `options`, `multi_select`), shared by all four
  agents. Distill now opens with questions rather than inventing a spec from a one-line
  request - the plan doc's "it plans and asks before it drafts" - and the console renders
  an intake turn as question cards instead of a 0% scorecard. Unlike `score` and `gaps`,
  which the gate computes and overwrites, questions are the agent's own judgment and are
  carried through - but bounded: duplicates dropped, malformed ones dropped, at most four
  per turn, and a turn that drafts nothing and asks nothing is itself a gap.
- `tools/planning.py`: `track_plan`, the one tool every station shares. Each agent calls
  it first with the steps it intends to take and again as each finishes, which keeps a
  long turn from drifting and shows the human what the agent is actually doing. Stateless
  by design - the whole plan is passed every call, since an invocation is a clean slate
  and a module-level store would leak one project's plan into the next run.

- Blueprint now produces a design, not a paragraph about one. `Blueprint` gains
  `components` (named parts with a single responsibility), `data_entities` (each owned
  by a component, each with typed `fields`) and `integration_points` (external system,
  direction, and the requirements needing that boundary); `UnitOfWork` gains
  `component_ids`. The G2 gate scores components and integration coverage alongside
  requirements, acceptance criteria and contracts, and flags a blueprint that names no
  components at all. Every requirement the spec classified as an `integration` must be
  covered by an integration point - which is the first thing that makes G1's intent
  classification do real work downstream instead of being restated.
- Blueprint reads the repository before drafting. `search_repositories`,
  `get_repository_tree`, `search_code` and `get_file_contents` are now used proactively
  on every run rather than only when asked, matching the posture Distill already has for
  historical FSDs and Review has for code. Writing to GitHub (`create_repository`,
  `push_files`, `issue_write`) still requires an explicit request: it is irreversible and
  it would land before the G2 sign-off that authorizes the plan.
- The G2 artifact is now a self-contained build contract, so a unit of work can be
  handed to any coding agent that has no access to the conversation that produced it.
  `UnitOfWork` gains `files` (the paths it touches, each with an add/modify/delete
  `change` and a `purpose`) and `contract_ids`; `Blueprint` gains `api_contracts`
  (`ApiContract`: method, path, summary, request/response schema, and the requirement
  ids it serves). Modeled as an endpoint list rather than an embedded OpenAPI document -
  it is checkable with plain Pydantic, generates a spec, and needs no parser dependency.
  The G2 gate scores contracts as coverable units alongside requirements and acceptance
  criteria, and flags a unit that names no files as not actionable.
- `core/validation/`: a deterministic gate that scores each station's *persisted*
  artifact against its predecessors, instead of trusting the `completeness` the model
  reported about itself. The `@tool` validators under `tools/` take id lists chosen by
  the same model they check, so they can only ever be advisory; `evaluate_artifact`
  takes the real artifacts, and `api/routers/projects.py` overwrites `completeness`
  with its verdict before deciding whether a station advances. Covers all four
  stations: spec self-consistency (G1), requirement/acceptance-criterion coverage and
  dependency-DAG soundness (G2), coverage-view completeness and assignment consistency
  (G3), and talk-track coverage (G4).
- `UnitOfWork` now carries `requirement_ids` and `acceptance_criterion_ids` - the
  traceability edges back to the approved spec. Without them stored on the artifact,
  G2 coverage was unverifiable in principle: nothing recorded which requirement a unit
  addressed, so the score was whatever the model asserted. The console UI's
  `BlueprintView` renders them per unit.
- `AgentConfig.temperature`, unset by default and passed to `BedrockModel` only when a
  config actually sets it. Bedrock rejects the parameter outright on newer Anthropic
  models (`ValidationException: `temperature` is deprecated for this model`), so it
  cannot be defaulted - determinism for these agents comes from the artifact gate
  redrafting until gaps close, not from sampling controls.

### Changed

- The question card and the artifact panel's "questions are waiting" notice sat on the
  accent surface, which reads as an alert next to the gate and the hazard stripe - the
  loud surfaces are reserved for a decision that stops the line. Both now use the neutral
  theme surface, so they follow light/dark/system like the rest of the thread.
- `score_review_completeness` and `score_showroom_completeness` returned `1.0` for any
  non-empty input - a "did I get input?" boolean wearing a score's clothes. Both now
  take the ids they actually covered and return a real coverage fraction with a gap per
  uncovered requirement. A requirement Review marks `met=False` still counts as
  reviewed: reporting that the build misses it is a complete verdict, not a gap.
- A retry after an open gap is now grounded in the agent's own previous draft.
  `agent.messages` is reset on every invocation (so one project's history cannot leak
  into another's), which meant a "close this gap" turn redrafted from scratch instead
  of patching - maximum churn on exactly the path that needs stability.
- Showroom now receives the Blueprint and the ReviewReport as predecessor artifacts,
  not just the spec. It was being asked to demo work that cleared Review while having
  no way to see what Review said.
- `StructuredSpec` (G1) now carries the business context Blueprint needs to plan
  technical work, not just requirement text: `BusinessValue` (use case + ROI, one
  step up from a requirement - why it exists), `AcceptanceCriterion` (a testable
  definition of done per requirement, distinct from the G1 `gate_criteria` that score
  the spec itself), `RequirementIntent` (functional/non_functional/integration/
  reporting/compliance/data_migration classification, one per requirement), and
  `RuleCorrelation` (how two or more machine-readable rules depend on or constrain
  each other - `MachineReadableRule` now has its own `id` so correlations can
  reference it). Distill's prompt extracts all four from the source FSD (an EDM
  FSD's "User Story" and "Value Add"/"Success Criteria" sections are the usual
  source); `validate_structured_spec`, the new `validate_rule_correlations`, and
  `score_completeness` in `tools/distill.py` validate and score them alongside the
  existing fields. Blueprint's prompt now uses intent to size/sequence units of work,
  folds acceptance criteria into unit descriptions as the definition of done, uses
  business value to justify sequencing and write an intent-driven architecture
  summary, and keeps correlated rules' units from being split apart. The console
  UI's `SpecView` renders all of this (intent badge per requirement, use case/ROI,
  acceptance criteria checklist, rule correlations section). See docs/decisions.md.
- `infra/stacks/storage_stack.py`: DynamoDB table and a dedicated, versioned, CDK-managed
  S3 documents bucket now live in their own stack, injected into
  `OrchestrationStack`/`ConsoleApiStack` as cross-stack references. Read access for the
  AgentCore Runtime execution role is granted via an S3 bucket policy (not an IAM identity
  policy - `AWSPowerUserAccess` excludes `iam:*`), scoped to the `documents/` and `fsds/`
  prefixes (Distill's inputs and its historical-FSD reference lookups, respectively).
- `infra/stacks/naming.py`: single source of truth for the AWS region (`us-east-1`) and
  env-suffixed resource naming (`resource_name(env, resource)`), driven by CDK context
  (`-c env=`, default `dev`).
- `gsi2-all-projects-by-updated` GSI on the projects table - `list_projects` is now a
  single-partition Query instead of a full table Scan.
- Artifact versioning: `save_artifact` writes an immutable `ARTIFACT_VERSION#<agent>#v<NNNN>`
  history item alongside the latest `ARTIFACT#<agent>` alias. New
  `ProjectRepository.list_artifact_versions`.
- Review can hand its own blocker/major findings off to GitHub Copilot's coding agent
  (`assign_copilot_to_issue`, validated by `validate_copilot_assignments`),
  automatically whenever GitHub tools and a repository reference are available - same
  GitHub connector as Blueprint's, now living on Review instead of a dedicated Handoff
  agent. Assignments render in the console UI's `ReviewView` as a "Copilot assignments"
  section with an assigned/failed badge and a clickable link to the actual GitHub
  issue. See docs/decisions.md.
- Blueprint's GitHub connector (`tools/github.py`, `mcp_clients/github.py`, gated on
  `GITHUB_PAT`): repo scaffolding and one issue per unit of work, via GitHub's official
  remote MCP server (`api.githubcopilot.com`) - no local binary/Docker to run. Curated
  tool allow-list deliberately excludes merge/delete - see docs/decisions.md.
- `GET /projects` (list every project, most recently updated first) and
  `ProjectRepository.list_projects()`, backing a new `/portfolio` route in the console UI -
  a dashboard of every project's station, progress and last-updated time, reachable from a
  new icon in the top bar.
- `AGENTS.md` as the single source of truth for repository conventions, with
  `.github/copilot-instructions.md` and path-scoped `.github/instructions/*` pointing at it.
- Semantic search over historical FSDs: `providers/storage/embeddings.py` (Bedrock Titan
  Text Embeddings V2), a new `s3_find_similar_reference_documents` tool ranking FSDs by
  similarity to a plain-language query against a precomputed index, and
  `scripts/build_fsd_index.py` (`make build-fsd-index`) to build/refresh that index. See
  docs/decisions.md.

### Changed

- `src/config/agents/distill.yaml`: Scout now always calls `s3_list_reference_documents`
  before writing a new `StructuredSpec`, and skims any plausibly related historical FSD -
  previously this only happened when a request explicitly asked to reference a past FSD.
  It now also prefers `s3_find_similar_reference_documents` for this, falling back to
  `s3_list_reference_documents` only if the semantic index is empty/stale.
- `sync-docs` skill: a documentation review that runs as a step of every change.
- `scripts/precheck.sh` - one red/green gate for format, lint, types, tests, infra, secret
  scanning and spelling. CI runs the same script, so local and CI cannot drift.
- `make check`, `make check-fix`, `make format`, `make typecheck`, `make coverage`,
  `make hooks`.
- `ProjectRepository.save_artifact` looks up the latest existing version with a single
  reverse-order, `Limit=1` Query instead of reading every version item and taking the max -
  an O(1) targeted read instead of O(n) in the number of existing versions.
- `cspell.json` spelling gate, whose `flagWords` list also enforces US English by failing
  British spellings with the American form as the suggested fix.
- Pre-commit hooks: ruff, ruff-format, gitleaks, cspell, and the standard file hygiene set.
- `pyright` in strict mode, and `pytest-cov` with coverage reported in CI.
- Tests for `agent_runtime.factory` (previously untested despite backing all four agents),
  `Settings`, and the observability setup.
- `tests/unit/test_docs_consistency.py` - fails the build when `.env.example` drifts from
  `Settings`, or when an agent lacks a config file or a runtime entrypoint.
- `tests/conftest.py` and `tests/fakes.py`: shared typed test doubles and an autouse
  fixture that clears the `get_settings` cache between tests.
- `core/constants.py` (`AgentName`) and `infrastructure/repositories/keys.py` (single-table
  key layout), replacing literals duplicated across modules.
- `CONTRIBUTING.md`, `SECURITY.md`, this changelog, `.editorconfig` and shared VS Code
  settings.
- `ui/console/`: a React + Vite + TypeScript console UI - the real client for the console
  API. Landing-page chatbox that names a new project via Claude Haiku
  (`orchestration/project_namer.py`); sidebar with search, inline rename, delete; a
  pipeline stepper showing D/B/R/S progress with an amber pulse while a gate decision is
  pending; live SSE-streamed agent turns (tool-use chunks, not just the final result);
  gate-decision approval; a global error toast.
- Entra ID (Azure AD) SSO, gating every `/projects/*` route: `api/auth.py` validates the
  bearer ID token's signature/audience/issuer against Entra's JWKS
  (`entra_tenant_id`/`entra_client_id` `Settings` fields); the console UI signs in via
  MSAL (`@azure/msal-browser`/`@azure/msal-react`) against the same app registration and
  attaches the token to every request, including the `/advance/stream` SSE POST.
- `truststore` dependency: `api/auth.py`'s JWKS fetch now verifies against the OS trust
  store, so token validation works behind TLS-inspecting corporate networks where certifi
  does not carry the intercepting root CA.
- `PATCH /projects/{id}` (rename) and `DELETE /projects/{id}` (delete, cascading to
  artifacts and decision history) endpoints, plus `ProjectRepository.rename_project`/
  `delete_project`.
- `POST /projects/{id}/advance/stream`: SSE variant of `advance_project` that streams
  the agent's output as it's produced (`orchestration/local_agent_client.py`'s `stream`,
  `agent_runtime/factory.py`'s `agent_invocation` as an async generator) instead of
  blocking until the whole turn finishes.
- Sixteen vendored third-party skills under `.github/skills/`: six frontend design skills
  from `leonxlnx/taste-skill`, all nine product-design skills from `jamiemill/layers-skills`,
  and the prose half of `pbakaus/impeccable`. Provenance, upstream commits, licenses and
  the modifications made are recorded in `.github/skills/THIRD_PARTY_NOTICES.md`.
- `core.domain.project.CompletenessScore` (moved from `core.domain.spec`) is now a field
  on `Blueprint`, `ReviewReport` and `DemoPackage` too, not just `StructuredSpec` - every
  station can report `gaps` when its required upstream input (approved spec content, a
  Jira reference, a description of the build) was not actually given, instead of
  fabricating a plausible-looking artifact. `tools.blueprint.score_blueprint_completeness`,
  `tools.review.score_review_completeness` and `tools.showroom.score_showroom_completeness`
  are the deterministic scorers each agent calls before finalizing, mirroring
  `tools.distill.score_completeness`. `_has_open_gaps` (`api/routers/projects.py`) already
  read this field generically, so Blueprint/Review/Showroom now hold at their own chat
  instead of showing the next sign-off gate whenever they are blocked.
- `tools.distill.validate_structured_spec`: Distill's referential-integrity check (the
  other three agents already each had one), catching a duplicate requirement/gate
  criterion id, a rule referencing an unknown gate criterion, or an evidence link
  referencing an unknown requirement - Distill now calls it before `score_completeness`
  the same way Blueprint/Review/Showroom call their own `validate_*` tool first.
- Distill's system prompt now covers the case where the prompt already gives discrete,
  itemized requirements directly instead of narrative FSD prose to extract them from -
  it uses each requirement's own stated text as its evidence rather than fabricating a
  citation to a source document that was never given.
- Tool-call streaming: `agent_runtime.factory`'s SSE stream now emits
  `{"tool_call": {"id", "name", "status", "result"}}` events (`status` is `"running"`
  when a call starts and `"done"` with its decoded result when it finishes, keyed by
  tool use id so a retried call gets its own pair) instead of a one-line "Using X..."
  text chunk announced once per tool name. `advance_project_stream` and
  `LocalAgentClient.stream` forward these through unchanged. Console UI: each streaming
  turn shows its tool calls live - greyed out with a spinner while running, then a
  minimized row a reader can expand to see the raw result, so the chat reply itself
  stays uncluttered.
- `snowflake_query` tool for Distill (`tools/snowflake.py`, `providers/storage/snowflake.py`):
  when a prompt references Snowflake data instead of raw FSD text, Distill asks Snowflake's
  own hosted Cortex Agent (`/api/v2/cortex/agent:run`, `code_toolset_all`) a plain-language
  question and mines the returned text for requirements. This repo carries no SQL-building,
  result-polling or table-discovery logic of its own - the Cortex Agent decides what to run
  and returns the answer as text. Configured via `SNOWFLAKE_ACCOUNT` and `SNOWFLAKE_PAT`
  (PAT auth); `SNOWFLAKE_DATABASE`/`SNOWFLAKE_SCHEMA` are optional scoping hints, not
  requirements - left unset, the agent explores the whole account on its own. See
  `docs/decisions.md` for why this replaced an earlier hand-built SQL REST API tool.

### Changed

- Every AWS resource (state machine, DynamoDB, S3, both Lambdas, the console API) now
  lives in a single region, `us-east-1` - the prior `ap-southeast-2` orchestration /
  `us-east-1` Bedrock split is gone. `Settings.orchestration_region` is removed;
  `aws_region` covers every AWS call. See docs/decisions.md.
- Console UI: approving a gate now fires the next station's agent automatically
  (`useProjectsStore.decide`), instead of leaving the project sitting at the new station
  until someone happened to type into its composer - matches what the state machine does
  on its own once deployed (`docs/console-redesign.md`: "when a decision commits, the
  line visibly advances and the next agent takes the station").
- `ui/console/` rebuilt against the audit in
  [docs/console-redesign.md](docs/console-redesign.md):
  - **Theming**: a semantic token layer (surface / fg / line / accent / status / agent)
    replaces the eight raw brand colors, with light as the default and dark as an authored
    sibling palette. Resolves the `body`-is-dark / `App`-is-light conflict that caused most
    contrast failures. Both themes verified in-browser at 0 failures against WCAG AA.
  - **Type**: self-hosted Geist + Geist Mono replace the render-blocking Google Fonts
    `<link>` to Inter. Fixed rem scale, 12px floor (was 9px).
  - **Shell**: the delivery line is now the primary navigation object in a persistent top
    bar, the signed-in user moved to the top right with a theme switcher, projects are
    grouped by **Needs you** / Active / Done, and `⌘K` opens a command palette. Panels
    collapse, and the reading column holds its measure on a 13" laptop.
  - **Gates**: the gate shows the criteria being signed against and the open gaps, takes
    the signer from the Entra ID token instead of a free-text field, requires a reason when
    sending work back, and keeps every decision undoable for 12 seconds. A cleared gate is
    now the strongest element in the thread rather than the quietest.
  - **Artifacts**: typed renderers per agent - spec, plan, findings sorted by severity with
    coverage, and demo package - replacing one generic field walk for all four.
  - **Agents**: each of the four has an authored face and identity hue, and every turn is
    stamped with the agent that produced it. The conversation stays continuous.
  - **The crew**: the agents are now named for the job a person holds rather than for what
    the code does - `distill` is **Scout** (hands over a scouting report), `blueprint` is
    **Coach** (a call sheet), `review` is **Ref** (a grade sheet), `showroom` is **Host**
    (a run of show). The station is the place and the agent is the person working it, so
    the line reads Combine, Gate 1, Playbook, Gate 2, Film Room, Gameday, and a finished
    project is "off the line". Display layer only: the wire ids, `Station`, `AgentName` and
    the API contract are unchanged.
  - **Visual signature**: station numbering (`ST 01`) in mono, the Under Armour italic
    uppercase lockup on station and gate names, and a single hazard stripe on the gate
    header. Agent eyes blink only while that agent is working.
  - **Accessibility**: `prefers-reduced-motion` honored, `aria-live` on the streamed reply,
    `role="alert"` on errors, a single `:focus-visible` treatment, real `<label>`s on every
    input, `aria-current` on the selected project, and `window.confirm` replaced with a
    focus-trapped dialog.
  - **Resilience**: errors now diagnose, explain and offer recovery instead of surfacing raw
    API strings; runs can be stopped mid-stream and retried; streamed tokens are batched
    rather than rewriting the conversation map per token.
  - **Routing**: `/projects/:id` deep links replace in-memory selection, so a project
    awaiting a decision can be linked to the person who has to sign it.
- Ruff expanded from five rule families to the full set, including docstring and annotation
  enforcement, with `ruff format` now checked in CI.
- Every module, class and public function in `src/`, `ui/` and `infra/stacks/` now carries a
  Google-convention docstring.
- Injected AWS clients are typed with `boto3-stubs` instead of `Any`.
- `Station` order is derived from the enum rather than a parallel list that could disagree
  with it.
- Agent YAML is validated with `model_validate` instead of keyword unpacking.
- CI: least-privilege `permissions`, concurrency cancellation, infra tests included,
  a markdown coverage table rendered into the job summary, and `coverage.xml` uploaded as
  an artifact.
- `.env.example` now documents every `Settings` field, including the Phase 2 orchestration
  variables that were missing.
- `README.md` status and structure sections corrected - they still described the repository
  as having no control plane after Step Functions, the console API and the SDK had shipped.
- `README.md`/`docs/architecture.md` corrected again - they described the console as a
  future front end after `ui/console/` had already shipped, and didn't mention the new
  Entra ID auth layer at all.
- Console UI sidebar: merged the separate "needs a decision" section into the single
  project list as a gate badge (G1/G2), decluttered the double-signaling between badge
  color and a colored left border, and gave the selected row a distinct neutral
  indicator instead of relying on a faint background tint alone.
- `cspell.json` now excludes each vendored skill folder - `layers-skills` is written in
  British English and would otherwise fail the `flagWords` gate. The exclusions name each
  folder rather than `.github/skills/**`, so `log-decision` and `sync-docs` stay checked.

### Fixed

- Rejecting a gate ("Send back") recorded the comment in the audit trail but never
  actually sent the project back to the agent - `record_decision` left `station` set to
  the gate itself instead of the agent under review, so the reviewer's reason never
  reached the LLM. Added `prior_station()` and wired the console's auto-advance to fire
  on rejection too, feeding the comment back as the agent's next prompt.
- `advance_project`/`advance_project_stream` (the local-dev orchestration bypass) never
  handed a station's predecessor artifact to the next agent - only a short instruction
  like "Blueprint may begin.", so Blueprint/Review/Showroom always opened with no spec to
  work from and correctly reported themselves blocked. `_build_prompt` now prepends each
  station's named predecessor artifacts (e.g. Blueprint gets Distill's `StructuredSpec`,
  Review gets both). The real state machine handoff (ADVA-3015) still needs the same fix.
- Settings leaked between tests through the `get_settings` `lru_cache`.
- `starlette` 1.6 deprecates `httpx` in its test client; added the `httpx2` dev dependency
  it expects.
- `advance_project_stream`'s exception handling only wrapped the agent-stream loop, not
  the subsequent artifact-save/station-advance calls - an exception there (e.g. an
  expired AWS session) crashed the SSE generator uncaught after the response had already
  started streaming, so the client saw a raw connection failure instead of a clean
  `{"error": ...}` event.
- Console UI chat turns were matched by object reference (`t === streamingTurn`) for
  streaming-placeholder replacement and retry cleanup; `appendChunk` replaces the turn
  with a new object on every chunk, so reference equality broke the moment one chunk had
  arrived before an error, leaving a permanently "stuck" partial bubble. `ChatTurn` now
  carries a stable `id`, used for both cleanup and React's list keys (was array index).
- `tools.distill.score_completeness` returned `{"score": 0.0, "gaps": []}` when no
  requirements or gate criteria were extracted at all - an empty `gaps` list reads as "no
  open gaps" to `_has_open_gaps`, so a blank/unreadable FSD advanced straight past G1
  instead of holding at Distill's chat. It now returns an explicit gap in that case.
- Tool-call streaming never reached "done": `agent_runtime.factory` read a
  `"tool_result"` key off `agent.stream_async()`'s events, but Strands' `ToolResultEvent`
  opts out of that stream entirely (`is_callback_event` is `False`) - it is never yielded
  there, only observable via the hooks system. Console UI showed every tool call stuck
  in its greyed-out "running" state forever. Now registers
  `agent.hooks.add_callback(AfterToolCallEvent, ...)` once per agent and drains the
  results it captures into the SSE stream instead.
- Live testing surfaced two Snowflake bugs from an incorrect assumed event schema and an
  undersized timeout: `providers.storage.snowflake.run_agent` parsed the Cortex Agent's
  SSE body as `{"delta": {"type": ...}}` per `data:` line, but the real framing is
  separate `event: <type>` / `data: {...}` line pairs (fixed by tracking the preceding
  `event:` line and only parsing `response.text` payloads), and a literal `data: [DONE]`
  sentinel isn't JSON at all and crashed `json.loads`. Separately,
  `orchestration.local_agent_client.LocalAgentClient`'s hardcoded `timeout=120` (proxying
  a local dev agent's `/invocations` call) was shorter than
  `providers.storage.snowflake`'s own 120s httpx timeout plus FastAPI/Strands overhead -
  a real single-table Cortex Agent query took ~117s end-to-end and tripped the local
  proxy's read timeout before the response could arrive. Both timeouts raised: the
  Snowflake provider's to 240s, the local proxy's to 300s.
