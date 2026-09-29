# UX audit, September 2026: adoption for non-technical users

**Question:** can a PM, analyst, SME or requester who has never seen the console use it
without help, and want to come back?

**Short answer:** not yet. The console is well built for the people who drove it first. The
August redesign ([docs/console-redesign.md](../console-redesign.md)) fixed most of its
accessibility and structure, and those fixes hold. What remains is mostly about **who it
assumes the reader is**. The default view is the developer's. Agents go quiet for minutes in the
simplified view. The names stack three metaphors. There is no guided way to start, no personal
"what needs me", and no path at all for an SME. Most of the fixes are copy, defaults and one new
home screen. None of them needs re-modeling.

## Scope and method

- **Surface:** `ui/console/` - every route, the shell, the thread, gates, the inspector.
- **Lens:** the six personas in [personas.md](personas.md), weighted toward the four
  non-technical ones.
- **Method:** `impeccable` critique and audit heuristics, the `layers-*` skills for the
  structure, detail.design's catalog in review mode
  ([references/detail-design.md](references/detail-design.md)), and Diagram Design for the
  diagrams ([references/diagram-design.md](references/diagram-design.md)). Inspiration from the
  other references is mapped to findings at the end.
- **Degraded run, declared.** The console needs a live API and Entra ID sign-in, so every finding
  comes from reading source. None comes from watching someone use it. Line references are to
  `main` on 2026-09-28. Findings that need runtime confirmation are marked **[runtime]**.

## Keep - what already works

Credit where it is due. These stay through every phase of the [roadmap](roadmap.md):

- A semantic token layer, with contrast measured against the darkest surface each token sits on,
  in both themes.
- One focus treatment, a global reduced-motion rule, live regions for streaming and errors,
  labeled icon buttons, labels linked to inputs.
- URL routing for projects, a command palette, collapsible rail, keyboard shortcuts.
- Typed renderers per artifact kind; a completeness meter; severity badges.
- A gate that requires criteria to be confirmed, takes the signer from the token, requires a
  reason to send back, and offers a 12-second undo instead of a modal.
- An error vocabulary that names the problem and offers a recovery action
  ([lib/errors.ts](../../ui/console/src/lib/errors.ts)).
- Tool names humanized, never shown raw ([lib/toolLabels.ts](../../ui/console/src/lib/toolLabels.ts)).
- A crew with faces whose eyes blink only while working - motion as status, not decoration.

## Scorecards

Scored for a **first-time, non-technical** user. The August scores (17/40 and 7/20) were
before that redesign and measured a technical operator, so these are not directly comparable.
They are a new baseline.

### Usability heuristics (/40)

| # | Heuristic | Score | Why |
|---|---|:--:|---|
| 1 | Visibility of system status | 2 | Simple mode hides every step an agent takes; raw JSON while writing |
| 2 | Match with the real world | 1 | Factory, sports-staff and sports-venue metaphors stacked on engineering terms |
| 3 | User control and freedom | 3 | Undo, send back, retry; Stop works for local runs only |
| 4 | Consistency and standards | 3 | Strong primitives; "Requirements" tab label on every artifact kind |
| 5 | Error prevention | 3 | Criteria and work-in-progress gating; no intake pre-flight; Enter-to-send ignores IME |
| 6 | Recognition over recall | 2 | The crew is explained once, on the landing page |
| 7 | Flexibility and efficiency | 2 | Shortcuts for power users; nothing adapts to role; no starters |
| 8 | Aesthetic and minimalist design | 3 | Clean and consistent, but 12-13px reading text everywhere |
| 9 | Recognize, diagnose, recover from errors | 3 | Good taxonomy with actions |
| 10 | Help and documentation | 1 | No glossary, help panel or contextual tooltips past the landing page |
| | **Total** | **23/40** | **Fair for operators, poor for newcomers** |

### Technical quality (/20)

| # | Dimension | Score | Key finding |
|---|---|:--:|---|
| 1 | Accessibility | 3 | IME composition not respected; small icon hit areas; no outline view for diagrams |
| 2 | Performance | 3 | Stream batching in place; no lazy-loaded routes yet **[runtime]** |
| 3 | Responsive | 3 | Collapsible panels and a rail breakpoint; inspector squeezes the thread below it |
| 4 | Theming | 3 | Identity hues equal status hues for Ref and Host |
| 5 | Implementation integrity | 3 | One icon family, shared primitives; a logo link that reloads the app |
| | **Total** | **15/20** | **Good** |

