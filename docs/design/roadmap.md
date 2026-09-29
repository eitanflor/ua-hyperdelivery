# Roadmap

Phased plan for the findings in [ux-audit-2026-09.md](ux-audit-2026-09.md). Each phase ships on
its own and is reviewable as one pull request or a small series. Phase 0 goes first; after
that, phases 1-4 can overlap where their backend dependencies allow. **No phase removes or
weakens a gate.**

## Overview

| Phase | Theme | Main findings | Backend needed |
|---|---|---|---|
| 0 | Foundations: defaults, words, readability | UX-01-04, 08, 10-12, 17, 21, 27 | None |
| 1 | Role-aware Home and guided intake | UX-05 (interim), 06, 18-20, 22 | None to start |
| 2 | Working states | UX-02 (full), 03, 15, 16 | Deployed-mode cancel endpoint; notifications (optional) |
| 3 | Approvals and questions | UX-05, 07, 09, 14, 23, 26 | Decisions list, server-side signer, approver assignment, notifications |
| 4 | Artifacts and panels | UX-12 (full), 13 (build order), 24, 25 | Artifact versions endpoint |
| 5 | Canvas | UX-13 | None |
| 6 | Visual signature | - | None |

## Phase 0 - Foundations

**Goal:** a non-technical first-time user reads plain words, sees the agent working, and is
not shown internals.

- ~~Settle naming.~~ **Done 2026-09-28:** Option A from [vocabulary.md](vocabulary.md) is live
  in `AGENT_META` and `STATION_META` and logged in [docs/decisions.md](../decisions.md). The
  one-noun pass followed: user-facing copy says "document", "stage" and "build task".
- ~~Replace "Developer / PM" with **Simple / Detailed**; default Simple.~~ **Done 2026-09-28**,
  stored values kept.
- ~~In Simple mode: show grouped plain steps while running; hide raw JSON and token counts.~~
  **Done 2026-09-28** (`PlainSteps`, `PlainDraft` in `Turns.tsx`).
- ~~Fix "two gates".~~ **Done 2026-09-28** with the rename.
- ~~Label the inspector's content tab per artifact kind.~~ **Done 2026-09-28.**
- ~~Reading type one step up on thread, gate and artifact bodies.~~ **Done 2026-09-28.**
- ~~Move Ref and Host to identity hues that no status uses.~~ **Done 2026-09-28:** violet and
  magenta, ratios in `index.css`.
- ~~Respect IME composition on every Enter-to-send.~~ **Done 2026-09-28.**
- ~~Router link on the logo; 24px hit areas on inline buttons.~~ **Done 2026-09-28**
  (`hit-area` utility).
- ~~Status Mark primitive.~~ **Done 2026-09-28** (`components/ui/StatusMark.tsx`). The
  `--ease-exit` token moves to Phase 2, where the first exit animations land - a token
  nothing uses would only drift.

**Status:** complete except the role-based default, which needs Phase 1's role question.

**Exit:** a Simple-mode run never shows JSON, tokens or wire names; no screen says "two gates";
contrast table updated in `index.css` comments; `pnpm build` and `pnpm lint` pass in
`ui/console`; `make check` green.

**Decisions to log:** naming; Simple/Detailed default; identity hue change.

## Phase 1 - Home and intake

**Goal:** one place answers "what needs me?", and starting a project is guided.

- **First-run role question** ("What brings you here?"), stored as a client preference, editable
  in Settings. Sets default detail and Home layout ([personas.md](personas.md)).
- **Home** as a bento grid: *Waiting for approval* (renamed from "Needs you" until approvers
  exist), *Questions waiting*, *In flight*, *Recently shipped*, *Crew status*. Designed empty and
  loading states. Replaces the landing page as `/` for returning users; the landing becomes
  *Start a project*.
