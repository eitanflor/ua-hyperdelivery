# UA-DLC operating model

How the Under Armour AI Delivery Lifecycle works in detail: the line, what goes in and comes out of
each step, the dials, who signs, who supports what, how much of people's time it takes, and how work
reaches engineering. The summary and the ask are in [enterprise-plan.md](enterprise-plan.md); the
technical design is in [platform-architecture.md](platform-architecture.md).

Status: proposal, 2026-10-25, re-phased 2026-10-26. Numbers marked "proposed" are starting targets
to validate with pilot users during the pilot. HyperDelivery's phases (Current State, Final MVP,
Enterprise) describe how HyperDelivery itself matures and are defined in
[enterprise-plan.md section 9](enterprise-plan.md#9-roadmap-three-phases); lifecycle tiers (T0 to
T3, section 3) describe a single project's app. The T2 tier is called Department app so it is never
confused with the Final MVP phase.

## 1. The line

UA-DLC uses the phase and step names UA engineering proposed (Ideation, Inception, Construction),
which come from AWS AI-DLC, adds an Operation phase so something owns a prototype after it ships,
and keeps three standing approvals named by the decision they record.

```
IDEATION      Intake → Research → Data discovery → Brief (confirmation)
INCEPTION     Requirements → Stories → [Approval 1: what we're building] → Tech Design → Test Plan → Tickets → [Approval 2: the plan]
CONSTRUCTION  Code → Review → Automated QA → Visual QA → Manual QA → [Approval 3: the working prototype] → Deploy
OPERATION     Show → Operate → Learn → Renew or retire      ◇ Graduate (optional, one approval per tier move)
              Learn feeds Intake. Graduate re-enters at Tech Design for the delta.
```

At Light depth, approvals 1 and 2 can be presented in one sitting: two signatures, one review. Both
sit in Inception, with only Tech Design, Test Plan and Tickets between them. The approvals stay; the
interruptions halve.

### Rules

- **Risk decides who signs, never how many approvals there are** (section 4). No bulk approve.
  Deterministic checks block; model reviewers advise unless the signer matrix says they block.
- **Phase names are process vocabulary:** these docs, engineering's Jira, Layer 2 (including the
  How Work Moves map, opened from the "?" menu) and the Portfolio for leads, never Layer 1. Business users see step labels (section 12) and the line.
- **A confirmation is not an approval.** The Brief, "Confirm what we heard", tester notes and
  renewals are confirmations: one person, no co-signers, no strong sign-in.
- **Every step writes a versioned artifact, and each approval binds to hashes.** Later edits show
  as "3 changes since approval". Confluence may render the living document for comments; the signed
  version is HyperDelivery's.
- **Phase-boundary checks are sensors.** At each boundary the server checks traceability (criterion
  to story to requirement; ticket to criterion and proof). A failed check makes the next approval
  inert, with the reason shown.
- **Writes outside the conversation wait for their approval.** Repository creation, pushes, Jira
  filing and the start of a coding-agent build happen only after the authorizing approval is signed.

### The three approvals

| | Label in the product | What is signed | Binds to | Unlocks |
|---|---|---|---|---|
| **Approval 1** | "Your approval: what we're building" | Brief, What we heard, decisions, requirements, stories and acceptance criteria, wireframe | The hash of each artifact version | Tech Design work; nothing external |
| **Approval 2** | "Your approval: the plan" | Mock, data used, consequence line (tier, data, audience, expiry), test plan, tickets, cost, reviewer findings | Plan revision and work-graph revision | A repository in the prototype organization, Jira filing, the sandbox, sandbox-schema grants |
| **Approval 3** | "Your approval: the working prototype" | Evidence per criterion, numbers check, scans, tester notes, what it skips | Commit SHA and build id | Deploy at the tier signed at approval 2; a PR to the owning team for an existing repository |
| **Graduate** (optional) | "Go wider" or "Hand to engineering" | Readiness checklist and delta evidence | The delta's SHA | The next tier's audience and runtime, or the handoff |

Approval 3 authorizes Deploy at the tier signed at approval 2. A project whose plan set T1 goes live
for its named testers when approval 3 is signed, with no fourth sign-off. Graduate is only for
moving above the tier signed at approval 2.

### Where a project starts

Nothing has to be uploaded. People describe the idea, point at what already exists, or both, and
HyperDelivery reads what they point at as them.

| Starting point | What Intake does | First artifact |
|---|---|---|
| **From scratch**: the idea in one box, optionally with links | Checks Jira and running projects for duplicates | A draft Brief, or a join as "one more voice" |
| **From a Jira ticket**: a key or link | Reads fields, comments, attachments, remote links and changelog (through an allowlisted service token until per-user sign-in in the Enterprise phase; mapping below); writing back to the ticket is an explicit button or waits for approval 2, with the Jira filing | A draft Brief quoting the ticket, sourced line by line |
| **From pointed resources**: a Teams meeting or recording, a OneDrive or SharePoint folder, a Confluence or Loop page | Checks the person can read each one and its label fits the project, says "project members will be able to ask about this", then the context delegate indexes it | Source chips (Reading, Indexed, Stale, Snapshot, Needs access, Access lost, Blocked by tenant setting) and "Found in your sources" |
| **From a signal**: "Report a problem" on a live app, or a feedback theme | Attaches it to the app's project as a change request, or opens a new idea when out of scope | A change note or a draft Brief |
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