## Findings

`[deeper]` needs a backend or product decision first; everything else is fixable in the
console. **Phase** points to the [roadmap](roadmap.md).

### P0 - blocks adoption

| ID | Finding | Evidence | Who | Fix | Phase |
|---|---|---|---|---|---|
| UX-01 | **Resolved 2026-09-28** - default is Simple, switch reads Simple / Detailed, and the first-visit role sets the default (Detailed for developers). **The default view was the developer's.** New users land in the full trace with tool rows, raw agent text and a JSON tab. The switch is labeled "Developer / PM", which names two jobs and leaves out requesters, SMEs and analysts. | [useProjectsStore.ts](../../ui/console/src/store/useProjectsStore.ts#L551), [TopBar.tsx](../../ui/console/src/components/shell/TopBar.tsx#L11-L14) | All | Rename to Simple / Detailed; default from role; Simple for everyone but developers | 0 |
| UX-02 | **Resolved 2026-09-28** - grouped plain steps plus a thought line that narrates the current step, rotates crew phrases through silence and shows elapsed time. **Simple mode went silent while an agent worked.** Every tool row is hidden, so a PM watches three dots and "thinking 42s" for the length of a run. The worst waiting experience is the one non-technical users get. | [Turns.tsx](../../ui/console/src/components/thread/Turns.tsx#L202-L213) | Requester, Approver | Narrated thought line with grouped plain steps ([patterns/agent-states.md](patterns/agent-states.md)) | 0 (steps), 2 (full) |
| UX-03 | **Resolved 2026-09-28** - JSON and tokens are Detailed only, and Simple mode shows the document's outline filling in section by section. **Raw internals leaked into Simple mode.** The artifact streams as raw JSON, and token counts ("12k tok") appear beside every turn in both modes. | [Turns.tsx](../../ui/console/src/components/thread/Turns.tsx#L223-L227), [Turns.tsx](../../ui/console/src/components/thread/Turns.tsx#L90) | All non-dev | JSON and tokens in Detailed only; document skeleton in Simple | 0 / 2 |
| UX-04 | **Resolved 2026-09-28 (naming Option A).** Three metaphors plus jargon. Stations (factory), staff (sports), venues (sports), outputs (sports and broadcast), and system words (artifact, completeness, units of work, FSD). A gate header needed three translations before it said "approve the build plan". Stage, output and gate names are now plain; the remaining system words are Phase 0 work. | [pipeline.ts](../../ui/console/src/lib/pipeline.ts#L45-L134) | All | Naming Option A in [vocabulary.md](vocabulary.md) | 0 |
| UX-05 | **Interim fix 2026-09-28** - now reads "Waiting for approval", which claims no ownership; personal once gates have an approver. **"Needs you" was not personal.** Every project at a gate counts as needing every viewer, so the badge is noise to requesters and misleading to approvers who are not the approver. | [App.tsx](../../ui/console/src/App.tsx#L32-L35), [Portfolio.tsx](../../ui/console/src/routes/Portfolio.tsx#L15-L19), [ProjectRail.tsx](../../ui/console/src/components/shell/ProjectRail.tsx#L42) | Approver, Requester | Rename to "Waiting for sign-off" now; personal once gates have an approver `[deeper]` | 1 / 3 |
| UX-06 | **Resolved 2026-09-28** - `/start` has starting points, a guided brief, a multi-file drop zone and a missing-attachment check. **There was no guided start.** A blank box with one placeholder example. No prompts for scope, users, data or success measures, although the plan calls for structured intake ([hyperdelivery-plan.md](../hyperdelivery-plan.md#L92)). One file per pick, no drag-and-drop. | [Landing.tsx](../../ui/console/src/routes/Landing.tsx#L78-L127), [Landing.tsx](../../ui/console/src/routes/Landing.tsx#L95) | Requester | Starters, a guided brief builder with editable examples, a multi-file drop zone | 1 |
| UX-07 | **Partly resolved 2026-09-28** - *I don't know - ask someone* copies a link to an answer-only page; nobody is notified yet. **SMEs have no path.** Answering Scout means opening the full workspace and finding the questions above the composer. Nobody is told a question is waiting. | [QuestionPrompt.tsx](../../ui/console/src/components/thread/QuestionPrompt.tsx) | SME | Answer-only view from a link; one question per card; notifications `[deeper]` | 3 |

### P1 - major friction

| ID | Finding | Evidence | Who | Fix | Phase |
|---|---|---|---|---|---|
| UX-08 | **Resolved 2026-09-28.** The landing page said two gates; there are three. It now names all three. | [Landing.tsx](../../ui/console/src/routes/Landing.tsx#L50), [Landing.tsx](../../ui/console/src/routes/Landing.tsx#L165-L168), [pipeline.ts](../../ui/console/src/lib/pipeline.ts#L125-L131) | Requester | Corrected with the rename | 0 |
| UX-09 | **Resolved 2026-09-28** - the gate shows what you are approving, criteria sentence-first, what is missing and what happens next; Gate 3 speaks of builds, not `[WIP]`. **The gate does not say what you are approving or what happens next.** Criteria lead with a mono ID. Gate 3 talks about `[WIP]` pull requests and Copilot. | [GateConsole.tsx](../../ui/console/src/components/thread/GateConsole.tsx#L122-L140), [GateConsole.tsx](../../ui/console/src/components/thread/GateConsole.tsx#L171), [GateConsole.tsx](../../ui/console/src/components/thread/GateConsole.tsx#L250-L255) | Approver | The gate card in [patterns/approval-cards.md](patterns/approval-cards.md) | 3 |
| UX-10 | **Resolved 2026-09-28** for thread, gate and document rows (now 14px); metadata stays 12-13px. **Reading text was small.** Thread prose is 13px; most metadata, and the crew explainer on the landing page, is 12px. Fine for a dense operator tool; tiring for a reader. | [index.css](../../ui/console/src/index.css#L64-L67), [Turns.tsx](../../ui/console/src/components/thread/Turns.tsx#L171), [Landing.tsx](../../ui/console/src/routes/Landing.tsx#L48) | All non-dev | One step up on reading surfaces ([patterns/visual-language.md](patterns/visual-language.md)) | 0 |
| UX-11 | **Resolved 2026-09-28** - Ref is violet, Host magenta. **Identity hues equaled status hues.** Ref's amber is the warning color and Host's green is the success color, in both themes. A Host chip reads as "done", a Ref chip as "careful". | [index.css](../../ui/console/src/index.css#L39-L56) | All | Move Ref and Host to hues no status uses | 0 |
| UX-12 | **Resolved 2026-09-28** - the tab carries the document's name. **The content tab was always "Requirements",** including for Ref's findings and Host's demo script. | [Inspector.tsx](../../ui/console/src/components/inspector/Inspector.tsx#L101) | Analyst, Approver | Label per kind | 0 |
| UX-13 | **Resolved 2026-09-28** - an interactive canvas with pan, zoom, minimap, keyboard navigation and an outline view; no component cap in the full view; build order and data model views. **Diagrams stop at 12 components** and cannot be panned or zoomed. There is no build-order view, and Simple mode hides components, data model and integrations entirely. | [architectureGraph.ts](../../ui/console/src/lib/architectureGraph.ts#L12), [ArchitectureDiagram.tsx](../../ui/console/src/components/inspector/ArchitectureDiagram.tsx#L133-L140) | Approver, Analyst | Detail ladder and canvas ([patterns/canvas-and-diagrams.md](patterns/canvas-and-diagrams.md)) | 4 / 5 |
| UX-14 | **Resolved 2026-09-28** - `GET /projects/{id}/decisions` feeds the checkpoints and an Activity list in the Progress tab. **No visible decision history.** A decision is written and never read back; a gate signed in another browser shows a placeholder. | [docs/console-redesign.md](../console-redesign.md) section 12 | Approver, Analyst | Decisions endpoint and activity panel `[deeper]` | 3 |
| UX-15 | **Partly resolved 2026-09-28** - Stop now sits on the working line for local runs; deployed runs still need the cancel endpoint. **Stop only really stops local runs, and it is easy to miss.** While a run is active the composer's send button becomes Stop and aborts the stream; locally the API then closes the agent connection. Deployed runs have no cancel, so Stop only stops watching while Step Functions carries on **[runtime]**. The control sits in the composer, away from the working state. | [Composer.tsx](../../ui/console/src/components/thread/Composer.tsx#L206-L216), [useProjectsStore.ts](../../ui/console/src/store/useProjectsStore.ts#L1163-L1167), [projects.py](../../src/api/routers/projects.py#L867-L871) | All | Stop beside the working state; deployed-mode cancel endpoint `[deeper]` | 2 |
| UX-16 | **Resolved 2026-09-28** - receipts for runs and decisions on other projects, a count in the tab title and a status dot on the favicon. **Finished work is silent elsewhere.** No success receipts, no favicon or tab-title status, nothing when a run finishes while you are on another project. | [ErrorToast.tsx](../../ui/console/src/components/ErrorToast.tsx) (errors only) | All | Receipts and live favicon ([patterns/agent-states.md](patterns/agent-states.md)) | 2 |
| UX-17 | **Resolved 2026-09-28** (landing, composer, rename). **Enter sent mid-composition for IME users.** Neither send handler checks `isComposing`, so Japanese, Chinese and Korean input submits half-typed text. | [Landing.tsx](../../ui/console/src/routes/Landing.tsx#L87-L91), [Composer.tsx](../../ui/console/src/components/thread/Composer.tsx#L173-L177) | International users | Ignore Enter while composing (`accessibility-13`) | 0 |
| UX-18 | **Resolved 2026-09-28** - help panel with crew, gates and glossary; crew and gate tooltips. **Help lived only on the landing page.** The crew explainer disappears after the first project; there are no glossary tooltips in the thread, gate or inspector. | [Landing.tsx](../../ui/console/src/routes/Landing.tsx#L130-L170) | All non-dev | Help panel, first-use tooltips, crew hover cards | 1 |
| UX-19 | **Resolved 2026-09-28** - replaced with in progress, waiting for approval, questions waiting and shipped; the bar has no bare fraction. **Portfolio numbers did not mean much.** "Stages complete" sums every project's position on the line; progress shows "3/7". | [Portfolio.tsx](../../ui/console/src/routes/Portfolio.tsx#L97), [Portfolio.tsx](../../ui/console/src/routes/Portfolio.tsx#L120), [Portfolio.tsx](../../ui/console/src/routes/Portfolio.tsx#L45-L60) | Leadership, Approver | Replace with the role-aware Home and stage names | 1 |

### P2 - polish

| ID | Finding | Evidence | Fix | Phase |
|---|---|---|---|---|
| UX-20 | **Resolved 2026-09-28** (`routes/NotFound.tsx`; an animated ASCII crew head until the E illustration is dropped in). Unknown URLs silently rendered the landing page, so a bad link looks like the app forgot you. | [App.tsx](../../ui/console/src/App.tsx#L76) | A real not-found page (`easter-egg-1`, [asset-briefs.md](asset-briefs.md) E) | 1 |
| UX-21 | **Resolved 2026-09-28.** The logo was a plain link, so clicking it reloads the whole app and drops the stream. | [TopBar.tsx](../../ui/console/src/components/shell/TopBar.tsx#L74) | Router link | 0 |
| UX-22 | **Resolved 2026-09-28** - labeled Portfolio and Workspace notes links with distinct icons. Context and Portfolio were unlabeled icons; Context uses the same file icon as documents. | [TopBar.tsx](../../ui/console/src/components/shell/TopBar.tsx#L113-L125) | Labeled nav on Home; panel system for notes | 1 |
| UX-23 | Project URLs are UUIDs - impossible to say aloud or recognize (`copywriting-12`). | Project ids | Human-readable ids (`HD-042`) `[deeper]` | 3 |
| UX-24 | **Resolved 2026-09-28** - `?panel=` and `?section=` carry the open document and section; every section has a copy-link. What you are reading in the inspector does not survive a link or a refresh. | [Inspector.tsx](../../ui/console/src/components/inspector/Inspector.tsx#L70) | Tab, artifact and section in the URL | 4 |
| UX-25 | **Resolved 2026-09-28** - Markdown, Word and PDF, named from the project, document and version. Documents cannot be exported. | - | Export with real typography | 4 |
| UX-26 | **Resolved 2026-09-28** - a bar fills across the undo window beside the countdown. The undo window is a number counting down, not a visible cause-and-effect (`motion-23`). | [GateConsole.tsx](../../ui/console/src/components/thread/GateConsole.tsx#L13-L20) | Filling bar | 3 |
| UX-27 | **Resolved 2026-09-28** with a `hit-area` utility. Some inline buttons fell below a 24px hit area (`interactivity-3`): the attach and remove-file buttons are padded glyphs of about 16-18px. `IconButton` itself is fine at 28px. | [Landing.tsx](../../ui/console/src/routes/Landing.tsx#L62-L69), [Landing.tsx](../../ui/console/src/routes/Landing.tsx#L106-L113) | Pad the hit area, not the glyph | 0 |
| UX-28 | [docs/console-redesign.md](../console-redesign.md) section 13 describes naming replaced on 2026-08-28. | Docs drift | Superseded note added in this change | Done |

## Quick wins

Small, independent, and mostly display strings. Together they fix the first impression.

1. ~~Default to Simple for everyone; rename the switch (UX-01).~~ Done.
2. ~~Show grouped plain steps in Simple mode instead of hiding them (UX-02, first cut).~~ Done.
3. ~~Hide raw JSON and token counts in Simple mode (UX-03).~~ Done.
4. ~~Fix "two gates" (UX-08).~~ Done with the rename.
5. ~~Label the content tab by kind (UX-12).~~ Done.
6. ~~Respect IME composition (UX-17).~~ Done.
7. ~~Router link on the logo (UX-21).~~ Done.

## Opportunity map

Where each inspiration area lands. Details in [patterns/](patterns/) and [references/](references/).

| Area | What we take | Findings | Phase |
|---|---|---|---|
| Loading, thinking, streaming, working states | Thought line, grouped steps, document skeleton, elapsed time, persona keywords that fill silence | UX-02, UX-03, UX-15, UX-16 | 0 / 2 |
| Bot personas | Character bible, seven expressions, player cards, the human signer as a teammate, hue fix | UX-04, UX-11, UX-18 | 0 / 1 |
| Approval cards | What-you-approve bento, plain criteria, hold or slide to sign, signature and ticket stub, send-back chips, SME question cards | UX-07, UX-09, UX-26 | 3 |
| Canvas and diagramming | Line map, architecture canvas, build order, traceability, outline views | UX-13 | 4 / 5 |
| Artifacts and side panels | Viewer with table of contents, citation chips and context cards, selection actions, export, diffs, one panel system | UX-12, UX-24, UX-25 | 4 |
| Isometric illustrations and layer lifts | The line scene, crew at work, gate, empty states; artifact cards that lift into their sections | UX-06, UX-18, UX-20 | 1 / 6 |
| Dither and ASCII | Player-card portraits, working tiles, a one-shot "booting" name | - | 6 |
| Bento | Role-aware Home, gate summary, artifact cover | UX-05, UX-19 | 1 / 3 |
| Micro-animations and animated design | Status marks, sliding highlights, shake on disabled, filling undo bar, three authored moments | UX-26 | 0 / 2 / 3 |
| Modern icons | Phosphor duotone for illustrative tiles; monochrome source marks | UX-22 | 1 |
| Kobra | House style (asymmetric motion, busy buttons, designed empties); agent components | Many | All |
| detail.design | The decision gate and ~50 rules marked high relevance | Many | All |
| React Bits | Micro: Thought Line, Status Mark, Hold Button, Slide Commit, Tear Ticket | UX-02, UX-09 | 2 / 3 |
| Beautiful UI | Approval Card, Task Rows, Tool Chips, Context Cards, Diff Table, Selection Actions | UX-07, UX-09 | 2-4 |
| Diagram Design | Detail ladder, audience setting, no-shadow hairline style, "when not to draw" | UX-13 | 4 / 5 |

## Not verified

- Nothing was observed in a running console for this audit. Before Phase 0 ships, run the
  console against a seeded store and walk each persona's journey in
  [personas.md](personas.md), recording screenshots in both themes.
- The personas are assumptions. The test plan in [personas.md](personas.md) is the first thing
  to run after Phase 1.
