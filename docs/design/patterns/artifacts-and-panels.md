# Pattern: artifacts and side panels

How the documents the crew produces are read, navigated, cited, compared and shared, and
how every other side panel (context, settings, activity, help) should behave.

## What exists

- **The inspector**: a right panel, half the screen by default, expandable to 64rem, closed
  with Escape, with a navigator per agent and tabs Design / Requirements / JSON
  ([Inspector.tsx](../../../ui/console/src/components/inspector/Inspector.tsx)).
- **Typed renderers** per artifact kind with a completeness meter, sections, citations as
  badges, acceptance criteria and severity badges
  ([views.tsx](../../../ui/console/src/components/inspector/views.tsx)).
- **Detail gating**: PM mode hides gate criteria (shown on the gate instead), machine rules,
  components, data model, integrations and units of work.
- **Context** is a separate full route with a textarea
  ([Context.tsx](../../../ui/console/src/routes/Context.tsx)).

## Gaps

| Gap | Evidence |
|---|---|
| The content tab is labeled "Requirements" for every artifact, including Ref's findings and Host's demo script | [Inspector.tsx](../../../ui/console/src/components/inspector/Inspector.tsx#L101) |
| Tab and selection are component state, so nothing about what you are reading survives a link or a refresh | [Inspector.tsx](../../../ui/console/src/components/inspector/Inspector.tsx#L70) |
| No table of contents in long artifacts | - |
| Citations are a badge plus a quoted string; the source document cannot be opened | [views.tsx](../../../ui/console/src/components/inspector/views.tsx#L224-L237) |
| No export, no copy-link-to-section | - |
| No way to see what changed between drafts, although versions are stored (`ARTIFACT_VERSION#` in [architecture.md](../../architecture.md)) | No versions endpoint |
| Uploaded documents are not listed anywhere after upload | - |
| Context, settings and the inspector are three different kinds of surface | Route vs dropdown vs panel |

## The artifact viewer

1. **Cover.** The bot face and output name, the artifact's own title, its state (*Draft*,
   *Waiting at Gate 1*, *Signed by Priya, 12 Sep*), version, last updated.
2. **Summary bento.** Three or four real numbers with a completeness ring. Counts animate once
   on first view only.
3. **Table of contents** pinned to the side of the viewer; highlight follows what is visible,
   not the last anchor crossed (`interactivity-35`). In a narrow panel it collapses to a
   minimap strip (`motion-8`).
4. **Sections** with anchors. The URL carries artifact, tab and section, so *Copy link to this
   section* works and refresh keeps your place (`interactivity-37`).
5. **Citations as chips** naming the source ("Line plan FSD, p. 4", "Answered by Sam",
   "Reference: Allocation FSD"). Clicking opens a **context card** in the panel: the excerpt,
   the document, who supplied it.
6. **Selection actions.** Highlight any passage and choose *Explain in plain language* or
   *Ask Scout about this* - posts to the thread with the quote attached (Beautiful UI
   Selection Actions).
7. **Export** as PDF, Word or Markdown with real typography (`typography-7`), named from
   context (`interactivity-25`).

## Per-kind renderers

| Output (see [../vocabulary.md](../vocabulary.md)) | Simple mode | Detailed mode adds |
|---|---|---|
| Requirements brief (Scout) | Requirements as readable cards with business value, acceptance criteria and sources; open questions; gaps | Gate criteria, machine rules, rule correlations |
| Build plan (Coach) | Plain architecture summary, simplified diagram, numbered build order | Components, data model, integrations, API contracts, dependency graph |
| Quality report (Ref) | Findings sorted worst first with plain severity ("Must fix", "Should fix", "Minor"), coverage strip, what was sent to Copilot | Pull requests, checks, diff excerpts |
| Demo script (Host) | Walkthrough steps with narration per requirement, sample data as a readable table | Raw seed data |

Findings and requirements use a **filter table** (status chips that reorganize the list -
Beautiful UI Filter Table, Kobra `table`) once there are more than ~10 rows.

## Versions and changes

Artifacts are revised when an agent closes gaps. Show *Updated since you last looked* on the
cover, and a **diff table** of added, removed and changed requirements or findings (Beautiful
UI Diff Table). Needs a versions endpoint; the repository method already exists.

## Sources panel

A per-project list of everything the crew was given or found: uploaded files (name, type,
size, who uploaded, how many requirements cite it), Confluence pages, Jira issues. Answers "what
did Scout actually read?".

## One side-panel system

Every secondary surface opens the same way: a panel from the right edge that can be resized,
collapsed to a strip rather than closed (`interactivity-7`), and remembers its width.

| Panel | Contents |
|---|---|
| Artifact | The viewer above |
| Sources | Documents and links |
| Activity | Decisions, sign-offs, sends-back, reruns (needs the decisions endpoint) |
| Workspace notes | Today's Context route, as a panel |
| Settings | Role, detail level, theme, motion, notifications |
| Help | Glossary and "how the line works" |

Below the rail breakpoint (1180px) the panel overlays the thread as a sheet instead of
squeezing it.

## Settings, specified

| Setting | Values | Default |
|---|---|---|
| Role | Requester, Approver, SME, Analyst, Developer | Asked at first run |
| Detail level | Simple, Detailed | From role: Detailed for Developer, Simple for everyone else |
| Theme | Light, Dark, System | System |
| Motion | System, Reduced, Full | System |
| Notifications | Per event: gate waiting, question for me, run finished | On for gates and questions (once they exist) |

## Accessibility

- Collapsed sections use `hidden="until-found"` so Cmd+F still finds them
  (`accessibility-5`).
- Heading order inside the viewer starts at `h2` under the panel's `h1`-level label.
- Tables have captions; severity is never color alone.
- File paths truncate from the middle (`typography-3`).