**Fix and "Report a problem": reproduce before fixing.** From the Final MVP the Fix path, and from
the Enterprise phase (with Operate) problem reports from live apps, run reproduction, then "bug,
intended behavior or change request?", each in a fresh context that hands a written report
forward, before any fix. The isolation counters a model's pull toward forcing a fix where there may
be no bug. "Could not reproduce" and "working as designed" are outcomes the reporter sees. The
reporter gets a "Try the fix" card on the preview, and their confirmation is the Manual QA record.
Open reports per live app and time to a verified fix are tracked. Astro's issue triage, run this
way, took its open issues from over 200 to about 30 ([research](research/factory-sources-round4.md)).

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
the screen and component a business user sees; "Layer 2" means only the detail view. The How Work
Moves map, opened from the "?" menu in the console's top bar, shows the same table step by step.

| Step | Inputs → outputs | Owner | Human | Kind | A business user sees |
|---|---|---|---|---|---|
| **Ideation** | An idea, a Jira ticket, pointed resources or a signal → an agreed Brief, the per-project index and a data map | | | | |
| 1.1 Intake | Idea, pointed links, Jira ticket or signal → new project or join as "one more voice"; proposed path | Orchestrator; Atlassian delegate checks duplicates | Requester chooses | Automated triage | Start a project · one box, starter ideas, source chips with logos |
| 1.2 Research | Pointed resources, Library (from Enterprise), System Maps → per-project index (ResourceRef → ResourceDigest), "Found in your sources", proposed facts | Context delegate; orchestrator | Requester picks sources; owners grant access | Automated | Sources panel (logo chips, index state), "Found in your sources" |
| 1.3 Data discovery | Metrics and terms, data envelope, entitlement → data map: certified, canonical or not yet agreed, owner, classification, grain, profiles without rows, feasibility, tier floor (DataTask → DataFindings) | Cortex Code data specialist | Requester confirms the numbers; steward answers in Teams | Automated; confirmations | "Your data" panel (data table with certification badges) |
| 1.4 Brief | All of the above → problem in the requester's words, outcome, path, depth with time cost, proposed tier, who to ask, verdict (go, clarify, redirect, stop) | Orchestrator; brief critic | Requester agrees or stops | Confirmation | Brief section, depth picker, the line's first segment |
| **Inception** | The agreed Brief, index and data map → signed scope (approval 1), then a signed plan with mock, data design, test plan and tickets (approval 2) | | | | |
| 2.1 Requirements | Brief, index, data map → What we heard (attributed), decision records, requirements bound to certified definitions, assumptions | Orchestrator; Microsoft 365 delegate (cards); Atlassian delegate (Confluence page and comments) | Requester, contributors, steward | Capture automated; decisions saved only by a person | Teams question card; margin questions; Confirm what we heard; decision timeline by person |
| 2.2 Stories | Requirements, decisions, visual choices → testable stories with acceptance criteria, a wireframe, what it skips | Orchestrator; brief critic | Requester reacts | Drafted | "What you'll be able to do", wireframe |
| Approval 1 | Brief through Stories → signed decision bound to each hash | Server (inert while decisions are open) | Section 4 | **Approval** | Approval screen; Teams card |
| 2.3 Tech Design | Signed scope, data map, golden paths, System Map → runtime, clickable mock, architecture canvas, data design, classification, NFRs, cost, policy flags | Orchestrator; Cortex Code data specialist; architecture and data reviewer | Business owner; policy owners; engineering reviewer per section 4 | Drafted, agent-reviewed | "The plan" mock, "Which data it uses"; canvas in Layer 2 |
| 2.4 Test Plan | Criteria, mock, data design → evidence plan per criterion, numbers-check targets, visual baseline, failing acceptance tests | Evidence agent; Cortex Code data specialist | Business owner; analyst optionally | Generated | "How we'll show it works" |
| 2.5 Tickets | Design, test plan → work graph of small, well-specified units, thin slice first; Jira drafts; budget | Orchestrator; Atlassian delegate files after approval 2 | None | Drafted | Layer 2 only · "Pieces" |
| Approval 2 | Mock, data, consequence line, test plan, tickets, cost → signed decision unlocking repository, Jira, sandbox, grants | Server | Section 4 | **Approval** | Approval screen with the consequence line |
| **Construction** | The signed plan → a working prototype with evidence per criterion (approval 3), released at its tier | | | | |
| 3.1 Code | Signed tickets, template, agent instructions, failing tests → one branch and pull request per build, a commit per piece, and a preview redeployed after each piece (BuildUnit → BuildResult) | Coding agent: one AgentCore harness session per build, in HyperDelivery's sandbox account | The person who can answer, when it asks a question | Automated; one piece per turn, in the signed order; two check rounds at most (the session's own tests, then CI on the pushed branch; a piece whose tests fail is not pushed); the build's pull request merges into the prototype repository after its checks pass | "Building 3 of 8"; trace in Layer 3 |
| 3.2 Review | Diffs, plan, policies → answered findings, scans, security verdict | Reviewers; scanners first | Platform engineer; code owner per section 4 | Automated; blocks on confirmed findings | Only when blocked · failure-and-recovery block |
| 3.3 Automated QA | Preview, test plan → evidence per criterion; numbers check against the golden report | Evidence agent; Cortex Code data specialist | Analyst optionally | Automated; failed numbers check blocks approval 3 unless explained | "Evidence" drawer; numbers-check table |
| 3.4 Visual QA | Preview, mock, tokens → diff, responsive captures, WCAG 2.2 AA | Evidence agent; accessibility checker | Requester glances | Automated; blocking per section 4 | "Looks like the plan" side by side |
| 3.5 Manual QA | Passing preview, testers → point-and-say annotations become fixes; tester notes | Orchestrator; coding agent | Requester, owner, testers | Human; informs approval 3 | "Try it" · preview with provenance bar; Teams "Try it" card |
| Approval 3 | Evidence pack → signed decision bound to the commit SHA | Server | Section 4 | **Approval** | Approval screen; Teams card |
| 3.6 Deploy | Signed SHA, tier, audience → release at the tier signed at approval 2, scoped app identity, banner, kill switch; or a PR to the owning team | Deterministic pipeline | None | Automated | "Live for 23 people"; app banner |
| **Operation** | A live app → a demo, health and cost, feedback themes and Library facts, then renewal, retirement or graduation | | | | |
| 4.1 Show | App, evidence → demo package, showcase, notes to the people who asked | Orchestrator; Microsoft 365 delegate | Requester presents | Automated | Show tab; Teams digest |
| 4.2 Operate | Usage, errors, cost, freshness → health, incidents, tiered response | Ops monitor; platform team | Platform team; owner at T1 | Automated; fixes go back through the line | Banner, Home card, Portfolio |
| 4.3 Learn | Feedback, corrections, measures → themes, candidate rules, Library facts | Orchestrator; context delegate | Owner; policy owner; steward | Rules approved in Admin, not as gates | "What we learned"; Library |
| Graduate | Readiness delta → checklist, delta work, decision; at T3 the handoff package | Orchestrator; reviewers; Atlassian delegate | Owner, co-signers, receiving team | **Optional approval** | Graduation view |
| 4.4 Renew or retire | Maximum life, idle signals → renewal, or cleanup that keeps decisions and facts | Orchestrator (scheduled) | Owner renews | Confirmation | Inbox item; banner expiry |