- **Starters**: four or five cards ("I have an FSD", "I have an idea", "I need a report or
  dashboard", "I need data moved between systems") that open the brief builder prefilled.
- **Guided brief builder**: the plan's structured intake - problem, who uses it, data involved,
  what success looks like - as editable example text (`interactivity-17`), with a free-text
  escape hatch. Pre-flight before sending (`interactivity-27`).
- **Drop zone**: multiple files, drag-and-drop, clear accepted types, chips with remove.
- **Crew**: player cards (placeholder art until Phase 6) and avatar hover cards anywhere a face
  appears.
- **Help panel and glossary**; first-use tooltips on stage, gate and document names.
- **Command palette actions**: start a project, go to Home, open what needs me.
- Not-found page. Labeled navigation to Home, Portfolio and Workspace notes.
- Portfolio: stage names instead of "3/7"; remove "Stages complete".

**Exit:** the [personas.md](personas.md) test plan run with 3-5 non-technical colleagues;
findings written back into the personas and the audit.

**Decisions to log:** Home replacing the landing page as `/`; client-side role preference.

**Status (2026-09-28): built, usability test not yet run.** Where it differs from the list
above:

- Home is `/` for everyone. First-time users get Home's empty state - starters and the crew -
  rather than a separate landing page; the old landing is now `/start`.
- "Needs you" became *Waiting for approval*, not "Waiting for sign-off", to keep "gate" and
  "approve" as the only nouns for that moment ([vocabulary.md](vocabulary.md)).
- Examples sit in the brief builder as `e.g.` placeholders, not prefilled values. A prefilled
  value that nobody edits would be sent to Scout as if it were the real brief.
- "Settings" is the account menu for now: theme and role. The side-panel settings are Phase 4.
  *Superseded in Phase 2:* a `/settings` page now holds detail level, theme and role.
- First-use tooltips are standing tooltips: the gate title explains "gate", crew avatars
  explain the crew member, stage names already explain themselves on the line. Nothing
  auto-opens.
- Crew player cards use the existing face marks until the Phase 6 artwork.

## Phase 2 - Working states

**Goal:** a reader always knows what the agent is doing, how long it has taken, and can stop it.

- Full thought line per [patterns/agent-states.md](patterns/agent-states.md): plain step
  narration from tool events, persona keywords for silence, elapsed timer, settle to past tense.
- **Document skeleton** that fills section by section from the `draft` stream.
- **Stop** beside the working state, not only in the composer, and an honest stopped state.
  Local runs already stop; deployed runs need the cancel endpoint.
- **Receipts**: success toasts for finished runs and signed gates, and a *Recently done*
  section on Home.
- **Live favicon and tab title** for working and needs-you.
- "Jump to latest" edge control while streaming; station minimap for long threads
  (`motion-8`).
- Detailed mode keeps today's trace, plus a one-line tool-chip summary.
- The `--ease-exit` token (`cubic-bezier(0.4, 0, 0.6, 1)`) alongside the first exit
  animations.

**Backend:** `POST /projects/{id}/cancel` (or equivalent) that stops a deployed Step Functions
execution - local runs already stop when the stream closes; optional explicit `phase` events.

**Exit:** no running state shows only an animation; a run can be stopped from the keyboard;
reduced-motion check passes.

**Status (2026-09-28): built, not yet checked in a browser against a live run.** Where it
differs from the list above:

- The thought line (`components/thread/ThoughtLine.tsx`) narrates the running tool call
  ("Reading line-plan.docx"), says which document is being written, and otherwise rotates
  the crew member's working phrases every 3 seconds. A running call has no arguments yet, so
  it names the tool until the call finishes. Only the narrated activity is announced to
  screen readers.
- "Settle to past tense" is the finished turn's attribution line in Simple mode:
  *finished in 2m 14s · 6 steps*. The step list itself already settles in place.
- The document skeleton (`components/thread/DocumentSkeleton.tsx`) replaces Simple mode's
  single "Writing" line. Detailed mode keeps the raw JSON.
- Stop sits on the thought line, for local runs only. Deployed runs still show no Stop
  there, because the cancel endpoint does not exist and a Stop that does nothing would lie.
- Receipts are bottom-center notices (`components/Notices.tsx`) for runs and decisions that
  finish on a project you are not viewing. *Recently done* on Home is not built.
- The tab badge (`lib/favicon.ts`) puts a count in the title and a red dot on the icon for
  waiting approvals, or a gray dot while an agent works.
- *Jump to latest* is built, and the thread only follows the stream while you are at the
  end. The station minimap and the Detailed-mode one-line tool summary are not built.
- `EASE_EXIT` lives in `lib/motion.ts` for motion/react. No CSS exit animation needed it,
  so there is no `--ease-exit` CSS token.
- Added from user feedback in the same pass: a Settings page (detail level moved out of
  the header), a Home button in the header, a two-column `/start`, a fixed-width side panel
  that is open by default on wide screens with a **Progress** tab, and one 48rem chat measure
  whether or not the panel is open.

## Phase 3 - Approvals and questions

**Goal:** an approver can say what they approved and what it commits to; an SME can answer from
a link.

- Gate card per [patterns/approval-cards.md](patterns/approval-cards.md): what-you-approve bento,
  plain summary, criteria sentence-first with *Show where*, risks, what happens next.
- **Hold to sign** or **slide to sign** - pick one after a usability test; keyboard path
  required.
- Signature draw and **ticket stub** checkpoint; undo as a filling bar.
- Send-back starter chips and comment pre-flight.
- **Question cards** (one at a time, Skip, *answer in my own words*, *ask someone*) and the
  **SME answer-only view**.
- **Request sign-off** (copy link now; notify once notifications exist).
- **Activity panel** with every decision.
- Optional: human-readable project ids.

**Backend:**

1. `GET /projects/{id}/decisions` (repository read method plus endpoint).
2. Signer taken from the validated token server-side, not from the request body.
3. An approver (or approver list) per gate, so "Needs you" is personal. Expect this to grow
   into an approval policy per gate - one named person, any one of a group, or several
   people who must all sign - rather than a single field; design the model for that.
4. Notifications (Teams or email) for gates and questions.
5. Defined send-back semantics: hold, or rerun the previous agent with the comment.
6. Optional: a short project reference id.

**Exit:** in a moderated test, approvers can name what they approved against; decision history
visible across browsers.

**Decisions to log:** sign interaction; notification channel; send-back semantics.

**Status (2026-09-28): built except the sign interaction, not yet usability-tested.** Where it
differs from the list above:

- Sign-off stays a button. Hold versus slide is left to the usability test this phase
  names; building one blind would bake in a decision nobody has made.
- The "what you're approving" numbers open the document, not a section of it - section
  links need Phase 4's addressable panel. Criteria have no *Show where* for the same reason.
- No plain summary on the card: the agent's finished turn directly above already shows
  it, word for word.
- The signature does not draw itself; the checkpoint is a ticket stub with a perforated
  edge. Asking a question from the gate is not built - the composer is closed at a gate.
- *Request sign-off* copies a link to the project; the answer-only view is
  `/answer/:projectId`, outside the app chrome, behind the same sign-in.
- Backend 1 and 2 are done: `GET /projects/{id}/decisions`, and the signer comes from the
  validated token. Approvers per gate, notifications, send-back semantics and short ids
  remain.

## Phase 4 - Artifacts and panels

**Goal:** documents are readable, traceable, linkable and exportable.

- Artifact viewer per [patterns/artifacts-and-panels.md](patterns/artifacts-and-panels.md):
  cover, summary bento, table of contents by visibility, section anchors in the URL.
- Citation chips and context cards; a Sources panel.
- Selection actions: *Explain in plain language*, *Ask Scout about this*.
- Filter tables for requirements and findings.
- Build order (numbered) in Simple mode; the detail ladder for the static diagram.
- Export (PDF, Word, Markdown) with real typography and context-named files.
- Versions and a diff table.
- One side-panel system: artifact, sources, activity, workspace notes, settings, help.

**Backend:** an endpoint over `ProjectRepository.list_artifact_versions`; export can start
client-side.

**Exit:** any requirement's source is two clicks away; a copied link reopens the same section.

**Status (2026-09-28): built except the unified panel system, not yet checked in a browser.**
Where it differs from the list above:

- The table of contents is a sticky bar of section chips that follows the scroll, not a side
  column - the panel is too narrow for one. It lists only the sections the current detail
  level renders.
- Citations open an inline context card with the excerpt and its kind (submitted document,
  answer in chat, reference FSD). Evidence does not record which uploaded file a line came
  from, so the card cannot name or open the file; the Sources tab lists the uploads instead.
- Selection actions put a quote in the message box for *Explain* and *Ask {agent}*, so the
  reader sees and sends it. There is no separate explain endpoint; while a project waits at a
  gate only *Copy with link* is offered, because nobody is there to answer.
- Export: Markdown is built from the document's fields; Word and PDF come from the rendered
  view (Word opens HTML; PDF prints from an isolated frame).
- Versions: `GET /projects/{id}/artifacts/{agent}/versions`, a *What changed* tab comparing
  any earlier draft with the latest, and an *Updated since you last looked* notice keyed to
  this browser.
- Sources: `GET /projects/{id}/documents` lists uploads; the tab adds what the crew read this
  session (from tool calls) and what the requirements cite, by kind.
- From Phase 2's leftovers: finished turns in Detailed mode collapse their trace to tool
  chips, and every finished turn names the files it read.
- Simple mode now shows the numbered build order, the demo walkthrough and its sample data
  (both were hidden), plain severity (*Must fix*, *Should fix*, *Minor*), a coverage strip,
  and the spec's open questions.
- Not built: workspace notes, settings and help as panels in the one side-panel system; the
  diagram detail ladder (Phase 5 with the canvas).

## Phase 5 - Canvas

**Goal:** the line, the architecture and the build order are explorable, not just pictured.

- Line map, architecture canvas, dependency graph, data model and traceability views per
  [patterns/canvas-and-diagrams.md](patterns/canvas-and-diagrams.md).
- Pan, zoom, minimap, keyboard navigation, outline view for every canvas.
- Lazy-loaded; layout in a worker for large graphs.

**Decisions to log:** `@xyflow/react` and the layout engine (`elkjs` license check, or `dagre`).

**Exit:** Coach's largest real blueprint renders without the 12-component cap and is fully
keyboard-navigable.

**Status (2026-09-28): built except the line map, not yet checked in a browser.** Where it
differs from the list above:

- React Flow and dagre (logged in docs/decisions.md). The canvases load in their own chunk
  when a Design tab opens; dagre lays out on the main thread, which is enough at blueprint
  size, so there is no worker.
- Architecture: the inline view follows the detail ladder - the 7 most connected
  components in Simple mode, 12 in Detailed - and *Open the full view* shows every one
  with a minimap and a details side panel. Outside systems are linked to the components
  whose build tasks serve the same requirements, because the plan does not link them
  directly. Every canvas has an Outline alternative.
- Build order: Simple mode shows ranked step columns ("Step 1 - 3 can start now");
  Detailed shows the dependency graph with the critical path in accent and loops flagged.
- Data model: entity cards with their fields, not a graph - the plan names no
  relationships between entities, and unconnected boxes teach less than a list.
- Traceability is a Trace tab in the side panel: each requirement's plan, check and demo
  status, gaps first.
- The portfolio board is a Board view on Portfolio (`?view=board`), one column per stage.
- Not built: the line map (the Progress tab already shows the line, and the Simple version
  is Phase 6's isometric illustration), and SVG/PNG export of a canvas. The static SVG
  diagram was removed rather than kept beside the canvas.

## Phase 6 - Visual signature

**Goal:** the product looks and feels like nothing else inside UA.

- Commission or generate the assets in [asset-briefs.md](asset-briefs.md); replace placeholders.
- Isometric line on Home and the Simple line map; layer-lift artifact cards.
- Dithered player-card portraits; pixel-grid and ASCII working tiles on Home.
- The three authored moments: gate approved and handed off, first project created, project
  shipped.
- Optional: split-flap status board on Home; insights for leadership.

**Exit:** every asset in both themes; decorative motion paused offscreen and under reduced
motion; no measurable regression in first load.

**Status (2026-09-28): code built; artwork not yet generated.** Where it differs from the
list above:

- The artwork is optional, not a precondition. Each slot (`components/art/Artwork.tsx`) shows
  a designed fallback until a file is dropped into `ui/console/src/assets/illustrations/`.
  The prompts, sizes and post-processing for every slot are in
  [asset-prompts.md](asset-prompts.md). The exit criterion "every asset in both themes" waits
  on that.
- The isometric line is drawn in code (`components/art/IsoLine.tsx`) rather than waiting for
  A1, and it is animated. It has two modes. The Help panel's `overview` is in full color - every
  platform tinted, every gate red - with a brief touring the line on a loop, which breaks the
  one-red-detail rule on purpose: it explains the whole product, not one moment in it. In a
  project (Simple-mode Progress, Home's first run) it reports state: only finished stages
  carry documents, only the gate the project waits at is red, and only what is really
  happening moves.
- The three moments live in `components/moments/`. The handoff plays only for a signature
  made in this tab in the last 20 seconds. The kickoff plays once per browser. The shipped
  burst plays once per project per browser, and only within three days of shipping, so an
  old project is not celebrated again.
- The pixel grid replaces the spinner for the running project on Home. The ASCII head is
  the not-found fallback rather than a Home tile, because Home's in-flight row is too small
  for it.
- Crew portraits are square (the card crops to a square), not the brief's 480 x 600.
- Not built: the split-flap board and leadership insights (optional), the F ticket texture,
  the G tile spots and the J favicon states. The ticket stub and the favicon already work
  without them.

## Every phase

- `make check` green; `pnpm build` and `pnpm lint` in `ui/console`.
- The checks in [principles.md](principles.md) ("Checks before a surface ships").
- Each new dependency logged in [docs/decisions.md](../decisions.md) with the porting rules applied.
- Docs review per [AGENTS.md](../../AGENTS.md): `ui/console/README.md`, `README.md` status,
  `docs/architecture.md` for new endpoints, `CHANGELOG.md`.
- Update [ux-audit-2026-09.md](ux-audit-2026-09.md): mark findings resolved with the phase that
  closed them.
