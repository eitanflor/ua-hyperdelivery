# UA-DLC operating model

How the Under Armour AI Delivery Lifecycle works in detail: the line, what goes in and comes out of
each step, the dials, who signs, who supports what, how much of people's time it takes, and how work
reaches engineering. The summary and the ask are in [enterprise-plan.md](enterprise-plan.md); the
technical design is in [platform-architecture.md](platform-architecture.md).

Status: proposal, 2026-10-25, re-phased 2026-10-26 and re-scoped the same day so that
HyperDelivery's build stops at Inception (proposed until the owner and leadership confirm it and
engineering agrees the handoff; the decisions are in [the decision log](../decisions.md)). Numbers
marked "proposed" are starting targets to validate with pilot users during the pilot.
HyperDelivery's phases (Current State, Final MVP, Enterprise) describe how HyperDelivery itself
matures and are defined in [enterprise-plan.md section 9](enterprise-plan.md#9-roadmap-three-phases).
A target tier (T1 to T3, section 3) is where a project's production version is meant to land, built
in Construction; HyperDelivery itself delivers only a sandbox prototype on dev data. The T2 target is
called Department app so it is never confused with the Final MVP phase.

## 1. The line

UA-DLC uses the phase and step names UA engineering proposed (Ideation, Inception, Construction),
which come from AWS AI-DLC, adds Operations, and holds each phase to the output UA agreed for it:

- **Ideation** outputs a visual mockup that supplements the research and the Brief.
- **Inception** outputs a prototype, at most hosted in a sandbox on dev data.
- **Construction** outputs a production-ready version on production data connections.
- **Operations** covers every deployment and promotion after that, and running the app.

HyperDelivery runs Ideation and Inception and hands each accepted prototype to Construction.
Construction and Operations are named so the handoff has somewhere to land, and stay outside
HyperDelivery's build for now. The line keeps three standing approvals named by the decision they
record.

```
IDEATION      Intake → Research → Data discovery → Brief → Mockup → [Approval 1: what we're building]
INCEPTION     Requirements → Stories → Tech Design → Test Plan → Tickets → [Approval 2: the plan]
              → Prototype build → Checks → Evidence → Looks like the mockup → Try it
              → [Approval 3: the working prototype] → Handoff
              ◇ Construction decision (a decision record, not an approval): AI-driven, AI-assisted with engineers, or not now
CONSTRUCTION  Code → Review → Manual QA → Visual QA → Deploy          (outside HyperDelivery for now)
OPERATIONS    Deployments, promotions, running, renew or retire       (outside HyperDelivery for now)
              Business line: Discover | Plan | Prototype | Handoff. What the handoff learns feeds Intake.
```

At Light depth HyperDelivery drafts the plan straight after the mockup from one batch of questions,
so approvals 1 and 2 can be presented in one sitting: two signatures, one review. The approvals
stay; the interruptions halve.

**Where HyperDelivery stops.** Every project ends at approval 3 with a handoff package (section 10).
Construction is where work starts touching production systems and data, so after the handoff the
Construction owner decides, per project, whether Construction is AI-driven or AI-assisted with
engineers. Whether HyperDelivery later layers in an AI-driven Construction lane of its own is
decided at the scale decision, on handoff evidence; nothing is built for it before then.

### Rules

- **Risk decides who signs, never how many approvals there are** (section 4). No bulk approve.
  Deterministic checks block; model reviewers advise unless the signer matrix says they block.
- **Phase names are process vocabulary:** these docs, engineering's Jira, Layer 2 (including the
  How Work Moves map, opened from the "?" menu) and the Portfolio for leads, never Layer 1. Business
  users see step labels (section 12) and the line. Construction and Operations appear only as where
  the handoff goes.
- **A confirmation is not an approval.** "Confirm what we heard" and tester notes are confirmations:
  one person, no co-signers, no strong sign-in. The Brief is not a separate confirmation: it is
  signed with the mockup at approval 1.
- **Every step writes a versioned artifact, and each approval binds to hashes.** Later edits show
  as "3 changes since approval". Confluence may render the living document for comments; the signed
  version is HyperDelivery's.
- **Phase-boundary checks are sensors.** At each boundary the server checks traceability (criterion
  to story to requirement; ticket to criterion and proof). A failed check makes the next approval
  inert, with the reason shown.
- **Writes outside the conversation wait for their approval.** Repository creation, pushes and the
  start of a prototype build wait for approval 2; Jira filing and the AI-DLC context files wait for
  approval 3, with the handoff. Nothing in HyperDelivery writes to a production system.
- **Prototypes run in the sandbox on dev data, never on production data connections** (section 3).
  Data discovery may read production metadata, counts and aggregates through the delegation broker,
  never rows, so the Brief and the plan cite certified definitions.

### The three approvals

| | Label in the product | What is signed | Binds to | Unlocks |
|---|---|---|---|---|
| **Approval 1** | "Your approval: what we're building" | Brief, mockup, data map, what we heard so far, proposed target tier | The hash of each artifact version | Requirements through Tickets; nothing external |
| **Approval 2** | "Your approval: the plan" | Requirements, stories and acceptance criteria, decisions, the refined clickable mock, data design on dev data, consequence line (target tier, data, audience, expiry), test plan, tickets, cost, reviewer findings | Plan revision and work-graph revision | A repository in the prototype organization and pushes to it, the sandbox, dev-data grants, the build's budget |
| **Approval 3** | "Your approval: the working prototype" | Evidence per criterion, numbers check where the dev data allows one, scans, tester notes, what it skips | Commit SHA and build id | The handoff package: the Jira epic and issues, the context files and, for an existing repository, a draft PR to the owning team |
| **Construction decision** (not an approval) | "AI-driven", "AI-assisted with engineers" or "Not now" | How Construction will run, chosen by the Construction owner with the business owner | The handoff package, bound to the SHA signed at approval 3 | Nothing in HyperDelivery; Construction starts in engineering's tools, under engineering's gates |

Approval 3 accepts the prototype and releases the handoff. Nothing goes live from HyperDelivery:
Construction builds the production-ready version on production data connections, and Operations
releases and runs it. The Construction decision is recorded in HyperDelivery as a decision record,
but it is UA's sourcing decision about production work, made by different people outside
HyperDelivery's build, so it is not a fourth approval (section 10).

### Where a project starts

Nothing has to be uploaded. People describe the idea, point at what already exists, or both, and
HyperDelivery reads what they point at as them.

| Starting point | What Intake does | First artifact |
|---|---|---|
| **From scratch**: the idea in one box, optionally with links | Checks Jira and running projects for duplicates | A draft Brief, or a join as "one more voice" |
| **From a Jira ticket**: a key or link | Reads fields, comments, attachments, remote links and changelog (through an allowlisted service token until per-user sign-in in the Enterprise phase; mapping below); writing back to the ticket waits for the handoff, after approval 3, with the Jira filing; until then the project only links to the ticket | A draft Brief quoting the ticket, sourced line by line |
| **From pointed resources**: a Teams meeting or recording, a OneDrive or SharePoint folder, a Confluence or Loop page | Checks the person can read each one and its label fits the project, says "project members will be able to ask about this", then the context delegate indexes it | Source chips (Reading, Indexed, Stale, Snapshot, Needs access, Access lost, Blocked by tenant setting) and "Found in your sources" |
| **From a signal**: "Report a problem" on a prototype or on an app in production (built through Construction), or a feedback theme | Attaches it to the app's project as a change request, or opens a new idea when out of scope | A change note or a draft Brief |
| **Change something that exists** | Adds a System Map and a test baseline; offers only repositories whose owning team opted in | A draft Brief with "How it works today" |
| **Fix**: the symptom | Folds the Brief into a bug assessment: reproduces the symptom as a failing test, then judges bug, intended behavior or change request before anything is fixed (below) | A bug assessment, "could not reproduce" or "working as designed" |
| **Change this prototype** | Runs only the delta | A change note |