### Agents and what they own

People hear one voice, HyperDelivery; specialists appear only in Layers 2 and 3. Each specialist
crosses one boundary, gets a context pack of cited excerpts instead of anyone's credentials, and
returns a typed result the orchestrator treats as untrusted input. Every handoff goes through the
delegation broker, trusted code in `tools/` rather than an agent, which picks the credential for that
one call (a service key from Secrets Manager in the Final MVP, minted per call in Enterprise), sets
its budget, checks the result against its contract and writes the trace span. The
mechanics are in
[platform-architecture.md section 2](platform-architecture.md#2-the-orchestrator-and-its-specialists).

| Agent | Owns | Crosses | Receives → returns |
|---|---|---|---|
| **Orchestrator** ("HyperDelivery") | The chat, the plan, the living document, every user-facing word; triage, Brief, Stories, Tickets, demo and learning as skills | Nothing; asks the broker | People's turns, specialist results, signed decisions → plans, delegations, drafts |
| **Context delegate** (the resource reader) | Research; pointed resources; Confluence comments and revisions | AWS to Microsoft 365 and Atlassian, as the pointer | ResourceRef (a pointed link and who pointed) → ResourceDigest: statements with locators, decisions, questions, people |
| **Cortex Code data specialist** (CoCo) | Snowflake work: data discovery, profiling, drafting and checking queries, data design checks, the numbers check | AWS to Snowflake, read-only | DataTask (question, envelope, budget) → DataFindings: objects, definitions, grain, counts, aggregates, query ids; never rows |
| **Coding agent** ("AgentCore harness, in the sandbox") | Code and fixes: one session per build that works through the signed plan's pieces in order, asks when two readings would build different things, and commits each piece; the engine is swappable behind one contract | AWS to the sandbox AWS account, never the account that runs HyperDelivery; HyperDelivery, not the agent, pushes to the GitHub prototype organization | BuildUnit (signed ticket, acceptance tests, context pack) → BuildResult: commit, pull request, tests, criteria coverage, scans, evidence, cost |
| **Reviewers and QA** | Brief critic, architecture and data, security, code-review finders plus verifier, accessibility, evidence agent | The preview, as a test viewer | An artifact, diff or preview → Findings and evidence per criterion |
| **Atlassian delegate** | Jira duplicates and filing; the Confluence page | AWS to Atlassian; writes after approval 2 | A question, or a write released by approval 2 → cited answers; filed issues |
| **Microsoft 365 delegate** | Teams cards, notifications, and the working-session panel in Enterprise | AWS to Microsoft 365 | A question or a card to send → cited answers; cards sent and answered |
| **Ops monitor** | Operate and expiry | Live apps, read-only | Usage, errors, cost and freshness telemetry → health, cost, expiry |

The builder never grades its own work: the evidence agent, not the coding agent, records evidence.

### How this lines up with engineering's variant

Engineering proposed Ideation (Research, Brief), Inception (Requirements, Stories, Tech Design, Test
Plan, Tickets) and Construction (Code, Review, Manual QA, Visual QA, Deploy). All twelve step names
survive verbatim.

Engineering has since built its variant in UA's internal AI marketplace, for engineers working in
their coding tools: an ideation research skill covers Research and Brief, a separate AI-DLC
repository covers Inception, and the `construction` plugin's Jira-to-PR pipeline covers Code through
the pull request. It has gates of its own: research feeds a human intake gate, no file is written
before an engineer approves the plan, pushes and pull requests need an explicit yes, and every
acceptance criterion is checked in the running app
([research](research/ua-marketplace-alignment.md)).

| Engineering's step | In UA-DLC | What changes, and why |
|---|---|---|
| Research | 1.2 | "Point at what you have": pointed resources indexed per project. Market and customer research is engineering's ideation skill, and a run of it can be pointed at like any resource (proposed) |
| Brief | 1.4 | A confirmation with a verdict (go, needs clarification, redirect, stop), not a fourth approval |
| Requirements | 2.1 | Gathered from people on question cards; decisions kept outside the prose, settled by a person |
| Stories | 2.2 | Followed by approval 1, so the business decides what before design is spent |
| Tech Design | 2.3 | Includes the clickable mock and the data design, because people approve what they can see |
| Test Plan | 2.4 | An evidence plan agreed before code and signed with the plan |
| Tickets | 2.5 | Always exist; filed to Jira only after approval 2, where the workspace or tier calls for it |
| Code | 3.1 | A coding agent in HyperDelivery's sandbox account, one session per build, two check rounds at most |
| Review | 3.2 | Automated, with a person only where section 4 requires one (needs a logged decision) |
| Visual QA | 3.4 | Before Manual QA; includes WCAG 2.2 AA |
| Manual QA | 3.5 | Last, so people's time goes to builds that already pass |
| Deploy | 3.6 | After approval 3, bound to one commit, a pipeline not a model; a PR for repositories HyperDelivery did not create |

What we add: **Intake** (20 to 40% of requests should go elsewhere, and duplicates should join
existing work); **Data discovery** (certified definitions first; the tier depends on the data);
**Automated QA** (functional checks plus the numbers check); **Operation** and optional
**Graduate** (otherwise nothing owns expiry, the kill switch, support or feedback); and **three
approvals named by the decision they record**, signed per section 4 and bound to artifact hashes. Engineering's own gates are engineer-facing and sit inside its tools; its tooling ends after
merge, with no Operation phase.

The step-by-step comparison with AWS AI-DLC, Anthropic's AI-native SDLC playbook, Microsoft's
guidance (Spec Kit, Foundry, Copilot Studio ALM) and the software factories (8090, Factory, Runlayer,
Chopin) is in
[research/ua-dlc-reconcile.md section 1](research/ua-dlc-reconcile.md#1-what-each-input-contributes).
What the line takes from them: Intake from the factories' triage and dedupe, the Brief's verdict from
Spec Kit, decisions kept outside the prose from Chopin, phase-boundary sensors from AI-DLC, the
evidence plan from Anthropic's sprint contract, and Renew or retire from Copilot Studio's explicit
decommissioning.

**Reuse before rebuilding.** Where engineering's contracts fit, HyperDelivery adopts them, pinned to
a version, instead of writing its own: the requirements-readiness check (each ticket `READY`,
`NEEDS_CLARIFICATION` or `BLOCKED` across eight dimensions, with no numeric override) and the
testability question for every acceptance criterion, as phase-boundary sensors before approval 2;
its evidence rules for the evidence agent (each criterion names its method and observation, and
passing unit tests are not evidence); its Confluence sync rules for the living document; and AI-DLC
context files in the handoff package (section 10). The full list is in
[the research](research/ua-marketplace-alignment.md#4-what-to-reuse-or-interoperate-with).

Open with engineering: research scope (the Research row above); who sits on its intake gate, and
whether a move to T2 or a T3 handoff carries its value and complexity scorecard; whether approval 2,
co-signed by an engineering reviewer, can stand in for its plan approval when an engineer picks up a
T3 handoff in its pipeline without re-approving; one meaning and one owner for the name "UA-DLC",
which engineering already uses for a documentation MCP server and a skill prefix; where context
files live; brownfield PR conventions (a Jira key in every commit, and whether HyperDelivery PRs
carry the `agentic-sdlc` label its KPI scorecard counts); who performs Manual QA for business
prototypes; and whether a build's pull request may merge without a human code review at T2 and
above (at T0 and T1 it merges on green checks, and approval 3 signs the resulting commit).

### Engineering-only work

For an opted-in repository or a T3 handoff, the same line adds engineering's practices: a reviewed
System Map, ADRs, API contracts, a threat model and fuller test suites in Inception; code-owner
review and engineering's change process in Construction; SLOs, on-call and postmortems in Operation.
The full list is in
[research/ua-dlc-reconcile.md section 7](research/ua-dlc-reconcile.md#7-what-engineering-only-work-adds).

### Mapping from the earlier UA-DLC stages and the code

| Earlier UA-DLC stage | Unified steps | Code |
|---|---|---|
| Intake | 1.1 Intake | Distill station |
| Frame | 1.4 Brief, with 1.2 Research and 1.3 Data discovery made explicit | Distill station |
| Discover | 2.1 Requirements, 2.2 Stories | Distill station |
| Plan | 2.3 Tech Design, 2.4 Test Plan, 2.5 Tickets | Blueprint station |
| Build and check | 3.1 Code to 3.5 Manual QA | Review station |
| (implicit) | 3.6 Deploy | A pipeline, not a station |
| Show and learn | 4.1 Show; 4.3 Learn | Showroom station (4.1); Learn is an orchestrator skill |
| (new) | 4.2 Operate, 4.4 Renew or retire | Ops monitor, scheduled |
| Graduate | Graduate | Unchanged |

In code, Distill covers 1.1 to 2.2, Blueprint 2.3 to 2.5, Review 3.1 to 3.5 and Showroom 4.1. The
`Station` enum does not need to change for UA-DLC to be adopted.

## 2. The dials

Path decides which steps run. Depth decides how much each step writes and asks. The risk tier and
the lifecycle tier decide who signs and which hardening attaches. None of them changes the number of
approvals.

| Dial | Values | Set by | What it changes |
|---|---|---|---|
| **Path** | New idea, change something that exists, report into an app, fix, change this prototype | Proposed at Intake, confirmed in the Brief | Which steps run, and which run only on the delta |
| **Depth** | Light, Standard, Thorough | Proposed in the Brief, confirmed by the requester, with the time cost shown | How much the agents write and ask, whether a working session is suggested, review depth |
| **Risk tier** | Low, Medium, High | Deterministic rules set the floor; an AI classifier may raise it, never lower it | Adds co-signers and blocking reviews on top of the lifecycle tier's minimum |
| **Lifecycle tier** | T0 to T3 | Proposed in the Brief from the workspace's data envelope and the risk floor, confirmed at approval 2 with the plan's data classification; moved up later only through Graduate | Audience, data, runtime, operator, support and lifetime (the tier contract) |

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
| Requirements, Stories | A | Δ | A | Symptom, cause, expected behavior | Δ |
| Tech Design | A | A; the owning team reviews the System Map | A (Streamlit in Snowflake) | Cause and fix approach | Δ |
| Test Plan | A | A, plus a test baseline before the change | A; numbers check required | A failing test that reproduces the bug | A |
| Tickets | A | A | A | One unit | Δ |
| Code to Manual QA | A (Visual QA when there is a UI) | A | A | A; the reporter confirms on the preview that the symptom is gone | A |
| Deploy | A | A PR to the owning team | Streamlit in Snowflake | A | A |
| Operation | A | A | A | Show is a changelog line | A |

**Depth.**

| | Light | Standard | Thorough |
|---|---|---|---|
| Questions | One batch to at most two people | Role-labeled batches; optional working session | A working session and a stakeholder map |
| Data | Metadata and certified definitions | Plus profiling aggregates and a data design | Plus lineage and data-quality signals |
| Design | Golden-path template and mock | Plus the architecture canvas | Plus NFRs, ADRs and a threat sketch |
| Evidence | Browser checks from criteria | Plus the numbers check and a visual baseline | Plus accessibility, performance and adversarial cases |
| Manual QA | The requester | Plus 1 to 3 contributors | Plus a scripted acceptance session |
| Tickets | Kept in HyperDelivery | Jira per the workspace setting | Jira required (also at T2 and above) |
| Approvals 1 and 2 | One sitting | Separate | Separate |

**Moving up a tier.** Each move is one Graduate approval. Hardening attaches to the move, not to the
first build.

| Move | What runs again | What it adds | Signers |
|---|---|---|---|
| T0 Sandbox to T1 Team prototype | Data discovery (envelope check), Tech Design delta (app role, audience), Deploy | Approved secure views inside the envelope; named testers; team-apps runtime (Streamlit in Snowflake from the Enterprise phase); 90-day life | Business owner who is not the requester, plus the data owner if data changes |
| T1 Team prototype to T2 Department app | Requirements (ratify metrics not yet agreed), Test Plan (accessibility and numbers check required), Review (full security at High), Visual QA (accessibility blocks at Medium and High) | Confidential data with data-owner approval; up to 150 people; 12-month life | Business owner, data owner, engineering reviewer |
| T2 Department app to T3 Production handoff | Tech Design (threat model, lineage, NFRs), Test Plan (CI coverage, browser tests), Operate (runbook, alerts), handoff package | Engineering accepts, declines or rebuilds from the spec | Business owner, data owner, receiving team; change advisory at High |
| T1 Team prototype to T3 Production handoff | The T1 to T2 and T2 to T3 checks together | As both rows above | One Graduate approval with all of their signers |

## 3. The tier contract

| | T0 Sandbox | T1 Team prototype | T2 Department app | T3 Production handoff |
|---|---|---|---|---|
| **Audience** | Project members only | Up to 25 named teammates in one workspace (proposed) | Up to 150 internal teammates (proposed); every viewer needs a Snowflake user for data apps | Engineering decides |
| **Data** | Synthetic or public (during the Final MVP only: approved, non-confidential secure views read through the delegation broker, which returns aggregates and never rows, visible to project members, with separation of duties) | Approved secure views inside the workspace's pre-approved data envelope, masked by role, including aggregated confidential measures the data owner pre-approved for T1 | Confidential data with data owner approval, through governed views | Engineering and data platform standards |
| **Writes** | None outside the sandbox | Read-only to systems of record | Read-only to systems of record; no PII, PCI or HR data | Through engineering's change process |
| **Runtime** | Sandbox account previews | A team-apps environment in the sandbox account, deployed from the repository by the Deploy step after approval 3 (not the build preview), or Streamlit in Snowflake for data apps (from the Enterprise phase) | Streamlit in Snowflake, from the Enterprise phase | Engineering's platforms |
| **Accountable owner** | Requester | Business owner | Business owner | Receiving engineering team |
| **Operator** (runtime, patching, kill switch) | Platform team | Platform team | Platform team | Engineering |
| **Support** | None; permanent "Prototype, unsupported" banner | Business owner first, platform team best effort next business day | Named workspace contact; platform team in business hours, two-business-day response | Engineering's standard support |
| **Maximum life without renewal** | Paused after 7 days idle, deleted after 30 days idle | 90 days | 12 months, then graduate or retire | Normal lifecycle |
| **Changes** | Back through the line | Back through the line; no hand edits | Back through the line; no hand edits | Engineering's process |
| **Dependencies** | No other system may call it | No other system may call it | No other system may call it | As designed |

T1 and T2 apps are not production. The business owner is accountable for how they are used, the
platform team operates the runtime, and nobody offers a service level beyond the table. A kill
switch that the platform team or security can use at once exists for every live app.

Until the Enterprise phase delivers per-user identity and workspace roles, no tier reads
confidential data: T1 and T2 projects in the Final MVP use the same non-confidential views as T0,
and T2 approvals wait for
strong sign-in in any case (section 4).

Uploaded or pointed spreadsheets and reports are T0 with synthetic replacement only, unless the data
is landed in Snowflake through the governed ingestion path. The "report into an app" path first
checks whether the report is a golden report and binds to its semantic view.

## 4. Who signs

Minimum signers by lifecycle tier, with additions by risk tier.

| | Low risk | Medium risk | High risk |
|---|---|---|---|
| **T0** | Requester may sign all three approvals | Business owner (not the requester) | Business owner plus engineering reviewer; full security review blocks |
| **T1** | Business owner (not the requester) | Business owner plus data owner if data changes | Business owner, data owner and engineering reviewer; full security review blocks |
| **T2** | Business owner, data owner and engineering reviewer | Same; accessibility blocks | Same; accessibility, full security and architecture reviews block |
| **T3** | Graduation: business owner, data owner, receiving engineering team | Same | Same, plus change advisory |

In every cell, the security reviewer blocks on confirmed findings, and deterministic scans block on
high or critical findings. Other specialists advise unless the cell says they block.

- **Separation of duties** starts at T1 or Medium risk. In a T0 sandbox at Low risk the requester
  may be their own business owner.
- **Strong sign-in** (Entra Conditional Access authentication context) is required for T2 and
  above, any High-risk approval and any change to an existing system. Below that, the normal Teams
  or console sign-in is enough. Strong sign-in arrives in the Enterprise phase. Until then no T2 or
  High-risk approval happens, and in the pilot a change to an existing tool reaches its owning team
  only as a pull request that team reviews under its own rules (approval 3 unlocks the pull
  request, never a merge), signed with the normal sign-in.
- **Delegation, nudges and escalation:** an approver can delegate; after 2 business days in the
  approver's time zone the approver is nudged; after 5 the delegate or business owner is asked.
- **No bulk approve, ever.**

## 5. Roles

| UA-DLC role | Does | Entra app role | Project role | Existing design persona | Starts at |
|---|---|---|---|---|---|
| Requester | Brings the idea; may own T0 work | Builder | Owner | Requester (Riley) | Layer 1 |
| Business owner | Signs approvals; accountable for use | Builder | Owner, approver | Approver (Priya) | Layers 1 to 2 |
| Contributor | Answers questions, comments, joins sessions | Contributor (every teammate, through a dynamic group) | Contributor | SME (Sam) | Layer 1 |
| Analyst | Checks numbers, traces requirements, exports | Builder or Viewer | Editor or Viewer | Analyst (Avery) | Layers 1 to 2 |
| Data owner | Approves access to their domain's data | Data Owner | Approver for data | (new) | Layer 2 |
| Data steward | Owns definitions; resolves disputes; proposes catalog entries | Data Steward | Contributor, plus a definitions-reviewer relation | (new) | Layer 2 |
| Engineering reviewer | Co-signs per the matrix; reviews System Maps; receives T3 | Engineering Reviewer | Approver for engineering | Developer (Dev) | Layers 2 to 3 |
| Policy owner | Signs changes to the rules agents follow (security, data governance, brand, accessibility) | Governance Admin | n/a | (new) | Layer 2 |
| Platform team | Runs HyperDelivery, golden paths, evaluations; operates T0 to T2 runtimes | Platform Admin | n/a | (new) | Layer 3 |
| Champion | Helps teammates frame ideas, facilitates working sessions, first-line help, about 10% of their time | Builder | Any | (new) | Layers 1 to 2 |
| Sponsor | Owns the portfolio, priorities and value | Viewer | Viewer | Leadership (Lee) | Layer 1, aggregated |

Data owners and stewards come from UA's existing domain stewardship, not new hires. Estimated
load: per project, one access review and 2 to 5 definition questions, about 2 steward hours; about
10 hours a week across domains at 10 concurrent projects. Steward requests arrive as Teams cards or
catalog and Jira tasks, with a 2-business-day target and escalation to the domain's data owner.

During the Final MVP, pilot users hold these roles through project membership; the Entra app
roles in the table arrive with the Enterprise phase.

The orchestrator, the specialists (context delegate, Cortex Code data specialist, coding agent),
reviewers and the ops monitor are agents, not roles.

## 6. A project in your week

Proposed starting budgets, validated with pilot users in the pilot. The Brief shows them when the
requester picks a depth, for example "Light: about an hour of your time, ready in about 3 days".

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
- **Showcase:** the demo, recorded, with the provenance bar burned in.
- **Weekly digest:** what was built across UA and what was learned, credited to the people who
  contributed. Its numbers come from the Portfolio view.

## 8. Artifacts

### The living project document

One document people read, rendered from versioned records underneath. From the Final MVP it is
also published, on request, to one Confluence page per project, so people can comment where
engineering already works; HyperDelivery stays the system of record.

| Section | Who may change it | How |
|---|---|---|
| Brief | Requester | Edits directly; status Draft or Agreed |
| What we heard | Contributors | Confirm or reject captured statements; people may correct statements attributed to them |
| Decisions | Anyone permitted | Save and Reopen records; history is kept; the question text is frozen |
| Plan | Business owner | Suggested edits, accepted top to bottom |
| Evidence | Nobody | Generated, read-only |
| What it skips | Business owner | Generated, plus additions |

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

Every artifact has one system of record. Approvals bind to the version that was on screen when the
signer signed.

| Artifact | System of record | Where people see it | Who can edit | Versions and approvals |
|---|---|---|---|---|
| Brief | HyperDelivery | Brief section; Confluence page | Requester | Hash signed at approval 1 |
| What we heard | HyperDelivery, citing transcripts, comments, tickets | Confirm what we heard; margin questions; Teams cards | Each person corrects their own statements | Statements versioned; signed at approval 1 |
| Decision records | HyperDelivery, apart from the prose | Decisions view; decision timeline by person; Teams card to save | Anyone permitted saves or reopens | Frozen question; open decisions make approval 1 inert |
| Stories and wireframe | HyperDelivery | "What you'll be able to do"; wireframe marked "Shape, not final" | Generated; requester reacts | Signed at approval 1 |
| Clickable mock | HyperDelivery (UA app kit) | "The plan"; Approval screen | Business owner suggests edits | Plan revision signed at approval 2 |
| Data map | HyperDelivery: object names, definitions, query ids, never rows | "Your data"; "Which data it uses" | Requester confirms; steward ratifies | In the plan revision |
| Architecture canvas (the project's own solution) | HyperDelivery | The project's Architecture tab, with a replay of the app's flows | Engineering reviewer comments | In the plan revision |
| Test plan | HyperDelivery | "How we'll show it works" | Business owner and analyst comment | Signed at approval 2 |
| Tickets | HyperDelivery work graph; Jira mirrors it after approval 2 | Layer 2 "Pieces"; Jira for engineering | Generated | Graph revision signed at approval 2 |
| The build's pull request and preview | Prototype-organization repository, one pull request per build with a commit per piece; previews in the sandbox account | Preview pane with provenance bar; "Building 3 of 8"; trace in Layer 3 | Coding agent; people annotate in "Try it" | Commit SHA signed at approval 3 |
| Evidence pack | HyperDelivery evidence store, not the repository | Evidence drawer on the Approval screen, opened from the Teams card | Nobody | Bound to SHA and build id |
| Release | Deploy pipeline and app registry | "Live for 23 people"; app banner; Home card | The pipeline | One release per signed SHA |
| Demo package | HyperDelivery | Show tab; Teams digest; recorded showcase | Requester edits the talk track | Versioned with the release |
| Feedback themes | HyperDelivery | "What we learned"; Inbox for owners | Owner triages | Linked to their reports and change requests |

### Other artifacts

- **Decision records,** kept apart from the prose so a regenerated draft cannot change what people
  decided.
- **Context, bound to certified definitions first.** For every metric or term, HyperDelivery first
  looks up the certified definition (a Snowflake semantic view or golden report, then the
  catalog). If one exists, the plan uses it. A metric with no certified definition is labeled
  "not yet agreed" (unratified): allowed at T0 and T1, and it blocks T2 until a steward ratifies it.
  HyperDelivery proposes catalog entries as steward requests and holds no catalog write access.
- **Per-project index** on AWS (one knowledge base per project) of everything people pointed at,
  with each source's owner, version, freshness and access list. It is deleted with the project;
  confirmed facts and decisions outlive it in the Library.
- **System Map** for each opted-in repository or system a project touches, reviewed by its owning
  team's tech lead.
- **Evidence pack** at each approval: per-criterion screenshots or recordings, a numbers check
  that reconciles 3 to 5 headline figures against the golden report or certified dashboard with
  the same filters (a failed check blocks approval 3 unless the owner records why), and "how this
  number is calculated" for each figure. The numbers check runs only when the prototype reads
  governed views: on synthetic data the evidence shows "Numbers not checked: synthetic data", and on
  masked views it reconciles only unmasked aggregates.
- **Handoff package** at graduation (below).

## 9. Support by tier

| | Who helps the user | Who is called when it breaks | Response |
|---|---|---|---|
| Using HyperDelivery | Champions, Teams help channel, weekly office hours | Platform team | Business hours |
| T0 app | Self-serve | Nobody | None |
| T1 app | Business owner | Platform team, best effort | Next business day |
| T2 app | Named workspace contact | Platform team | Two business days |
| T3 app | Engineering | Engineering on-call | Engineering's standard |

Every generated app shows a persistent banner (tier, data freshness, owner, expiry) and a "Report
a problem" button that opens a change request back into the line. HyperDelivery apps have their own
service desk category, owned by the platform team. T1 and T2 data apps are not supported by data
platform on-call.

## 10. Graduation and engineering handoff

**Brownfield rule.** For any repository HyperDelivery did not create, HyperDelivery never merges.
Approval 3 accepts the prototype on a branch and preview; the pull request goes to the owning team,
who merge through their own change process. Repositories opt in one at a time: the owning team
installs the HyperDelivery GitHub App on that repository only, keeps its code owners, and adds an
agent-instructions file with its constraints. HyperDelivery is never a ruleset bypass actor.

**Graduate re-enters the line at Tech Design** for the delta between the current tier and the target
tier (section 2), then runs Test Plan through Deploy for that delta only.

**The handoff package:** a Jira epic, a Confluence page, the repository (transferred from the
prototype organization), a `devcontainer.json`, the decision-record chain with hashes, AI-DLC
context files in engineering's format (one per ticket and one for the epic, filled from the units,
decision records and work graph, so an engineer can continue in engineering's own pipeline; the same
files go on brownfield tickets once engineering accepts HyperDelivery as a source, see
[the research](research/ua-marketplace-alignment.md#4a-hyperdelivery-fields-that-fill-an-ai-dlc-context-file)),
and these acceptance criteria:

- Tests in CI with a coverage report; acceptance criteria encoded as browser tests
- Clean secret, dependency and code scans; an SBOM; a license check
- A threat model and data lineage
- A runbook, logs, metrics and alerts
- Golden-path conformance and a run-cost estimate
- "What it skips"
- For data apps: objects in a governed database owned by a functional role, deployed by data
  platform CI, certified sources, metrics from semantic views, masking and row access verified, a
  resource monitor, a data contract, steward and owner sign-off

**Engineering's rights:** accept or decline within 10 business days with written reasons; an
intake cap until the scale decision (proposed: 2 per receiving team per quarter); and **"rebuild from the
spec"** as a first-class outcome, where engineering builds from the spec, decisions and evidence
instead of adopting generated code. Thirty days of platform-team hypercare follow every accepted
handoff. The receiving team for each workspace is named before the Enterprise phase starts.

## 11. Notification policy

| Event | Who | Channel | Batching | Reminder | Escalation |
|---|---|---|---|---|---|
| Question for you | The named person | Teams card | One card per project per day | 1 business day | Suggested alternative after 3 |
| Approval waiting | The assigned approver | Teams card, opening the evidence to sign | Immediate | 2 business days | Delegate or business owner after 5 |
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
| Brief (Draft, Agreed) | Brief | Yes |
| Spec | Not used: in apparel "spec" means a garment tech pack | No |
| Approval 1, 2, 3 | "Your approval: what we're building", "...the plan", "...the working prototype" | Yes, named by decision, not number |
| Confirmation (one person agrees; not an approval: the Brief, Confirm what we heard, tester notes, renewals) | "Agree", "Confirm" | Yes |
| Ideation, Inception, Construction, Operation (the four phases) | Not shown | No: Layer 2, the Portfolio for leads, engineering docs |
| The four stretches of the line: up to approval 1, up to approval 2, up to approval 3, and from Deploy on | Discover, Plan, Build, Live, as segment labels on the line | Yes |
| Intake (triage of a new idea, ticket or signal) | "Start a project" | Yes |
| Data discovery (certified sources, owners, grain and feasibility, found before the Brief) | "Your data" | Yes |
| Automated QA (functional checks per criterion plus the numbers check) | "Evidence" | Yes |
| The other step names | Research "Found in your sources"; Requirements "What we heard" and "Decisions"; Stories "What you'll be able to do"; Tech Design "The plan"; Test Plan "How we'll show it works"; Tickets "Pieces"; Code and Review "Building" and "Checks"; Visual QA "Looks like the plan"; Manual QA "Try it"; Deploy "Live for" the audience; Learn "What we learned" | Yes, except "Pieces" and Tech Design beyond the mock (Layer 2) |
| Working session, Huddle | To test | Yes, after testing |
| Graduate, promotion | "Hand to engineering" or "Go wider", to test | Yes, after testing |
| Evidence pack (per-criterion proof at approval 3; engineering's research skill uses the same name for its research ledger, so "acceptance evidence" is proposed for ours) | Evidence | Yes |
| Decision record | Decision | Yes, with status words (Open, Settled) |
| Context atom | Fact, with its source | "Fact" only |
| Certified (defined in a Snowflake semantic view or golden report) | Certified | Yes |
| Canonical (a confirmed fact a steward ratified for the workspace) | Canonical | Yes |
| Unratified (a metric with no certified definition) | Not yet agreed | Yes |
| Uncertified (a number not reconciled to a golden report) | Uncertified, on the number | Yes |
| Orchestrator (the one assistant that runs the conversation, the plan and the living document) | HyperDelivery | Yes, as HyperDelivery |
| Specialist (an agent that does bounded work across one boundary: context delegate or resource reader, Cortex Code data specialist, coding agent, reviewers) | Named only in the detail views | No: Layers 2 and 3 |
| Delegation (the orchestrator handing a typed task to a specialist through the delegation broker) | "Asked Cortex Code for margin per door" | No: Layers 2 and 3 |
| Context pack (the cited excerpts a specialist receives instead of anyone's credentials) | Not shown | No |
| Pointed resource (a Teams recording, OneDrive folder, Jira ticket or Confluence page HyperDelivery reads as the person who pointed at it, instead of an upload) | Source | Yes |
| Per-project index (the project's searchable store of its pointed resources, deleted with the project) | Sources | Yes |
| System Map | How it works today | Layer 2 |
| T0 to T3 | Sandbox, Team prototype, Department app, Production handoff | Plain names only |
| UA-DLC, golden path, depth | Not shown | No |

## 13. Second department criteria

One of the partner functions in the pilot is the recommended second department, chosen against
these criteria and confirmed or replaced at the pilot readout; it opens at Enterprise ready (week
36). A department qualifies when:

- Its core data is in certified data products with semantic views, or data platform commits to
  building one or two for it.
- Sensitive columns are classified and protected by policy.
- A named domain steward has agreed capacity.
- The first project is Internal-classified, T1 and read-only.
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
