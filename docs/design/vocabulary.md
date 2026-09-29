# Vocabulary and naming

What the console calls things, why that was hard for non-technical readers, and the options
that were weighed.

> **Decided 2026-09-28: Option A.** Plain stage, output and gate names around the named crew,
> now live in [pipeline.ts](../../ui/console/src/lib/pipeline.ts#L45-L134) and logged in
> [docs/decisions.md](../decisions.md) (supersedes 2026-08-28 "Splitting station from crew").
> The one-noun-per-concept pass below is only partly applied - see [roadmap.md](roadmap.md)
> Phase 0.

## The problem this solved: three metaphors at once

Before 2026-09-28, all user-facing names in `pipeline.ts` looked like this:

| Layer | Terms in use | Metaphor |
|---|---|---|
| Structure | line, station, ST 01, gate, "Off the line", "Shipped" | Factory |
| Workers | Scout, Coach, Ref, Host | Sports staff |
| Places | Combine, Playbook, Film Room, Gameday | Sports venues and events |
| Outputs | Scouting report, Call sheet, Grade sheet, Run of show | Sports and broadcast |
| System | artifact, completeness, units of work, FSD, machine-readable rules, evidence, JSON, tokens | Engineering |

Each metaphor is reasonable on its own. Stacked, a sentence like *"Gate 2 - Call sheet sign-off:
Coach is done. Ref starts when you sign."* requires translating three vocabularies before the
reader knows they are approving a build plan. The landing page is the only glossary, and it
disappears after the first project.

Two smaller issues, both fixed with the rename:

- The landing page promised **two** gates; there are three. It now names all three.
- [docs/console-redesign.md](../console-redesign.md) section 13 described the earlier
  Draft / Pattern / Fit / Showroom names. It now carries a superseded note.

## Options

### A. Plain first, character second (chosen)

Stages and outputs in plain language; the crew keeps its names and gains a job title. Gates
become verbs. Station numbers lose the factory "ST" prefix and read as jersey numbers.

| Wire id | Stage | Crew | Number | Job title | Output | Gate after it |
|---|---|---|---|---|---|---|
| `distill` | Requirements | Scout | 01 | Requirements analyst | Requirements brief | Gate 1 - Approve requirements |
| `blueprint` | Plan | Coach | 02 | Build planner | Build plan | Gate 2 - Approve the plan |
| `review` | Build check | Ref | 03 | Quality reviewer | Quality report | Gate 3 - Approve the build |
| `showroom` | Demo | Host | 04 | Demo producer | Demo script | - |
| `done` | Shipped | | | | | |

Gate copy as shipped: *"Gate 1 - Approve requirements. Scout is done. Coach starts when you
approve."* The primary button reads *Approve and hand to Coach*; the undo line reads
*Approved. Handing to Coach in 12s*; the signed record reads *Gate 1 - Requirements brief
approved*, *Signed by ...*.

**Why:** it keeps what makes the crew likable - names, faces, a little voice - while the chrome
speaks the reader's language. It needs no glossary for the decision that matters. It drops the
venue layer entirely, which removes one metaphor instead of explaining it.

### B. Fully plain

Analyst, Planner, Reviewer, Presenter; no character names. Maximum clarity, and it loses the
persona - which is the adoption asset [patterns/bot-personas.md](patterns/bot-personas.md) builds
on. Not recommended.

### C. UA product-creation journey for the stages

Brief, Pattern, Fit, Launch as the stage names, with the crew unchanged. Strongly on-brand for
an apparel company, and the vocabulary teaches the model. The garment words were tried on
2026-08-27 *as the agent names* (Draft / Pattern / Fit / Showroom) and replaced a day later
because stage nouns made the crew read as steps rather than people. Using them for stages
only avoids that failure. The cost is that "Pattern" and "Fit" still need one sentence of
explanation for anyone outside merchandising. A reasonable alternative if A tests poorly.

### D. Keep the sports names, add subtitles

"Combine - Requirements", "Call sheet - Build plan". Smallest change, and the reader still
decodes two names for every thing.

## Glossary (for Option A)

The in-product glossary (Help panel, tooltips on first use) uses these definitions.

| Term | Plain definition |
|---|---|
| Project | One idea traveling from request to demo. |
| The line | The four stages every project goes through, with an approval between each. |
| Stage | One step on the line, worked by one crew member. |
| Crew | The four AI teammates - Scout, Coach, Ref and Host - each doing one job. |
| Gate | A stop where a person reviews the work and approves it or sends it back. Nothing moves past a gate without a person. |
| Approve (sign) | Say the work is good enough for the next stage. Recorded with your name. |
| Send back | Return the work to the crew member with notes on what to change. |
| Undo | Take back a decision within a few seconds, before it is sent. |
| Requirements brief | What needs to be built, each point tied to where it came from. |
| Build plan | How it will be built and in what order. |
| Quality report | What was built, checked against the requirements, worst problems first. |
| Demo script | The walkthrough and sample data for showing it working. |
| Completeness | How much of what a stage needs is covered. 100% means nothing required is missing. |
| Gap | Something required that is still missing. |
| Open question | Something the crew needs a person to answer. |
| Source | Where a requirement came from - a document, an answer, or a reference. |
| Acceptance criterion | How we will know a requirement is met. |
| Build task | One piece of the build plan, small enough to hand to a developer or Copilot. |
| Finding | Something the quality review flagged. |
| Copilot | GitHub's coding assistant, which writes code from build tasks. |
| Workspace notes | Standing information every crew member should know (repositories, databases, conventions). |
| FSD | Functional specification document - the written description of what a system should do. |

## One noun per concept

| Concept | Use | Stop using |
|---|---|---|
| What a crew member hands over | the output's name ("requirements brief"); generically, **document** | artifact, output |
| A step on the line | **stage** | station (in UI copy - the enum stays) |
| An approval point | **gate** | checkpoint, sign-off (as a noun) |
| The act of approving | **approve** | sign (except "signed by" in the record), release |
| A piece of work in the plan | **build task** | unit of work |
| The reason behind a requirement | **source** | evidence, citation |
| Standing context | **workspace notes** | context |
| A code change | **code change** (Simple), pull request (Detailed) | PR, `[WIP]` in Simple mode |

## Verbs

detail.design `copywriting-3`: the verb matches the mutation, and the confirmation uses the
same verb.

| Action | Verb | Result copy |
|---|---|---|
| New project | Start | "Started. Scout is reading your brief." |
| Approve a gate | Approve | "Approved. Coach starts in 12s - Undo." |
| Return work | Send back | "Sent back to Scout with your notes." |
| Reverse a decision in the window | Undo | "Undone. Gate 1 is waiting for you again." |
| Remove a project permanently | Delete | "Deleted *Line plan tool*." |
| Remove an attached file before sending | Remove | - |
| Stop a run | Stop | "Stopped. The run was canceled before it finished." |

## Words not shown in Simple mode

token, JSON, artifact, station, MCP, S3, schema, `[WIP]`, merge, PR, model names, tool wire
names. Detailed mode may show all of them.

## What changed in code

Display strings only. `AGENT_META` (now with a `title` field) and `STATION_META` in
[pipeline.ts](../../ui/console/src/lib/pipeline.ts) hold every name; the gate, landing,
inspector, thread and build-board copy that repeated the old names was updated to match, and
one API error message ("Host hasn't produced a finished demo script yet"). Wire ids, the
`Station` enum and the API contract are untouched.