**The duplicate check says what it searched.** A search that finds nothing because a source is not
indexed or not allowlisted looks the same as one that finds no duplicate, so the gate would fail
open. From the Final MVP, duplicate checks (and Library checks once the Library ships in the
Enterprise phase) return one of three states: a match; nothing found in a named list of Jira
projects and running projects; or couldn't check (not allowlisted, no access, a delegate error). The
draft Brief lists what was searched, and "couldn't check" never shows as "no duplicates".
Engineering's ideation skill records its novelty check the same way, per system
([research](research/factory-sources-round4.md)).

**Fix and "Report a problem": reproduce before fixing.** From the Final MVP the Fix path and problem
reports on prototypes, and from the Enterprise phase problem reports that arrive as signals from
apps in production, run reproduction, then "bug, intended behavior or change request?", each in a
fresh context that passes a written report forward, before any fix. The isolation counters a
model's pull toward forcing a fix where there may be no bug. "Could not reproduce" and "working as
designed" are outcomes the reporter sees. The reporter gets a "Try the fix" card on the prototype,
and their confirmation is the Try it record. For an app in production, HyperDelivery reproduces the
bug and prototypes the fix in the sandbox, and the fix ships through Construction. Open reports per
project and time to a verified fix are tracked. Astro's issue triage, run this way, took its open
issues from over 200 to about 30 ([research](research/factory-sources-round4.md)).

**From ticket to Brief.** Every item lands as a Draft that the requester agrees to, with a source
reference on each line.

| Ticket element | Becomes |
|---|---|
| Summary and description | The Brief's "in your words" text, quoted rather than rewritten |
| Type, priority, labels, components, epic | Suggested path, depth and workspace |
| Reporter, assignee, watchers | Requester candidate and people to ask, labeled by role |
| Acceptance-criteria field | Seed acceptance criteria (proposed) |
| Each comment | A "What we heard" statement attributed to its author, which the author may correct |
| Attachments and linked Confluence pages | Pointed resources; open inline comments become open-question candidates |
| Issue links and description edits | Input to the duplicate check; scope history beside the Brief |

**Pointed-resource rules.** HyperDelivery reads as the person who pointed and re-checks access for
each later reader. Teams transcripts are pulled at point time, because meetings expire; where the
tenant blocks transcript access, the transcript file (`.vtt` or `.docx`) from the meeting recap can
be dropped instead. A pointed
spreadsheet is context, not app data (section 3).

### Inputs and outputs, step by step

"Section 4" means the signer matrix; agents are defined in the next subsection. The last column is
what a business user sees in the project workspace: the conversation on the left (question,
artifact and approval cards) and the artifact panel on the right (section 8). "Layer 2" means only
the detail view. The How Work Moves map, opened from the "?" menu in the top bar, shows the same
table step by step.

| Step | Inputs → outputs | Owner | Human | Kind | A business user sees |
|---|---|---|---|---|---|
| **Ideation** (Discover) | An idea, a Jira ticket, pointed resources or a signal → a Brief and a mockup signed at approval 1, the per-project index and a data map | | | | |
| 1.1 Intake | Idea, pointed links, Jira ticket or signal → new project or join as "one more voice"; proposed path | Orchestrator; Atlassian delegate checks duplicates | Requester chooses | Automated triage | The Home composer or New project · one box that recognizes Jira keys and links, source chips with logos |
| 1.2 Research | Pointed resources, Library (from Enterprise), System Maps → per-project index (ResourceRef → ResourceDigest), "Found in your sources", proposed facts | Context delegate; orchestrator | Requester picks sources; owners grant access | Automated | Sources tab (logo chips, index state); "Found in your sources" in the conversation |
| 1.3 Data discovery | Metrics and terms, data envelope, entitlement → data map: certified, canonical or not yet agreed, owner, classification, grain, profiles without rows, feasibility, target-tier floor, and the dev data a prototype could read (DataTask → DataFindings). Reads production metadata, counts and aggregates through the broker, never rows | Cortex Code data specialist | Requester confirms the numbers; steward answers in Teams | Automated; confirmations | Data tab (data table with certification badges) |
| 1.4 Brief | All of the above → problem in the requester's words, outcome, path, depth with time cost, proposed target tier, who to ask, verdict (go, clarify, redirect, park, stop) | Orchestrator; brief critic | Requester gives the verdict on the way to approval 1 | Drafted | Brief tab; depth picker; the line's first stretch |
| 1.5 Mockup | Brief, data map, visual choices, the UA app kit → the main screens as a visual mockup, with invented or dev-data figures, marked "Shape, not final" | Orchestrator, with a design skill and the UA app kit | Requester and business owner react | Drafted | Mockup tab |
| Approval 1 | Brief, mockup, data map → signed decision bound to each hash | Server (inert while a phase-boundary check fails) | Section 4 | **Approval** | Approval card in the conversation; decision bar in the panel; Teams card |
| **Inception** (Plan, then Prototype) | The signed Brief and mockup, index and data map → a signed plan (approval 2), then a working prototype in the sandbox on dev data with evidence per criterion (approval 3), then the handoff package | | | | |
| 2.1 Requirements | Signed Brief and mockup, index, data map → What we heard (attributed), decision records, requirements bound to certified definitions, assumptions | Orchestrator; Microsoft 365 delegate (cards); Atlassian delegate (Confluence page and comments) | Requester, contributors, steward | Capture automated; decisions saved only by a person | Question cards in the conversation and in Teams; margin questions; Confirm what we heard; Decisions tab with the decision timeline by person |
| 2.2 Stories | Requirements, decisions, the mockup → testable stories with acceptance criteria, what it skips; refines the mockup | Orchestrator; brief critic | Requester reacts | Drafted | Plan tab: "What you'll be able to do" |
| 2.3 Tech Design | Signed Brief and mockup, data map, golden paths, System Map → runtime, the refined clickable mock, architecture canvas, data design on dev data with a dev-to-production data map, classification, NFRs, cost, policy flags | Orchestrator; Cortex Code data specialist; architecture and data reviewer | Business owner; policy owners; engineering reviewer per section 4 | Drafted, agent-reviewed | Plan tab: "The plan" mock, "Which data it uses"; Architecture under More in Layer 2 |
| 2.4 Test Plan | Criteria, mock, data design → evidence plan per criterion, numbers-check targets (or "not checkable on dev data"), visual baseline, failing acceptance tests | Evidence agent; Cortex Code data specialist | Business owner; analyst optionally | Generated | Plan tab: "How we'll show it works" |
| 2.5 Tickets | Design, test plan → work graph of small, well-specified units, thin slice first; Jira drafts; budget | Orchestrator; Atlassian delegate files at the handoff | None | Drafted | Layer 2 only · "Pieces" |
| Approval 2 | Requirements, stories, mock, data, consequence line, test plan, tickets, cost → signed decision unlocking a prototype repository and pushes to it, the sandbox, dev-data grants and build spend; never Jira | Server (inert while decisions are open) | Section 4 | **Approval** | Approval card; decision bar with the consequence line; Teams card |
| 2.6 Prototype build | Signed tickets, template, agent instructions, failing tests, dev-data grants → one branch and pull request per build, a commit per piece, and a sandbox preview redeployed after each piece (BuildUnit → BuildResult) | Coding agent: one AgentCore harness session per build, in HyperDelivery's sandbox account | The person who can answer, when it asks a question | Automated; one piece per turn, in the signed order; two check rounds at most (the session's own tests, then CI on the pushed branch; a piece whose tests fail is not pushed); the build's pull request merges into the prototype repository after its checks pass | Progress row "Building 3 of 8"; Prototype tab; trace in Layer 3 |
| 2.7 Checks | Diffs, plan, policies → answered findings, scans, security verdict | Reviewers; scanners first | Platform engineer; code owner per section 4 | Automated; blocks on confirmed findings | Only when blocked · failure-and-recovery card |
| 2.8 Evidence | Preview, test plan → evidence per criterion; a numbers check against the golden report where the dev data allows one, otherwise "definitions match; numbers not checked on dev data" | Evidence agent; Cortex Code data specialist | Analyst optionally | Automated; a failed numbers check blocks approval 3 unless explained | Evidence in the Prototype tab; numbers-check table |
| 2.9 Looks like the mockup | Preview, refined mock, tokens → diff, responsive captures, WCAG 2.2 AA | Evidence agent; accessibility checker | Requester glances | Automated; blocking per section 4 | "Looks like the mockup" side by side |
| 2.10 Try it | Passing preview, named testers → point-and-say annotations become fixes; tester notes | Orchestrator; coding agent | Requester, owner, named testers | Human; informs approval 3 | "Try it" · the prototype with its "Sandbox, dev data" strip; Teams "Try it" card |
| Approval 3 | Evidence pack → signed decision bound to the commit SHA, releasing the handoff | Server | Section 4 | **Approval** | Approval card; decision bar; Teams card |
| 2.11 Handoff | Signed SHA, decision chain, evidence, target tier → handoff package (section 10), the recorded demo, what we learned; the Jira epic, issues and context files filed; the Construction decision requested | Orchestrator skills (packaging, demo, learning); Atlassian delegate; Microsoft 365 delegate | Requester presents the demo; the Construction owner decides | Automated; the Construction decision is a person's record, not an approval | "Handoff package ready"; Handoff view; Inbox item for the Construction owner; Teams digest |
| **Construction** (outside HyperDelivery for now) | The handoff package → a production-ready version on production data connections, through engineering's Code, Review, Manual QA, Visual QA and Deploy, AI-driven or AI-assisted with engineers | Engineering's pipeline | The Construction owner; engineering's gates | Engineering's | "After Handoff"; the project shows the Construction mode |
| **Operations** (outside HyperDelivery for now) | A released app → every later deployment and promotion, running, support, renewal or retirement | Engineering and UA's production teams | Per engineering and UA policy | Engineering's and UA's | Not shown; problem reports come back as signals (1.1) |

