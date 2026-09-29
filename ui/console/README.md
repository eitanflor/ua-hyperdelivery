# Hyperdelivery Console

React + Vite + TypeScript console UI - the client for the console API (`src/api/`). See
the root [README.md](../../README.md) and [docs/architecture.md](../../docs/architecture.md)
for how this fits into the rest of the system, and
[docs/console-redesign.md](../../docs/console-redesign.md) for the audit this shell was
built from. The current audit, roadmap and design references are in
[docs/design/](../../docs/design/README.md).

## The crew

A stage is a step on the line; an agent is the teammate working it. The four agents keep
sports-staff names - Scout, Coach, Ref, Host - with a plain job title beside each, and
everything around them (stages, outputs, gates) says what it is. See
[docs/design/vocabulary.md](../../docs/design/vocabulary.md) for why.
**These are display names only** - the wire ids, the `Station` enum and the API contract
still say `distill`, `blueprint`, `review`, `showroom`. Everything user-facing lives in
[src/lib/pipeline.ts](src/lib/pipeline.ts).

| Wire id | Agent | Job title | Stage | Hands over |
|---|---|---|---|---|
| `distill` | **Scout** | Requirements analyst | 01 · Requirements | Requirements brief |
| `blueprint` | **Coach** | Build planner | 02 · Plan | Build plan |
| `review` | **Ref** | Quality reviewer | 03 · Build check | Quality report |
| `showroom` | **Host** | Demo producer | 04 · Demo | Demo script |

Gate 1 is *Approve requirements*, Gate 2 *Approve the plan*, Gate 3 *Approve the build* -
which is also where the pull requests Ref handed to a coding agent get a
person's approval before the demo is built - and a finished
project is "Shipped". Each agent has a face: one head shape with a different crest -
a scout's tick, a coach's X on the board, tally marks, a host's mic - so
the four read as a family. The eyes blink only while that agent is working, so the motion
is a status indicator rather than decoration.

## What it does

- **Home answers "what needs me?".** `/` is a bento of tiles - waiting for approval,
  questions waiting, in flight, recently shipped and the crew - ordered by the role the
  person picked the first time they arrived (`src/store/usePreferences.ts`; change it in
  Settings). Each tile shows at most four rows so Home fits one screen; "View all" opens
  the matching Portfolio filter (`/portfolio?tab=needsYou|active|done`). The role only
  reorders Home and sets the default detail level; it grants nothing.
- **Starting is guided.** `/start` offers four starting points, a guided brief (problem,
  who uses it, data involved, what success looks like) or free text, and a drop zone that
  takes several documents at once, beside a sticky Start button and a note on what happens
  next. It catches "attached" with nothing attached before Scout starts.
  `?starter=idea|fsd|report|data` preselects a starting point.
- **Help is one click away.** The top bar's help button (also in `⌘K`) opens the crew, the
  gates and the glossary in a side panel. Crew avatars and gate titles explain themselves
  on hover or focus. Unknown URLs get a not-found page instead of the landing page.
- **The line is the navigation.** The top bar carries all eight stations - four agents and
  three gates - showing where the project is, what it cleared and what is left. It is sized
  by the room it has, not the screen: icons first, then the current stage's name, then the
  project name, then every label, and a chip with the current stage and step count when
  even the icons do not fit. Home,
  Portfolio and Workspace notes are labeled links; the signed-in user sits top right with
  theme, Settings and sign-out.
- **Settings are a page.** `/settings` holds the detail level, theme and role. All three
  are saved in the browser and change what you see, not what you can do.
- **Projects grouped by what they need.** The left rail leads with **Waiting for
  approval** (anything parked at a gate), then Active, then Done. `⌘K` opens a command
  palette of actions and recent projects that searches every project as you type; `⌘B`
  toggles the rail.
- **A thread, split into stations.** One continuous conversation, streamed over SSE, but
  each turn is stamped with the agent that produced it and each station gets a band. The
  column keeps one 48rem measure, follows the stream only while you are at the end, and
  offers *Jump to latest* when you have scrolled up.
- **Simple by default, Detailed on request.** Settings decides how much machinery shows.
  Simple (the default) narrates a run as plain steps with status marks and shows the
  document's outline filling in section by section. Detailed adds the full tool trace (a
  finished turn folds it into tool chips - "12 tool calls · Read file ×8" - one click from
  the whole trace), the
  document streaming as raw JSON (it is produced as tool input rather than prose), and the
  tokens each turn burned. A run can be stopped mid-stream and retried if it fails.
- **Working is never just an animation.** Under a running agent, one line says what it is
  doing now ("Reading line-plan.docx"), how long it has been at it, and offers Stop for
  local runs. Through silence it rotates the crew member's own working phrases
  ([src/lib/pipeline.ts](src/lib/pipeline.ts) `working`). When a run or a decision
  finishes on a project you are not viewing, a receipt appears bottom-center; the tab title
  counts waiting approvals and the favicon carries a status dot.
- **The plan sits above the composer, not in the thread.** It is the state of the run
  rather than something the agent said, so it stays put instead of scrolling away. It
  opens when a turn starts and folds to one line when the turn ends or a question needs
  answering first. A finished run's plan reads as complete: the agent's last step is
  writing the artifact, so it never gets a turn in which to report that step done.
- **Gates are the loudest surface.** A gate says what you are approving - the real numbers
  from the document under review - then the criteria to confirm (sentence first, IDs only in
  Detailed), what is still missing, and what approving sets in motion. The API records the
  signed-in user as the signer; nothing the browser sends can name someone else. Sending
  back requires a reason, offers starter phrases, and asks once for specifics if the note
  is very short. Every decision is undoable for twelve seconds, shown as a filling bar, and
  *Copy link for another approver* hands the gate to someone else.
- **Cleared gates are ticket stubs** that name who signed and when, from the server's
  decision trail (`GET /projects/{id}/decisions`), in any browser. The Progress tab lists
  every decision under **Activity**.
- **Questions come one at a time.** Each has large option chips, an *answer in your own
  words* field, Back and Skip, and *I don't know - ask someone*, which copies a link to
  `/answer/:projectId`: the questions and nothing else - no rail, no thread - for a subject
  expert to answer after signing in.
- **Typed artifact views.** The side panel renders a requirements brief, a build plan, a
  quality report and a demo script as four different documents, because they are - with severity
  ordering, requirement coverage and the unit-of-work dependency graph. It opens by default
  on wide screens at a steady width, and its first tab, **Progress**, shows every stage,
  what is happening now and what happens next, so it is useful before any document exists.
- **Documents read like documents.** Each opens on a cover - state (draft, waiting at a
  gate, approved by whom), version, last update - with its key numbers and a completeness
  ring. A contents bar follows the scroll; every section has a copy-link, and `?panel=` /
  `?section=` reopen the same place. Citations open the quoted excerpt in a context card.
  Long lists get filter chips. *What changed* compares any two drafts, and a notice says
  when a document changed since you last looked. Export as Markdown, Word or PDF, named
  from the project and version. Select any passage to have it explained, ask about it, or
  copy it with a link. **Sources** lists uploads, what the crew read, and what the
  requirements cite.
- **Plans are explorable.** A build plan's Design tab is a canvas (React Flow, loaded on
  demand): pan, zoom, fit, keyboard navigation and an Outline alternative, with the
  architecture, the build order (step columns in Simple, a dependency graph with the
  critical path in Detailed) and the data model. **Trace** follows every requirement from
  plan to check to demo, and Portfolio has a **Board** view, one column per stage.

## Design system

Everything visual comes from the semantic token layer in [src/index.css](src/index.css).
**Components may not reference a brand primitive or a raw palette color directly** - that
is what makes the light/dark flip a one-file change.

- **Themes.** Light is the default and is what the HTML ships with, so the first paint
  never flashes. Dark is authored as a sibling palette, not derived by inversion. Both are
  verified at >=4.5:1 for body text against the darkest surface each token is used on.
- **Icons.** One family, `@phosphor-icons/react`. The only hand-drawn SVGs are the four
  agent faces in [src/components/agents/AgentFace.tsx](src/components/agents/AgentFace.tsx) -
  identity, not iconography - and the isometric line in
  [src/components/art/IsoLine.tsx](src/components/art/IsoLine.tsx), drawn from the tokens so
  it is right in both themes. No Unicode glyphs standing in for icons.
- **Illustrations are drop-ins.** Every illustration slot (`<Artwork id="..." />`) has a
  designed fallback in code. Put `<id>.light.<ext>` and `<id>.dark.<ext>` (or one `<id>.<ext>`)
  in [src/assets/illustrations/](src/assets/illustrations/), restart `pnpm dev`, and the file
  replaces the fallback with no code change. The ids, sizes, prompts and post-processing are
  in [docs/design/asset-prompts.md](../../docs/design/asset-prompts.md).