Inside HyperDelivery, Show and Learn are part of 2.11 Handoff, and Renew or retire becomes the
prototype's expiry (section 3).

### Agents and what they own

People hear one voice, HyperDelivery; specialists appear only in Layers 2 and 3. Each specialist
crosses one boundary, gets a context pack of cited excerpts instead of anyone's credentials, and
returns a typed result the orchestrator treats as untrusted input. Every delegation goes through
the delegation broker, trusted code in `tools/` rather than an agent, which picks the credential for
that one call (a service key from Secrets Manager in the Final MVP, minted per call in Enterprise),
sets its budget, checks the result against its contract and writes the trace span. Agent-to-agent
passes are always "delegations"; "handoff" means only the end-of-Inception package. The mechanics
are in
[platform-architecture.md section 2](platform-architecture.md#2-the-orchestrator-and-its-specialists).

| Agent | Owns | Crosses | Receives → returns |
|---|---|---|---|
| **Orchestrator** ("HyperDelivery") | The chat, the plan, the living document, every user-facing word; triage, Brief, mockup, Stories, Tickets, handoff packaging, demo and learning as skills | Nothing; asks the broker | People's turns, specialist results, signed decisions → plans, delegations, drafts |
| **Context delegate** (the resource reader) | Research; pointed resources; Confluence comments and revisions | AWS to Microsoft 365 and Atlassian, as the pointer | ResourceRef (a pointed link and who pointed) → ResourceDigest: statements with locators, decisions, questions, people |
| **Cortex Code data specialist** (CoCo) | Snowflake work: data discovery, profiling, drafting and checking queries, data design checks, the dev data a prototype reads, the numbers check | AWS to Snowflake, read-only | DataTask (question, envelope, budget) → DataFindings: objects, definitions, grain, counts, aggregates, query ids; never rows |
| **Coding agent** ("AgentCore harness, in the sandbox") | The prototype build and fixes: one session per build that works through the signed plan's pieces in order, asks when two readings would build different things, and commits each piece; the engine is swappable behind one contract | AWS to the sandbox AWS account, never the account that runs HyperDelivery; HyperDelivery, not the agent, pushes to the GitHub prototype organization | BuildUnit (signed ticket, acceptance tests, context pack) → BuildResult: commit, pull request, tests, criteria coverage, scans, evidence, cost |
| **Reviewers and QA** | Brief critic, architecture and data, security, code-review finders plus verifier, accessibility, evidence agent | The preview, as a test viewer | An artifact, diff or preview → Findings and evidence per criterion |
| **Atlassian delegate** | Jira duplicates; filing the epic, issues and context files at the handoff; the Confluence page | AWS to Atlassian; files to Jira only after approval 3; publishes the Confluence page on request | A question, or a write released by approval 3 → cited answers; filed issues |
| **Microsoft 365 delegate** | Teams cards, notifications, and the working-session panel in Enterprise | AWS to Microsoft 365 | A question or a card to send → cited answers; cards sent and answered |
| **Prototype monitor** | Prototype expiry, idle pause and cost | Sandbox prototypes, read-only | Usage, errors and cost telemetry → idle state, cost, expiry |

The builder never grades its own work: the evidence agent, not the coding agent, records evidence.

### How this lines up with engineering's variant

Engineering proposed Ideation (Research, Brief), Inception (Requirements, Stories, Tech Design, Test
Plan, Tickets) and Construction (Code, Review, Manual QA, Visual QA, Deploy). All twelve step names
survive verbatim, in engineering's phases and in engineering's order: HyperDelivery runs Ideation
and Inception and hands off where engineering's Construction tooling starts.

Engineering has since built its variant in UA's internal AI marketplace, for engineers working in
their coding tools: an ideation research skill covers Research and Brief, a separate AI-DLC
repository covers Inception, and the `construction` plugin's Jira-to-PR pipeline covers Code through
the pull request. It has gates of its own: research feeds a human intake gate, no file is written
before an engineer approves the plan, pushes and pull requests need an explicit yes, and every
acceptance criterion is checked in the running app
([research](research/ua-marketplace-alignment.md)).

Its `jira-to-pr` pipeline already runs in two modes: manual, where an engineer approves the plan,
and `--require-context`, which trusts the approved design in Inception's context files and skips
that approval
([research](research/ua-marketplace-alignment.md#1e-the-ai-dlc-handoff-context-files)). They are
the first candidate meanings of "AI-assisted with engineers" and "AI-driven" for the Construction
decision [confirm with engineering].

| Engineering's step | In UA-DLC | What changes, and why |
|---|---|---|
| Research | 1.2 | "Point at what you have": pointed resources indexed per project. Market and customer research is engineering's ideation skill, and a run of it can be pointed at like any resource (proposed) |
| Brief | 1.4 | Carries a verdict (go, clarify, redirect, park, stop) and is signed with the mockup at approval 1, not a separate confirmation |
| Requirements | 2.1 | Gathered from people on question cards; decisions kept outside the prose, settled by a person; signed with the plan at approval 2 |
| Stories | 2.2 | Signed with the plan at approval 2; the business already signed what it wants at approval 1, on the Brief and the mockup |
| Tech Design | 2.3 | Includes the refined clickable mock and the data design on dev data, because people approve what they can see |
| Test Plan | 2.4 | An evidence plan agreed before code and signed with the plan |
| Tickets | 2.5 | Always exist; filed to Jira with AI-DLC context files at the handoff, after approval 3, for every project with a T1 to T3 target; a "Prototype only" project keeps them in HyperDelivery |
| Code | Construction | Outside HyperDelivery: engineering's pipeline, AI-driven or AI-assisted with engineers per the Construction decision. HyperDelivery's prototype build in Inception uses its own step names (2.6 to 2.10), so the two never share a word |
| Review | Construction | Engineering's code-owner review and its gates on push, merge and release apply in both modes |
| Manual QA | Construction | Engineering's, on the production-ready version; business people try the prototype in Inception (2.10 Try it) |
| Visual QA | Construction | Engineering's; the prototype's comparison with the mockup is 2.9 |
| Deploy | Construction | The first release of the production-ready version, by a pipeline, never a model; later deployments and promotions are Operations [confirm with the other team] |

What we add: **Intake** (20 to 40% of requests should go elsewhere, and duplicates should join
existing work); **Data discovery** (certified definitions first; the target tier depends on the
data); **the Mockup** (Ideation's output, signed with the Brief); **a sandbox prototype on dev
data**, with automated evidence and people trying it, under its own step names; **the handoff
package** in engineering's format; and **three approvals named by the decision they record**,
signed per section 4 and bound to artifact hashes. Construction and Operations stay engineering's
and UA's. Engineering's own gates are engineer-facing and sit inside its tools; its tooling ends
after merge.

The step-by-step comparison with AWS AI-DLC, Anthropic's AI-native SDLC playbook, Microsoft's
guidance (Spec Kit, Foundry, Copilot Studio ALM) and the software factories (8090, Factory, Runlayer,
Chopin) is in
[research/ua-dlc-reconcile.md section 1](research/ua-dlc-reconcile.md#1-what-each-input-contributes).
What the line takes from them: Intake from the factories' triage and dedupe, the Brief's verdict from
Spec Kit, decisions kept outside the prose from Chopin, phase-boundary sensors from AI-DLC, the
mockup and the approval at the end of Ideation from AWS AI-DLC 2.x, the evidence plan from
Anthropic's sprint contract, and the prototype's expiry from Copilot Studio's explicit
decommissioning. Who else is building toward the same line, and what makes HyperDelivery different,
is in [research/dlc-landscape.md](research/dlc-landscape.md).

**Reuse before rebuilding.** Where engineering's contracts fit, HyperDelivery adopts them, pinned to
a version, instead of writing its own: the requirements-readiness check (each ticket `READY`,
`NEEDS_CLARIFICATION` or `BLOCKED` across eight dimensions, with no numeric override) and the
testability question for every acceptance criterion, as phase-boundary sensors before approval 2;
its evidence rules for the evidence agent (each criterion names its method and observation, and
passing unit tests are not evidence); its Confluence sync rules for the living document; and AI-DLC
context files in the handoff package (section 10). The full list is in
[the research](research/ua-marketplace-alignment.md#4-what-to-reuse-or-interoperate-with).

Open with engineering: research scope (the Research row above); who sits on its intake gate,
whether approval 1 can stand in for it, and whether a T2 or T3 target carries its value and
complexity scorecard; what AI-driven and AI-assisted with engineers mean in its pipeline, and who
owns the Construction decision; whether approval 2, co-signed by an engineering reviewer, can stand
in for its plan approval when an engineer picks up any handoff with `--require-context`; one
meaning and one owner for the name "UA-DLC", which engineering already uses for a documentation MCP
server and a skill prefix; where context files live, and the handoff format its Construction intake
accepts; and brownfield PR conventions (a Jira key in every commit, and whether HyperDelivery PRs
carry the `agentic-sdlc` label its KPI scorecard counts). The stop at Inception settles two earlier
questions: business people try prototypes in Inception (2.10 Try it) and Manual QA in Construction
is engineering's; and a build's pull request merges into its prototype repository on green checks,
with approval 3 signing the resulting commit, because nothing in a prototype repository reaches
production without Construction.

### Engineering-only work

For an opted-in repository or any handoff, Construction adds engineering's practices: a reviewed
System Map, ADRs, API contracts, a threat model and fuller test suites; code-owner review and
engineering's change process; SLOs, on-call and postmortems in Operations. With the stop at
Inception this is all of Construction: the prototype carries what it can, and the handoff package
lists the rest as the target tier's Construction checklist (section 10). The full list is in
[research/ua-dlc-reconcile.md section 7](research/ua-dlc-reconcile.md#7-what-engineering-only-work-adds).

### Mapping from the earlier UA-DLC stages and the code

| Earlier UA-DLC stage | Unified steps | Code |
|---|---|---|
| Intake | 1.1 Intake | Distill station |
| Frame | 1.4 Brief and 1.5 Mockup, with 1.2 Research and 1.3 Data discovery made explicit | Distill station |
| Discover | 2.1 Requirements, 2.2 Stories | Distill station |
| Plan | 2.3 Tech Design, 2.4 Test Plan, 2.5 Tickets | Blueprint station |
| Build and check | 2.6 Prototype build to 2.10 Try it (the prototype) | Review station |
| (implicit) | Deploy: Construction, outside HyperDelivery | Engineering's pipeline, not a station |
| Show and learn | 2.11 Handoff (package, demo, learning) | Showroom station; Learn is an orchestrator skill |
| (new) Operate, Renew or retire | Operations, outside HyperDelivery; inside it, only the prototype's expiry | Prototype monitor, scheduled |
| Graduate | Replaced by the handoff and the Construction decision | A decision record on the project |

In code, Distill covers 1.1 to 2.2, Blueprint 2.3 to 2.5, Review 2.6 to 2.10 and Showroom 2.11. The
`Station` enum does not need to change for UA-DLC to be adopted. The earlier stage names are
historical: as business labels on the line, Discover and Plan now name different stretches
(section 12).

## 2. The dials

Path decides which steps run. Depth decides how much each step writes and asks. The risk tier and
the target tier decide who signs and what the handoff package must contain. None of them changes the
number of approvals, and none changes what HyperDelivery builds: every project gets the same
prototype contract (section 3).

| Dial | Values | Set by | What it changes |
|---|---|---|---|
| **Path** | New idea, change something that exists, report into an app, fix, change this prototype | Proposed at Intake, confirmed in the Brief | Which steps run, and which run only on the delta |
| **Depth** | Light, Standard, Thorough | Proposed in the Brief, confirmed by the requester, with the time cost shown | How much the agents write and ask, whether a working session is suggested, review depth, whether approvals 1 and 2 share one sitting |
| **Risk tier** | Low, Medium, High | Deterministic rules set the floor; an AI classifier may raise it, never lower it | Adds co-signers and blocking reviews on top of the target tier's minimum; sets the default Construction mode (section 10) |
| **Target tier** | Prototype only, T1 Team app, T2 Department app, T3 Engineering-owned system | Proposed in the Brief from the workspace's data envelope and the risk floor, signed with approval 1, confirmed at approval 2 with the plan's data classification; HyperDelivery never moves a project up a tier | Who signs (section 4), what the handoff package must contain (section 10) and the default Construction mode. "Prototype only" is for work that ends with the prototype and what it taught; its Construction decision defaults to "Not now" |

The deterministic risk floor reads: the Snowflake classification tags on the objects the plan
touches, writes to systems of record, authentication or personal-data code, new infrastructure or
dependencies, and audience size. A data owner's envelope pre-approval sets the classification
floor for objects inside the envelope to Medium; objects outside it use their own tag. Until the
risk engine automates this in the Enterprise phase, the platform team sets the risk tier at approval 1 from these
rules.

**Path.** A means the step always runs, C when it applies, Δ on the change only, and "folded" means
a neighboring step absorbs it. Approvals always run.

| Step | New idea | Change something that exists | Report into an app | Fix | Change this prototype |
|---|---|---|---|---|---|
| Intake, Research | A | A, plus System Map | A, plus golden-report lookup | A (reproduction context) | Δ |
| Data discovery | C | C | A (bind to the semantic view) | C | C |
| Brief | A | A | A | Folded into the bug assessment | Folded into the change note |
| Mockup | A | A, starting from how it looks today | A, starting from the report's layout | C, when the fix changes a screen | Δ |
| Requirements, Stories | A | Δ | A | Symptom, cause, expected behavior | Δ |
| Tech Design | A | A; the owning team reviews the System Map | A (Streamlit in Snowflake as the Construction target) | Cause and fix approach | Δ |
| Test Plan | A | A, plus a test baseline before the change | A; numbers check required where the dev data allows one, otherwise in Construction | A failing test that reproduces the bug | A |
| Tickets | A | A | A | One unit | Δ |
| Prototype build to Try it | A (Looks like the mockup when there is a UI) | A | A | A; the reporter confirms on the prototype that the symptom is gone | A |
| Handoff | A | A package and a draft PR to the owning team | A package with a Streamlit in Snowflake target | A package; for an app in production the fix ships through Construction | A change note added to the existing package |

Construction and Operations are outside HyperDelivery on every path.

**Depth.**

| | Light | Standard | Thorough |
|---|---|---|---|
| Questions | One batch to at most two people | Role-labeled batches; optional working session | A working session and a stakeholder map |
| Data | Metadata and certified definitions | Plus profiling aggregates and a data design on dev data | Plus lineage and data-quality signals |
| Mockup | The main screen from the golden-path template | The main screens | The main screens with their empty, error and loading states |
| Design | Golden-path template and the refined mock | Plus the architecture canvas | Plus NFRs, ADRs and a threat sketch |
| Evidence | Browser checks from criteria | Plus the numbers check and a visual baseline | Plus accessibility, performance and adversarial cases |
| Try it | The requester | Plus 1 to 3 contributors | Plus a scripted acceptance session |
| Tickets | Filed at the handoff (T1 to T3 targets) | Filed at the handoff (T1 to T3 targets) | Filed at the handoff (T1 to T3 targets) |
| Approvals 1 and 2 | One sitting: the plan is drafted straight after the mockup | Separate | Separate |

**Target tiers.** HyperDelivery never moves a project up a tier: the target tier is set in the
Brief and the plan, and the work to reach it happens in Construction. What each target tier adds is
in section 3, and the handoff package carries it as a checklist (section 10).

## 3. The prototype contract and target tiers

Inside HyperDelivery every project produces the same thing, whatever its target tier: a prototype
in the sandbox on dev data.

### The prototype contract

| | Every HyperDelivery prototype |
|---|---|
| **Audience** | Project members and named testers (proposed: up to 25), signed in to the console |
| **Data** | Dev data only: synthetic data, a dev Snowflake database, or views data platform designates as dev data (to be agreed with data platform, a long-lead item). Data discovery may read production metadata, counts and aggregates through the delegation broker, never rows, to cite certified definitions; the prototype itself never connects to production data |
| **Writes** | None outside the sandbox |
| **Runtime** | Previews in HyperDelivery's sandbox AWS account, redeployed after each piece; an accepted prototype stays pinned to the commit signed at approval 3 |
| **Accountable owner** | Requester |
| **Operator** (runtime, patching, pause) | Platform team |
| **Support** | Self-serve, platform team best effort; a permanent banner (section 9) |
| **Life** | Paused after 7 idle days, deleted after 30 idle days; an accepted prototype stays open to its testers until 30 days after the Construction decision (proposed). Decisions, confirmed facts and the handoff package outlive it |
| **Changes** | Back through the line ("Change this prototype"); no hand edits |
| **Dependencies** | No other system may call it |

A prototype is not production. Nobody offers a service level, and the platform team or security can
pause any prototype at once. No prototype reads confidential data; production data connections are
made in Construction.

Because the prototype reads dev data, a numbers check against a golden report is often possible
only in Construction. The evidence then says "Definitions match the golden report; numbers not
checked on dev data" instead of claiming the numbers match (section 8).

Uploaded or pointed spreadsheets and reports are prototype input with synthetic replacement only;
landing them in Snowflake through the governed ingestion path is Construction work. The "report into
an app" path first checks whether the report is a golden report and binds the plan to its semantic
view; the prototype reads dev data shaped like it.

### Target tiers (built in Construction)

A target tier is where a project's production version is meant to land. It is proposed in the
Brief, signed with approval 1, confirmed at approval 2 and built in Construction. Inside
HyperDelivery it has two jobs: who signs (section 4) and what the handoff package must contain
(section 10). The table is the reference for that checklist; Construction and Operations own it
[confirm with engineering].

| | T1 Team app | T2 Department app | T3 Engineering-owned system |
|---|---|---|---|
| **Audience** | Up to 25 named teammates in one workspace (proposed) | Up to 150 internal teammates (proposed); every viewer needs a Snowflake user for data apps | Engineering decides |
| **Data** | Approved secure views inside the workspace's pre-approved data envelope, masked by role, including aggregated confidential measures the data owner pre-approved | Confidential data with data-owner approval, through governed views; no PII, PCI or HR data | Engineering and data platform standards |
| **Writes** | Read-only to systems of record | Read-only to systems of record | Through engineering's change process |
| **Runtime** | Streamlit in Snowflake for data apps, or a production runtime engineering names [confirm] | Streamlit in Snowflake, or engineering's platforms | Engineering's platforms |
| **Accountable owner** | Business owner | Business owner | Receiving engineering team |
| **Operator and support** | Operations, per UA policy [confirm who operates T1 and T2 apps] | Operations, per UA policy [confirm] | Engineering's standard support and on-call |
| **Life** | 90 days, then renew or retire | 12 months, then renew or retire | Normal lifecycle |
| **What Construction adds** | Production data inside the envelope in place of dev data; the app role and audience; a scoped app identity; a kill switch | Plus ratified metrics; the numbers check on production data and accessibility block; full security review at High | Plus a threat model, lineage, NFRs, CI coverage and browser tests, a runbook and alerts, an SBOM; change advisory at High |

## 4. Who signs

Minimum signers by target tier, with additions by risk tier. Every approval signs work on a
prototype on dev data; the target tier sets who must agree because it says where the work is going.

| | Low risk | Medium risk | High risk |
|---|---|---|---|
| **Prototype only** | Requester may sign all three approvals | Business owner (not the requester) | Business owner plus engineering reviewer; full security review blocks |
| **T1 Team app** | Business owner (not the requester) | Business owner plus data owner if data changes | Business owner, data owner and engineering reviewer; full security review blocks |
| **T2 Department app** | Business owner, data owner and engineering reviewer | Same; accessibility blocks | Same; accessibility, full security and architecture reviews block |
| **T3 Engineering-owned system** | Business owner, data owner and an engineering reviewer from the intended receiving team; the receiving team takes the Construction decision | Same | Same; change advisory joins in Construction |

In every cell, the security reviewer blocks on confirmed findings, and deterministic scans block on
high or critical findings. Other specialists advise unless the cell says they block.

- **Separation of duties** starts at a T1 target or Medium risk. In a prototype-only project at Low
  risk the requester may be their own business owner.
- **Strong sign-in** (Entra Conditional Access authentication context) is required for any
  High-risk approval, any change to an existing system and the Construction decision. Below that,
  the normal Teams or console sign-in is enough, including the approvals for a T2-target prototype
  on dev data at Low and Medium risk (proposed;
  [enterprise-plan.md section 14](enterprise-plan.md#14-open-questions-to-verify-internally) asks
  leadership to confirm it before the pilot). Strong sign-in arrives in the Enterprise phase. Until
  then, in the pilot: no High-risk approval happens; a change to an existing tool reaches its owning team only
  as a draft pull request that team reviews under its own rules (approval 3 releases the pull
  request with the handoff, never a merge), signed with the normal sign-in; and the Construction
  decision is recorded with the normal sign-in, which is safe because it unlocks nothing in
  HyperDelivery and engineering's own gates govern the Construction work.
- **Delegation, nudges and escalation:** an approver can delegate; after 2 business days in the
  approver's time zone the approver is nudged; after 5 the delegate or business owner is asked.
- **No bulk approve, ever.**

## 5. Roles

| UA-DLC role | Does | Entra app role | Project role | Existing design persona | Starts at |
|---|---|---|---|---|---|
| Requester | Brings the idea; owns the prototype; may sign all three approvals on a prototype-only project at Low risk | Builder | Owner | Requester (Riley) | Layer 1 |
| Business owner | Signs approvals; accountable for how the prototype is used; joins the Construction decision | Builder | Owner, approver | Approver (Priya) | Layers 1 to 2 |
| Contributor | Answers questions, comments, joins sessions | Contributor (every teammate, through a dynamic group) | Contributor | SME (Sam) | Layer 1 |
| Analyst | Checks numbers, traces requirements, exports | Builder or Viewer | Editor or Viewer | Analyst (Avery) | Layers 1 to 2 |
| Data owner | Approves access to their domain's data | Data Owner | Approver for data | (new) | Layer 2 |
| Data steward | Owns definitions; resolves disputes; proposes catalog entries | Data Steward | Contributor, plus a definitions-reviewer relation | (new) | Layer 2 |
| Engineering reviewer | Co-signs per the matrix; reviews System Maps and handoffs; advises on or takes the Construction decision | Engineering Reviewer | Approver for engineering | Developer (Dev) | Layers 2 to 3 |
| Construction owner | Decides AI-driven, AI-assisted with engineers or not now, and owns Construction; usually the receiving engineering lead, with the business owner | Engineering Reviewer | Construction owner | Developer (Dev) | Layers 2 to 3 |
| Policy owner | Signs changes to the rules agents follow (security, data governance, brand, accessibility) | Governance Admin | n/a | (new) | Layer 2 |
| Platform team | Runs HyperDelivery, golden paths, evaluations; operates the prototype sandbox | Platform Admin | n/a | (new) | Layer 3 |
| Champion | Helps teammates frame ideas, facilitates working sessions, first-line help, about 10% of their time | Builder | Any | (new) | Layers 1 to 2 |
| Sponsor | Owns the portfolio, priorities and value | Viewer | Viewer | Leadership (Lee) | Layer 1, aggregated |

Data owners and stewards come from UA's existing domain stewardship, not new hires. Estimated
load: per project, one access review and 2 to 5 definition questions, about 2 steward hours; about
10 hours a week across domains at 10 concurrent projects. Steward requests arrive as Teams cards or
catalog and Jira tasks, with a 2-business-day target and escalation to the domain's data owner.

During the Final MVP, pilot users hold these roles through project membership; the Entra app
roles in the table arrive with the Enterprise phase.

The orchestrator, the specialists (context delegate, Cortex Code data specialist, coding agent),
reviewers and the prototype monitor are agents, not roles.

## 6. A project in your week

Proposed starting budgets, validated with pilot users in the pilot. The first conversation shows them
when the requester picks a depth: each depth card says when the prototype is ready ("Ready in 3 days",
"Ready in 2 weeks", "Ready in 4 weeks"), and one line under the cards gives the requester's own time
("Your time: about 3 hours, for answers and reviews.").

| | Light | Standard | Thorough |
|---|---|---|---|
| Requester | 60 minutes or less | 3 hours or less | 5 hours or less |
| Business owner, across approvals | 20 minutes or less | 45 minutes or less | 90 minutes or less |
| Each contributor | 5 minutes or less | 15 minutes or less | 15 minutes plus a session |
| Working session | None | Optional | One, 45 to 60 minutes, 6 people or fewer |
| Calendar time | About 3 business days | About 2 weeks | 3 to 4 weeks |

Pointing at existing resources is what keeps the requester's time inside these budgets: a Jira
ticket or a meeting recording replaces most of what the requester would otherwise retype.

## 7. Rituals

- **Working session** (working names "Huddle" and "Working session", to be tested): Thorough depth
  or opt-in only. 45 to 60 minutes, 6 people or fewer, a one-paragraph pre-read, and a champion or
  platform coach facilitating the first ten. It runs low-tech until the Teams side panel ships
  (in the Enterprise phase at the earliest): an ordinary Teams meeting with the living
  document shared and a named scribe, then the recording or transcript pointed at afterwards.
  Contributors are credited by name in the document and the digest, and rate whether it was worth
  their time.
- **Async asks:** a question to the right person as a Teams card, with why they were asked. The
  card offers "Not me, suggest who" and "I don't know". HyperDelivery checks the per-project index
  (and the Library, from Enterprise) before asking a person, and sends each person at most one
  batched card per project per day.
- **Showcase:** the demo at the handoff, recorded, with the provenance strip burned in.
- **Weekly digest:** what was prototyped and handed off across UA and what was learned, credited to
  the people who contributed. Its numbers come from the Portfolio view.

## 8. Artifacts

### The living project document

One document people read, rendered from versioned records underneath. From the Final MVP it is
also published, on request, to one Confluence page per project, so people can comment where
engineering already works; HyperDelivery stays the system of record.

| Section | Who may change it | How |
|---|---|---|
| Brief | Requester | Edits directly; status Draft or Agreed, then signed with the mockup at approval 1 |
| Mockup | Requester and business owner | React in the conversation; HyperDelivery revises it |
| What we heard | Contributors | Confirm or reject captured statements; people may correct statements attributed to them |
| Decisions | Anyone permitted | Save and Reopen records; history is kept; the question text is frozen |
| Plan | Business owner | Suggested edits, accepted top to bottom |
| Evidence | Nobody | Generated, read-only |
| What it skips | Business owner | Generated, plus additions |
| Handoff package | Nobody | Generated at approval 3; the Construction owner adds the Construction decision |

Author marks show whether a person or HyperDelivery wrote each passage. Every reply in the side rail
quotes the request and names the person it answers.

**Comments and revisions from Confluence.** Each new comment, reply or human edit on the project's
page becomes a proposed record with a source reference to the comment and page version, after
instruction-like text is flagged. Nothing is settled automatically.

| A comment that is | Becomes | Settled by |
|---|---|---|
| A reply to a question HyperDelivery asked | An attributed answer | The requester, into the Brief or plan |
| A statement of how things are | A proposed fact, checked against certified definitions first | The person quoted; a steward for a metric |
| A proposal | An Open decision with alternatives | The named owner, in HyperDelivery or a Teams card (a Confluence "decided" mark is evidence, not the signature) |
| An objection | A reopened decision or an open issue | The owner |
| An edit inside a generated section | A suggested change the next publish keeps | The section owner |

### How artifacts are shown

Every project is one workspace, the way a chat app shows what it made beside the chat: the
conversation on the left and the artifact panel on the right. The panel has a tab for each artifact
that exists (Brief, Mockup, Plan, Prototype, Data, Sources, Decisions, with Timeline, Architecture
and Trace under More); an artifact that does not exist yet shows greyed, with when it will appear.
Artifact cards in the conversation open their artifact in the panel. An approval arrives as a card
in the conversation (the decision, who else signs, how long it has waited) and is signed in the
panel's decision bar: an attestation checkbox, "Sign and accept", "Send back" and "Ask someone". The
Teams card opens the same evidence. Construction items, where listed, read "After Handoff".

Every artifact has one system of record. Approvals bind to the version that was on screen when the
signer signed.

| Artifact | System of record | Where people see it | Who can edit | Versions and approvals |
|---|---|---|---|---|
| Brief | HyperDelivery | Brief tab; Confluence page | Requester | Hash signed at approval 1 |
| Mockup | HyperDelivery (UA app kit) | Mockup tab, marked "Shape, not final" | Generated; requester and business owner react | Signed with the Brief at approval 1 |
| What we heard | HyperDelivery, citing transcripts, comments, tickets | Question cards and Confirm what we heard in the conversation; margin questions; Teams cards | Each person corrects their own statements | Statements versioned; what was heard by then signed at approval 1, the rest at approval 2 |
| Decision records | HyperDelivery, apart from the prose | Decisions tab; decision timeline by person; Teams card to save | Anyone permitted saves or reopens | Frozen question; open decisions make approval 2 inert |
| Stories and acceptance criteria | HyperDelivery | Plan tab: "What you'll be able to do" | Generated; requester reacts | Signed at approval 2 |
| Refined clickable mock | HyperDelivery (UA app kit) | Plan tab: "The plan"; the decision bar | Business owner suggests edits | Plan revision signed at approval 2 |
| Data map | HyperDelivery: object names, definitions, query ids, never rows; the dev data the prototype reads and its production counterpart | Data tab: "Your data"; "Which data it uses" | Requester confirms; steward ratifies | In the plan revision |
| Architecture canvas (the project's own solution) | HyperDelivery | Architecture, under More, with a replay of the app's flows | Engineering reviewer comments | In the plan revision |
| Test plan | HyperDelivery | Plan tab: "How we'll show it works" | Business owner and analyst comment | Signed at approval 2 |
| Tickets | HyperDelivery work graph; Jira mirrors it at the handoff | Layer 2 "Pieces"; Jira for engineering | Generated | Graph revision signed at approval 2 |
| The build's pull request and the prototype | Prototype-organization repository, one pull request per build with a commit per piece; previews in the sandbox account | Prototype tab with the "Sandbox, dev data" strip; the "Building 3 of 8" progress row; trace in Layer 3 | Coding agent; people annotate in "Try it" | Commit SHA signed at approval 3 |
| Evidence pack | HyperDelivery evidence store, not the repository | Evidence in the Prototype tab and the decision bar, opened from the Teams card | Nobody | Bound to SHA and build id |
| Handoff package | HyperDelivery; Jira, the repository and context files mirror it | Handoff view; Inbox for the Construction owner | Generated | Bound to the SHA signed at approval 3; the Construction decision recorded against it |
| Demo package | HyperDelivery | Handoff view; Teams digest; recorded showcase | Requester edits the talk track | Versioned with the accepted prototype |
| Feedback themes | HyperDelivery | "What we learned"; Inbox for owners | Owner triages | Linked to their reports and change requests |

### Other artifacts

- **Decision records,** kept apart from the prose so a regenerated draft cannot change what people
  decided.
- **Context, bound to certified definitions first.** For every metric or term, HyperDelivery first
  looks up the certified definition (a Snowflake semantic view or golden report, then the
  catalog). If one exists, the plan uses it. A metric with no certified definition is labeled
  "not yet agreed" (unratified): allowed in a prototype, and a T2 or T3 target needs it ratified by
  a steward before the handoff. HyperDelivery proposes catalog entries as steward requests and holds
  no catalog write access.
- **Per-project index** on AWS (one knowledge base per project) of everything people pointed at,
  with each source's owner, version, freshness and access list. It is deleted with the project;
  confirmed facts and decisions outlive it in the Library.
- **System Map** for each opted-in repository or system a project touches, reviewed by its owning
  team's tech lead.
- **Evidence pack** at each approval: per-criterion screenshots or recordings, a numbers check
  that reconciles 3 to 5 headline figures against the golden report or certified dashboard with
  the same filters (a failed check blocks approval 3 unless the owner records why), and "how this
  number is calculated" for each figure. On dev data the evidence shows "Definitions match the
  golden report; numbers not checked on dev data", and the check against the golden report runs in
  Construction, unless the dev data is a designated copy that can be reconciled; on synthetic data
  it shows "Numbers not checked: synthetic data".
- **Handoff package** at the end of Inception (section 10).

## 9. Support for prototypes

| | Who helps the user | Who is called when it breaks | Response |
|---|---|---|---|
| Using HyperDelivery | Champions, Teams help channel, weekly office hours | Platform team | Business hours |
| A prototype | Self-serve; the requester | Platform team, best effort | Business hours, best effort |
| An app built through Construction | Construction and Operations, by target tier (section 3) | Per UA policy for the target tier | Operations' standard |

Every prototype shows a persistent banner (Prototype, "Sandbox, dev data" or "Synthetic data",
the owner, the expiry) and a "Report a problem" button that opens a change request back into the line. HyperDelivery has its own service
desk category, owned by the platform team. Prototypes are not supported by data platform on-call.
Production support is Construction's and Operations' from the first release.

## 10. Handoff and the Construction decision

Every project ends at approval 3 with a handoff. HyperDelivery packages what Construction needs,
the receiving team reviews it, and the Construction owner records how Construction will run. Nothing
in this section deploys anything.

**Brownfield rule.** For any repository HyperDelivery did not create, HyperDelivery never merges.
Approval 3 accepts the prototype on a branch and preview and releases a draft pull request to the
owning team with the handoff; the owning team merges in Construction, through its own change
process. Repositories opt in one at a time: the owning team installs the HyperDelivery GitHub App on
that repository only, keeps its code owners, and adds an agent-instructions file with its
constraints. HyperDelivery is never a ruleset bypass actor.

**The handoff package,** released by approval 3 and bound to its commit SHA:

- A Jira epic and issues (for a T1 to T3 target), filed from the work graph, and a Confluence page
- AI-DLC context files in engineering's format, one per ticket and one for the epic, filled from the
  units, decision records and work graph so an engineer can continue in engineering's own pipeline,
  and validated against engineering's schema [confirm the validator with engineering]; the same files
  go on brownfield tickets once engineering accepts HyperDelivery as a source (see
  [the research](research/ua-marketplace-alignment.md#4a-hyperdelivery-fields-that-fill-an-ai-dlc-context-file))
- The repository (transferred from the prototype organization when engineering accepts it, or a
  draft pull request for an existing repository) with a `devcontainer.json`
- The Brief, the mockup, the signed plan and the decision-record chain with hashes
- The evidence pack, "what it skips" and the recorded demo
- A dev-to-production data map: for each dev object the prototype read, the governed production
  object, its owner and classification, and the grants Construction will need
- The target tier's Construction checklist (below), with what the prototype already has marked
- The Construction decision, once recorded

**The Construction checklist.** What the prototype already has, and what Construction adds by
target tier:

| Item | The prototype has | Construction adds |
|---|---|---|
| Acceptance criteria encoded as browser tests | Yes, run against the preview | A run against the production-ready version; in CI for T3 |
| Tests in CI with a coverage report | The build's tests and CI on the prototype repository | Coverage to engineering's standard (T3) |
| Clean secret, dependency and code scans; a license check | Yes | A re-run in engineering's pipeline; an SBOM (T3) |
| Accessibility and the numbers check | WCAG 2.2 AA checks; the numbers check where the dev data allows one | Both blocking, on production data (T2, T3) |
| A threat model and data lineage | A threat sketch at Thorough depth | The full threat model and lineage (T3) |
| A runbook, logs, metrics and alerts | Preview logs only | T3; for T1 and T2, what Operations requires [confirm] |
| Golden-path conformance and a run-cost estimate | Yes, on the sandbox | Confirmed on the production runtime |
| "What it skips" | Yes | Engineering decides which skips to close |
| Data | Dev data, with the dev-to-production data map | Governed production connections for the target tier |
| For data apps | Certified definitions cited; dev objects | Objects in a governed database owned by a functional role, deployed by data platform CI, certified sources, metrics from semantic views, masking and row access verified, a resource monitor, a data contract, steward and owner sign-off |

**The Construction decision.** After approval 3 the Construction owner (the receiving engineering
lead, with the business owner) chooses one of three, and HyperDelivery records it as a decision
record against the handoff package. It is not a fourth approval: it is UA's sourcing decision about
production work, made by different people, outside HyperDelivery's build. Approval 3's signers may
state a preference, which goes in the package.

| Choice | What it means | First meaning in engineering's pipeline |
|---|---|---|
| AI-driven | Agents build the production-ready version from the handoff, under engineering's gates on push, merge and release | `jira-to-pr --require-context`, which trusts the approved design in the context files and skips the plan approval [confirm with engineering] |
| AI-assisted with engineers | Engineers build it with their own tools and agents, approving the plan themselves; they may rebuild from the plan | `jira-to-pr` in manual mode: its first phases run on the context files and an engineer approves the plan [confirm with engineering] |
| Not now | The package and the decision chain are kept; nothing is built | None; the prototype expires on its normal schedule |

**Defaults by risk and target tier.** The default is the former "both, by risk tier" production
path (proposed):

- **AI-driven** only when every condition holds: Low risk, read-only, no authentication or
  personal-data code, no writes to systems of record, and a T1 or T2 target without confidential
  data.
- **AI-assisted with engineers** for everything else, and always for sensitive data,
  authentication, writes to systems of record, a change to a core or existing system, a T3 target
  or High risk.
- **Not now** for a prototype-only project.

The Construction owner may choose otherwise and records why. In both modes engineering's gates on
push, merge and release apply, and a pipeline, never a model, deploys.

**Engineering's rights:** accept or decline a handoff within 10 business days with written reasons;
an intake cap until the scale decision (proposed: 2 per receiving team per quarter); and **"rebuild
from the plan"** as a first-class outcome, where engineers build from the plan, decisions and
evidence instead of adopting generated code. In AI-driven Construction the Construction owner
answers for the result under the same gates. The receiving team for each workspace is named before
the pilot.

**Hypercare.** Thirty days of platform-team hypercare follow every accepted handoff: the platform
team answers questions about the package and the prototype, and the prototype stays open to its
testers.

**Whether HyperDelivery runs Construction later** is decided at the scale decision, on handoff
evidence (handoffs accepted without a rewrite, findings per repository, time from handoff to first
release). Nothing is built for it before then.

## 11. Notification policy

| Event | Who | Channel | Batching | Reminder | Escalation |
|---|---|---|---|---|---|
| Question for you | The named person | Teams card | One card per project per day | 1 business day | Suggested alternative after 3 |
| Approval waiting | The assigned approver | Teams card, opening the evidence to sign | Immediate | 2 business days | Delegate or business owner after 5 |
| Construction decision waiting | Construction owner | Teams card, opening the handoff package | Immediate | 2 business days | Engineering leadership after 5 |
| Your project moved | Requester, owner | Teams activity feed | Grouped hourly | n/a | n/a |
| A source changed or lost access | Project owner, the person who pointed at it | Console; Teams activity feed | Grouped daily | n/a | n/a |
| Something failed | Requester, platform engineer on duty | Teams; console | Immediate | n/a | Platform team |
| Weekly digest | Workspace members, sponsor | Channel post | Weekly | n/a | n/a |

All timing uses the recipient's working hours and time zone (Baltimore, Amsterdam, Bengaluru).
Until the Teams cards ship in the Final MVP (the Teams app is a long-lead request due by about
week 10), questions and approvals arrive as email deep links into the console. From then, contributors can do their whole
job in Teams, and approvers sign in the evidence view the card opens; requesters start projects in
the console until the Teams message extension arrives.

## 12. Glossary

Every user-facing term is tested with teammates before it ships (GitHub's Chopin found that users
read "decision" as "already decided").

| Process term | Label in the product | May appear in Layer 1? |
|---|---|---|
| Brief (Draft, Agreed, then signed at approval 1) | Brief | Yes |
| Spec | Not used: in apparel "spec" means a garment tech pack | No |
| Mockup (Ideation's output: the main screens in the UA app kit, signed with the Brief at approval 1) | Mockup | Yes |
| Approval 1, 2, 3 | "Your approval: what we're building", "...the plan", "...the working prototype" | Yes, named by decision, not number |
| Confirmation (one person agrees; not an approval: Confirm what we heard, tester notes) | "Agree", "Confirm" | Yes |
| Ideation, Inception, Construction, Operations (the four phases; HyperDelivery runs the first two) | Not shown | No: Layer 2, the Portfolio for leads, engineering docs |
| The four stretches of the line: up to approval 1, up to approval 2, up to approval 3, and the handoff | Discover, Plan, Prototype, Handoff, as segment labels on the line | Yes |
| Construction (engineering's Code, Review, Manual QA, Visual QA and Deploy: a production-ready version on production data connections; outside HyperDelivery for now) | "After Handoff", dashed, where shown | Layer 2 and the Handoff view only |
| Operations (every deployment and promotion after Construction's first release, and running the app; AWS AI-DLC 2.x calls it Operation; outside HyperDelivery for now) | "After Handoff", dashed, where shown | Layer 2 only |
| Intake (triage of a new idea, ticket or signal) | "New project" and the Home composer | Yes |
| Data discovery (certified sources, owners, grain and feasibility, found before the Brief) | "Data" | Yes |
| Checks and Evidence (2.7 scans and reviews; 2.8 proof per criterion plus the numbers check) | "Checks", "Evidence" | Yes |
| The other step names | Research "Found in your sources"; Requirements "What we heard" and "Decisions"; Stories "What you'll be able to do"; Tech Design "The plan"; Test Plan "How we'll show it works"; Tickets "Pieces"; Prototype build "Building"; Looks like the mockup "Looks like the mockup"; Try it "Try it"; Learn "What we learned" | Yes, except "Pieces" and Tech Design beyond the mock (Layer 2) |
| Working session, Huddle | To test | Yes, after testing |
| Handoff (the end of Inception: the package, the demo and the Construction decision; never an agent-to-agent pass) | Handoff | Yes |
| Handoff package (released by approval 3: Jira epic and issues, context files, repository, decision chain, evidence, what it skips, dev-to-production data map, the target tier's Construction checklist) | "Handoff package" | Yes |
| Construction decision (a decision record, not an approval: the Construction owner chooses how Construction runs) | "AI-driven", "AI-assisted with engineers", "Not now", to test | Yes, after testing |
| Graduate, go live, Deploy at a tier (retired: HyperDelivery stops at the handoff) | Not used; never "Live" or "Graduate" | No |
| Evidence pack (per-criterion proof at approval 3; engineering's research skill uses the same name for its research ledger, so "acceptance evidence" is proposed for ours) | Evidence | Yes |
| Decision record | Decision | Yes, with status words (Open, Settled) |
| Context atom | Fact, with its source | "Fact" only |
| Certified (defined in a Snowflake semantic view or golden report) | Certified | Yes |
| Canonical (a confirmed fact a steward ratified for the workspace) | Canonical | Yes |
| Unratified (a metric with no certified definition) | Not yet agreed | Yes |
| Uncertified (a number not reconciled to a golden report) | Uncertified, on the number | Yes |
| Orchestrator (the one assistant that runs the conversation, the plan and the living document) | HyperDelivery | Yes, as HyperDelivery |
| Specialist (an agent that does bounded work across one boundary: context delegate or resource reader, Cortex Code data specialist, coding agent, reviewers) | Named only in the detail views | No: Layers 2 and 3 |
| Delegation (the orchestrator handing a typed task to a specialist through the delegation broker; never called a handoff) | "Asked Cortex Code for margin per door" | No: Layers 2 and 3 ("Decisions and Delegations") |
| Context pack (the cited excerpts a specialist receives instead of anyone's credentials) | Not shown | No |
| Pointed resource (a Teams recording, OneDrive folder, Jira ticket or Confluence page HyperDelivery reads as the person who pointed at it, instead of an upload) | Source | Yes |
| Per-project index (the project's searchable store of its pointed resources, deleted with the project) | Sources | Yes |
| System Map | How it works today | Layer 2 |
| Dev data (synthetic data, a dev Snowflake database, or views data platform designates as dev data: the only data a prototype connects to) | "Dev data", on the prototype's "Sandbox, dev data" strip | Yes |
| Prototype contract (what every HyperDelivery project produces: a prototype in the sandbox on dev data, for members and named testers, with an expiry) | Prototype | Yes |
| Target tier (where the production version is meant to land, built in Construction: T1 Team app, T2 Department app, T3 Engineering-owned system; "Prototype only" for work that ends with the prototype) | "Target: T1 Team app", "Target: T2 Department app", "Target: T3 Engineering-owned", "Prototype only" | Plain names only |
| UA-DLC, golden path, depth | Not shown | No |

## 13. Second department criteria

One of the partner functions in the pilot is the recommended second department, chosen against
these criteria and confirmed or replaced at the pilot readout; it opens at Enterprise ready (week
36). A department qualifies when:

- Its core data is in certified data products with semantic views, or data platform commits to
  building one or two for it.
- Sensitive columns are classified and protected by policy.
- A named domain steward has agreed capacity.
- The first project is Internal-classified, read-only, with a T1 target; its prototype runs on dev
  data.
- Finance and People are excluded for the second department (SOX and personal data).

The department commits: a business owner (about 1 hour a week), a champion (about 10%), 3 to 5
requesters, and a data steward (about 2 hours a week). HyperDelivery is centrally funded until the
scale decision, where chargeback is decided.

## 14. Enablement

- **Final MVP, friendly users (from week 8) and the pilot:** a 30-minute onboarding, a Teams help
  channel, weekly office hours, and a feedback button on every screen.
- **Enterprise hardening:** a champion per workspace, an onboarding playbook, and an AI-literacy
  module completed before EMEA teammates get access (the EU AI Act's literacy duty has applied to
  deployers since February 2025).
- **Enterprise rollout and scale:** build days and an "ideathon in the product" as each department
  joins, and a community of champions across workspaces.