- **Type.** Geist + Geist Mono, self-hosted via `@fontsource-variable`. Fixed rem scale,
  no fluid clamps. **12px is the floor**; mono carries IDs, timestamps, tool names and
  station numbers. The `.stencil` class is the Under Armour lockup - italic, uppercase,
  heavy - and is for station, gate and crew names only, never body copy or control labels.
- **Trace rows carry no chrome.** Tool calls and the reasoning disclosure are bare rows:
  no border, no fill, no status label, and a caret that only appears on hover. A spinner
  is the only thing that announces itself, because it is the only thing still happening.
  A tool is named for what it does - "Read file", not `get_file_contents` - via
  [src/lib/toolLabels.ts](src/lib/toolLabels.ts), because most of these tools belong to
  GitHub's and Atlassian's MCP servers and cannot be renamed at the source. The wire name
  stays in the expanded detail so a trace can still be matched against the code.
- **The hazard stripe** (`.hazard`) appears exactly once, on the gate header, where "work
  stops here until a person signs" is the literal meaning.
- **Color discipline.** UA red is reserved for primary actions, the current station, the
  gate and needs-you. The four agent hues are data: they may tint a mark, a station node
  or an artifact tab, and never appear on interactive chrome.
- **Markdown.** Agent prose goes through `react-markdown` + `remark-gfm`, and every
  element is bound to the token layer in [src/lib/markdown.tsx](src/lib/markdown.tsx) -
  headings render as a heavier line, not a larger one, because a reply is one message and
  the station bands are the page's real headings. One renderer for the streaming buffer and
  the finished turn, so nothing re-lays-out when a run ends.
- **Shape.** `rounded-sm` inputs and chips, `rounded-md` cards and panels, `rounded-full`
  avatars and pills. Nothing else.
- **Motion.** `motion/react`, 150-250ms, state-carrying only. Three authored moments, in
  [src/components/moments/](src/components/moments/): a signed gate hands the document to the
  next crew member, the first project this browser starts gets a kickoff card, and a
  project's first view after shipping sends up a burst in the crew's colors. The isometric
  line is animated two ways: in Help, a full-color loop of a brief traveling the whole
  line; in a project, only what is true moves - the belt while a run is active, a pulse on
  the gate it waits at. Document cards lift their pages on hover, and that is the only
  depth. Decorative loops (the pixel grid, the ASCII head, the line) pause off screen and in
  hidden tabs. `prefers-reduced-motion` is honored
  globally, and the moments keep their end state without the travel.
- **Primitives.** `Button`, `IconButton`, `TextInput`/`TextArea`, `Badge`, `Tooltip`,
  `ConfirmDialog` in [src/components/ui/](src/components/ui/). `IconButton` requires a
  `label`, so an unlabeled icon button cannot be built.

## Known gaps

- No illustration has been delivered yet, so every slot shows its code fallback. The
  prompts are ready in docs/design/asset-prompts.md.
- Sign-off is still a button. Hold-to-sign or slide-to-sign waits for a usability test
  (docs/design/roadmap.md, Phase 3).
- "Waiting for approval" is not personal, and nobody is notified that a gate or a question
  needs them - the copied link is the whole hand-off until approvers and notifications exist.
- The undo window is client-side: closing the tab inside it drops the decision rather than
  sending it. That is the safe direction to fail, but a durable version needs the backend.
- **Stop only stops local runs.** Deployed runs have no cancel endpoint, so the working line
  offers no Stop for them; the composer's Stop there only stops watching.
- **The conversation lives in the browser that had it.** Anyone else sees the documents,
  decisions and any parked question, but not the chat itself, until history is stored per
  user and project on the server. For the same reason a stalled run is detected by absence
  ("has not started"), and only offered a restart in local mode.

## Run it

```bash
pnpm install
pnpm dev      # http://localhost:5173, calling the console API at VITE_API_BASE_URL
pnpm build    # production build
pnpm lint     # oxlint
pnpm typecheck # tsc -b
pnpm test     # vitest: unit tests for the pure logic in src/lib/
pnpm coverage # the same, with a coverage report and a floor (see vite.config.ts)
```

Needs a `.env` (see `.env.example`): `VITE_API_BASE_URL`, `VITE_ENTRA_TENANT_ID`,
`VITE_ENTRA_CLIENT_ID` (same Entra ID app registration the backend validates against).
