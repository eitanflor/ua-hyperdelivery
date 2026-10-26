<!-- Point-in-time research, retrieved 2026-10-25 for the UA-DLC plan. Claims carry source links; vendor features and dates change quickly, so verify before acting. See README.md in this folder. -->
<!-- cspell:words Kiro PRFAQ WSJF amazonq codekb kiro opencode rescan runbooks timeboxed wireframes worktrees -->

# AWS AI-DLC: how it works, and how it maps onto HyperDelivery / UA-DLC

*Researched 2026-10-25. Repo read at `awslabs/aidlc-workflows` main commit `267fc1b` (2026-10-25, release 2.11.1), plus the `v1` and `v1-operations` branches. All repo links point at those branches.*

## 0. "AI-DLC" means three different things

1. **The method.** It was introduced by Raja SP in the [AWS DevOps blog, 31 Jul 2025](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/), and defined in the [Method Definition paper](https://prod.d13rzhkk8cj2z0.amplifyapp.com/). Its core ideas:
   - **Reverse the conversation direction.** AI proposes plans, asks clarifying questions and decomposes the work. Humans approve.
   - **Put design techniques at the core.** The paper describes a DDD flavor.
   - **Rename the units of planning.** *Intents* break down into *Units* (analogous to epics or subdomains), and Units are built in *Bolts*, which replace sprints and last hours or days.
   - **Treat human validation as a "loss function".** A review at each step catches errors before they snowball downstream.
   - **Use no hard-wired workflows.** AI proposes a "Level 1 Plan" for each pathway, such as a greenfield build, a brownfield change or a defect fix.
   - **Scope caveat.** Principle 5 puts simple systems that non-developer personas could build *outside* AI-DLC's scope and points them to low-code tools ([paper](https://prod.d13rzhkk8cj2z0.amplifyapp.com/)). HyperDelivery's users are exactly those personas.
2. **AI-DLC Workflows v1 (rules).** These are markdown steering and rules files, open-sourced on [29 Nov 2025](https://aws.amazon.com/blogs/devops/open-sourcing-adaptive-workflows-for-ai-driven-development-life-cycle-ai-dlc/). They are now maintained on the [`v1` branch](https://github.com/awslabs/aidlc-workflows/tree/v1) (rules version 1.0.1).
   - One `core-workflow.md` file loads stage detail files on demand.
   - All output goes to `aidlc-docs/`, with `aidlc-state.md` for progress and `audit.md` for the log ([core-workflow.md](https://github.com/awslabs/aidlc-workflows/blob/v1/aidlc-rules/aws-aidlc-rules/core-workflow.md)).
3. **AI-DLC Workflows 2.0 (engine).** Release 2.0.0 went GA on 2026-06-18. The latest is 2.11.1, released 2026-10-20 ([CHANGELOG](https://github.com/awslabs/aidlc-workflows/blob/main/CHANGELOG.md)).
   - **Shape:** 5 phases, 33 stages, 14 agents, 11 scopes and 124 audit event types ([README](https://github.com/awslabs/aidlc-workflows/blob/main/README.md)).
   - **Engine:** a deterministic engine (`aidlc-orchestrate.ts`) emits typed directives, and an LLM "conductor" carries them out.
   - **Distribution:** a native installer for 7 harnesses, with hooks that enforce the gates.
   - **License:** MIT-0.
   - **Design spec:** the [Workflows 2.0 Specification](https://github.com/awslabs/aidlc-workflows/blob/main/assets/AI-DLC-Workflows-2.0-Specification.pdf) adds these principles:
     - Distill human judgment into machine checks, and move toward autonomy *in safe increments*.
     - Every stage is a "three-compartment" spec: what goes in and out, how we know it is right, and what we learned.
     - Every self-correcting loop needs a halting condition, either an iteration limit or a token budget.
     - A stage whose checks are judged only by an LLM must not self-halt. It still goes to a human.

## 1. Phases, stages and the artifacts each produces

**v1 (3 phases)** ([process-overview](https://github.com/awslabs/aidlc-workflows/blob/v1/aidlc-rules/aws-aidlc-rule-details/common/process-overview.md)):
- **Inception:** Workspace Detection (always), Reverse Engineering (brownfield only), Requirements Analysis (always, adaptive depth), User Stories (conditional), **Workflow Planning (always)**, Application Design (conditional) and Units Generation (conditional).
- **Construction:** a per-Unit loop of Functional Design, NFR Requirements, NFR Design and Infrastructure Design (all conditional), then Code Generation (always). Code Generation runs in two parts: a plan, then generation. Build and Test runs once at the end.
- **Operations:** a placeholder in v1. The [`v1-operations` branch](https://github.com/awslabs/aidlc-workflows/blob/v1-operations/docs/operations-phase.md) adds three stages:
  - Rules Validation, with an applicability matrix, per-domain compliance reports and a gap/rework loop capped at a set number of passes.
  - Deployment through a pipeline.
  - Post-Deployment Testing.

**v2 (5 phases, 33 stages)** ([Phases and Stages](https://github.com/awslabs/aidlc-workflows/blob/main/docs/guide/04-phases-and-stages.md)):

| Phase | Stages (lead agent) | Key artifacts |
|---|---|---|
| 0 Initialization (automatic) | Workspace Scaffold, Workspace Detection, State Init | intent record dir, `aidlc-state.md`, `audit/` shards |
| 1 Ideation | 1.1 Intent Capture (product), 1.2 Market Research, 1.3 Feasibility & Constraints (architect), 1.4 Scope Definition, 1.5 Team Formation, 1.6 Rough Mockups (design), 1.7 Approval & Handoff | intent statement + stakeholder map with source-tagged claims and an assumptions section; feasibility/RAID log; scope + intent backlog; wireframes; initiative brief |
| 2 Inception | 2.1 Reverse Engineering (pipeline), 2.2 Practices Discovery, 2.3 Requirements Analysis, 2.4 User Stories (mob), 2.5 Refined Mockups, 2.6 Domain Design, 2.7 Units Generation, 2.8 Contract Design, 2.9 Delivery Planning | 9 RE artifacts; `team-practices.md`; `requirements.md`; `stories.md`/`personas.md`; `components.md` + ADRs; `unit-of-work.md`, `unit-of-work-dependency.md` (DAG), story map; `contract-summary.md`; **`bolt-plan.md`**, team allocation, risk/sequencing rationale, external dependency map |
| 3 Construction | 3.1 Functional Design, 3.2 NFR Requirements, 3.3 NFR Design, 3.4 Infrastructure Design, 3.5 Code Generation (per Unit); 3.6 Build and Test, 3.7 CI Pipeline (once) | entities/rules/functional spec, NFR specs, IaC design, code, test results, CI config |
| 4 Operation | Deployment Pipeline, Environment Provisioning, Deployment Execution, Observability, Incident Response, Performance Validation, Feedback & Optimization | CD config + rollback runbook, environment inventory, deploy log/smoke tests, dashboards/alarms/SLOs, runbooks, load-test results, SLO/cost report that feeds back into Ideation |

At each phase boundary, a **verification gate** checks traceability and flags orphaned or missing artifacts.

Every stage declares what it `consumes` and what it `produces`. When an input is missing, the engine says whether that is expected (the stage that makes it is out of scope) or a real gap.

## 2. Where humans approve

- **Every stage after Initialization ends with a gate.** The gate offers *Approve* (and names the real next stage) or *Request Changes* ([Interaction Modes](https://github.com/awslabs/aidlc-workflows/blob/main/docs/guide/07-interaction-modes.md)).
  - v1 required a fixed two-option message and banned improvised menus ("NO EMERGENT BEHAVIOR").
- **Several human-only decisions sit inside stages:**
  - question rounds that keep going until every ambiguity is resolved ([overconfidence-prevention](https://github.com/awslabs/aidlc-workflows/blob/v1/aidlc-rules/aws-aidlc-rule-details/common/overconfidence-prevention.md));
  - a summary confirmation before an artifact is written;
  - explicit **Assumption Confirmation** in Intent Capture ([intent-capture.md](https://github.com/awslabs/aidlc-workflows/blob/main/core/aidlc-common/stages/ideation/intent-capture.md));
  - **Plan Approval** before each Unit's code is generated;
  - a human-authorized **Construction Verification Command**;
  - approval of the walking skeleton.
- **The workflow plan itself is approved.** In v1 this is `execution-plan.md`; in v2 it is the scope or composer offer.
- **Construction can run with fewer stops.** A user can choose *Continue automatically*, which waives the routine Unit checkpoints. Plan approval, skeleton approval, the verification command and every failure still stop for the human.
- **Approvals are bound to a real human.** A "human-presence guard" accepts an approval only from a real person's message, and the reply is stored verbatim as `Person Reply` ([audit-format](https://github.com/awslabs/aidlc-workflows/blob/main/core/knowledge/aidlc-shared/audit-format.md)).
  - v1 required logging the full raw user input in `audit.md` with ISO timestamps, never summarized.

## 3. How depth scales to complexity

There are two independent dials: **breadth** (which stages run) and **depth** (how much detail each stage writes).

**v1:**
- Workflow Planning always runs after requirements. It produces `execution-plan.md` with:
  - a risk level, from Low to Critical;
  - an impact assessment covering the UI, structure, data model, APIs and NFRs;
  - an EXECUTE or SKIP decision, with a rationale, for every conditional stage;
  - a styled Mermaid diagram.
- The user can add skipped stages back ([workflow-planning.md](https://github.com/awslabs/aidlc-workflows/blob/v1/aidlc-rules/aws-aidlc-rule-details/inception/workflow-planning.md)).
- Depth applies inside each stage. A stage that runs always produces all of its artifacts; only the level of detail varies ([depth-levels.md](https://github.com/awslabs/aidlc-workflows/blob/v1/aidlc-rules/aws-aidlc-rule-details/common/depth-levels.md)).

**v2:**
- **11 named scopes** ([Scopes and Depth](https://github.com/awslabs/aidlc-workflows/blob/main/docs/guide/05-scopes-and-depth.md), [Workflow Profiles](https://github.com/awslabs/aidlc-workflows/blob/main/docs/guide/workflow-profiles.md)). Stage counts exclude the three setup stages:
  - poc: 5 of 30 stages
  - bugfix: 6
  - express: 7
  - classic: 15 (the default)
  - mvp: 20
  - workshop: 23
  - feature and enterprise: all 30
- **Three depth levels:** Minimal, Standard and Comprehensive. Test strategy is a third dial with the same three levels.
- **The agent proposes a plan from the request.** It states the exact stage count and gate count before anything starts.
- **An adaptive composer handles requests that fit no plan.** It scores five "entropy" components (intent ambiguity, structural uncertainty, verification entropy, risk and unresolved assumptions), each LOW, MED or HIGH. It then proposes the *minimum viable workflow*, the smallest EXECUTE set that still produces every artifact the outcome depends on ([composing.md](https://github.com/awslabs/aidlc-workflows/blob/main/core/knowledge/aidlc-composer-agent/composing.md)).
- **Plans can change mid-workflow.** Recomposition can flip only stages that have not run yet, and it is audited.
- **Ceremony switches** (sensors, learnings, summary confirmation, collaborators, review cap) trim the stops *inside* stages. Plan approval is turned off only by the user.

## 4. Brownfield: reverse engineering

**Method:**
- Before building, AI "elevates" the existing code into static models (components, responsibilities, relationships) and dynamic models (how components realize key use cases).
- Developers and product managers review and correct those models ([paper §V](https://prod.d13rzhkk8cj2z0.amplifyapp.com/)).

**v1:**
- Reverse Engineering runs when existing code is found and no current RE artifacts exist ([reverse-engineering.md](https://github.com/awslabs/aidlc-workflows/blob/v1/aidlc-rules/aws-aidlc-rule-details/inception/reverse-engineering.md)).
- It writes 9 artifacts: `business-overview.md` (business transactions and a business dictionary), `architecture.md`, `code-structure.md` (including an inventory of existing files), `api-documentation.md`, `component-inventory.md`, `technology-stack.md`, `dependencies.md`, `code-quality-assessment.md` and a timestamp file.
- A human approves the result.
- Workflow Planning then adds a brownfield-only multi-package analysis: the update sequence, what can be parallelized, the critical path and a rollback strategy.

**v2:**
- **Scans run as a two-link pipeline.** A developer agent scans the code, then an architect agent synthesizes the result.
- **Output goes to a shared knowledge store.** It lands in a *space-level* `codekb/<repo>/` store that every intent can use ([reverse-engineering.md](https://github.com/awslabs/aidlc-workflows/blob/main/core/aidlc-common/stages/inception/reverse-engineering.md)).
- **A freshness check runs before every scan** (`codekb-scope-diff`). It returns NO_STORE, CURRENT, STALE, UNVERIFIED or UNKNOWN_SCOPE.
- **The human picks how to use an existing store:** reuse it, run a full rescan, or run a focused scan that merges new knowledge into it.
- **Multi-repo work runs one scan chain per repo.**
- **Practices Discovery (2.2)** turns RE evidence into affirmed team practices.
- **Brownfield safeguards** add blast-radius analysis, a diff preview, a test baseline taken *before* any change, test validation after, and a rollback plan ([brownfield.md](https://github.com/awslabs/aidlc-workflows/blob/main/core/knowledge/aidlc-shared/brownfield.md)).

## 5. Multiple Units of work in parallel

- **2.7 Units Generation produces only the dependency DAG.** It must not recommend an order.
- **2.9 Delivery Planning chooses the "economic path" through the DAG** ([delivery-planning.md](https://github.com/awslabs/aidlc-workflows/blob/main/core/aidlc-common/stages/inception/delivery-planning.md)):
  - Each **Bolt** bundles Units and carries a Definition of Done, a *confidence hypothesis* (what shipping it proves) and an owner.
  - The stage asks whether to sequence risky-first, value-first or walking-skeleton-first.
  - It can score Bolts with WSJF (Weighted Shortest Job First).
  - It maps external dependencies.
- **Construction walks the Units in one of two orders:**
  - *Unit-major* (the default): Units go one at a time, each with a verified checkpoint.
  - *Stage-major*: with `swarm` turned on, Units whose dependencies are done build in parallel batches in worktrees and share one batch checkpoint.
- **Failures always stop the run.** A failed Unit offers retry, skip or abort, and the work of Units that succeeded is kept.
- **Team mode** lets several human teams each claim a Unit through git refs (`claim/<intent>/<unit>`) ([workshop-mode.md](https://github.com/awslabs/aidlc-workflows/blob/main/docs/guide/workshop-mode.md)):
  - each team runs stages 3.1 to 3.5 in its own checkout;
  - an integration lead lands candidates through pinned merge gates.

## 6. Rituals: Mob Elaboration, Mob Construction, Bolts

- **Mob Elaboration (Inception).** One room, a shared screen and a facilitator. AI proposes stories, acceptance criteria and Units, and the PO, developers, QA and others refine them.
  - **Outputs per the paper:** a PRFAQ, user stories, NFRs, risks matched to the organization's risk register, measurement criteria, and suggested Bolts.
- **Mob Construction.** Teams that own Units sit together, exchange integration specs from the domain model, and deliver their Bolts.
- **The re:Invent 2025 talk (DVT214)** ([video](https://www.youtube.com/watch?v=1HNUH6j5t4A); [transcript summary](https://zenn.dev/kiiwami/articles/45a7ac851f2aeb27)):
  - Mob elaboration runs about four hours, or half a day.
  - Construction teams are small and cross-functional, and *include a business person*.
  - Customer claims include about 3 months of work done in 20 hours, and 10 to 15x gains. These are vendor figures, so treat them as an upper bound.
  - The adoption model is the "Unicorn Gym" (hands-on work on real problems) plus an "AI-DLC Master" role.
- **The v2 tooling uses these rituals only lightly.** User Stories runs as a multi-agent "mob". There is also a `workshop` scope and a [facilitator guide](https://github.com/awslabs/aidlc-workflows/blob/main/docs/guide/facilitator-guide.md).
- **The tooling has no shared, live, multi-human session.** It runs one chat per developer.
- **v2 hints at who should answer each question.** Each question is labeled with its usual answerer, such as `[Product owner]` or `[Developer]`. Questions for the same role are grouped, so a team can split them.

## 7. How it plugs into agents

- **v1: copy files into each tool's rules location** ([v1 README](https://github.com/awslabs/aidlc-workflows/blob/v1/README.md)). Workflows start by prefixing a request with "Using AI-DLC".
  - **Kiro:** `.kiro/steering/`, run in Vibe mode.
  - **Amazon Q Developer:** `.amazonq/rules`.
  - **Claude Code:** `CLAUDE.md` plus `.aidlc-rule-details/`.
  - **Copilot:** `.github/copilot-instructions.md`.
  - **Also supported:** Cursor, Cline, Codex and others.
- **v1 extensions** come as opt-in files (security baseline, property-based testing, resiliency). Each is offered as a question during Requirements Analysis. Rules the user opts into become *blocking* findings.
- **v2: `aidlc config --harness <claude|kiro|kiro-ide|codex|cursor|opencode|copilot>`** installs skills, agents, hooks and an `/aidlc` command.
  - **Amazon Q Developer is no longer a listed harness.**
  - **A sample MCP-server variant** for Kiro exposes seven tools (start, phase prompt, next phase, set status, record answers, request approval, integrate code). It is labeled learning/prototype only ([AWS Builder, Jun 2026](https://builder.aws.com/content/3EcgPNd9d2MMnKuRdrlInq7TTVt/from-intent-to-software-running-the-ai-dlc-mcp-server-in-kiro)).
- **Rules and learning in v2** ([Rules and the Learning Loop](https://github.com/awslabs/aidlc-workflows/blob/main/docs/guide/09-rules-and-the-learning-loop.md)):
  - Rules live in an additive five-layer memory (org, team, project, phase, stage).
  - A **learning loop** keeps a per-stage `memory.md` diary. Candidate rules come up at the gate, and the human chooses which to keep.
  - **Sensors** are deterministic checks (lint, type check, traceability, claim sources, required sections). They are the feedback half of the loop; rules are the feed-forward half.
- **Regulated-industry use** focuses on steering files for policy, traceability, and approvals scaled to risk ([AWS for Industries, May 2026](https://aws.amazon.com/blogs/industries/ai-driven-development-lifecycle-for-financial-services/)).

## 8. Assessment and caveats

- **AI-DLC is built for developers inside an IDE or CLI.** HyperDelivery's users have no such tools.
- **The v2 ceremony is very heavy.** The `feature` scope has 30 approval gates, and there are 124 event types. The CHANGELOG alone is 667 KB.
- **AWS is already trimming it back.** Release 2.11.0 made new work leaner by default: support agents off, Guard Policy off, and a bare `/aidlc` resumes without a menu. That is a signal that approval fatigue is real.
- **AI-DLC is weakest exactly where HyperDelivery needs it most:**
  - non-technical intake;
  - real multi-human collaboration;
  - Microsoft 365.
- **The productivity claims are AWS's own engagement figures.**

## 9. Step-by-step mapping against HyperDelivery's 4-gate line

| AI-DLC element | HyperDelivery today | Gap |
|---|---|---|
| Intent Capture + stakeholder map + source tags + assumption confirmation | **Distill** turns the FSD into a `StructuredSpec`. It has evidence links, question cards (at most 4, with options) and G1 completeness computed from the stored artifact | No stakeholder map, no explicit assumption register to confirm, no role labels on questions |
| Ideation (feasibility, scope, rough mockups) | Implicit in Distill | No early clickable mockup and no feasibility/data-access check, both high-value for business users |
| Workspace Detection + Reverse Engineering (persisted codekb, freshness) | Blueprint reads GitHub live on every run (`search_repositories`, `get_repository_tree`, `search_code`). Distill reads Confluence, S3 reference FSDs and Snowflake | **No persisted, reviewed, reusable "system map"**, no freshness check, no business-overview view, no test baseline before a change |
| Practices Discovery + layered memory + learning loop | One global standing-context note (`get_context`) | No org/team/project layers, no capture of corrections at the gate |
| Requirements + User Stories | Distill (requirements, acceptance criteria, business value, intent classification) | Close match |
| **Workflow Planning / scope proposal / composer** | The same 4 stations at the same depth for every project | **Missing**, with no adaptive breadth or depth |
| Domain Design, Units Generation (DAG), Contract Design | **Blueprint**: components, data entities, integration points, API contracts, units with `depends_on` and file touchpoints, deterministic validators | Close match. Missing NFRs and ADR alternatives |
| Delivery Planning (Bolts, DoD, confidence hypothesis, walking skeleton) | `plan_delivery` groups units into delivery groups by shared files and dependency order (`src/core/delivery.py`) | Grouping is mechanical, with no value-based ordering, DoD or skeleton-first slice |
| Per-Unit NFR/infra design | Mostly absent | Gap: security, PII and data-classification NFRs matter for EDM data |
| Code Generation with per-Unit Plan Approval | The Copilot coding agent takes each delivery group after the G2 approval | Acceptable for business users (G2 is the plan approval). No recorded verification command |
| Build & Test + reviewer agents + verification gates | **Review** writes a gap report against the spec plus a coverage view. Deterministic gate scoring | Strong match. No adversarial reviewer *before* G1/G2 |
| Operation phase | **Showroom** produces a demo package and local preview | No NFR/production-readiness or engineering hand-off package |
| Audit (verbatim replies, 124 events, human-presence guard) | `DECISION#`, `TURN#`, artifact versions, signer taken from the Entra token, cost per turn | Close match. No exportable decision record |
| Mob Elaboration / Construction | One user per project | **Biggest gap**, given the ideathon finding |

## 10. What UA-DLC should adopt, adapt, or reject

**Adopt**

1. **A "Plan" step before the first gate.** AI proposes a named plan in plain words ("Quick prototype", "Change an existing system", "Data pipeline", "Fix"), plus a depth level (Light, Standard or Thorough), each with a one-line rationale and the gate count. The user confirms. The depth changes agent prompts and the gate thresholds, but *never* removes a gate.
2. **A persisted brownfield "System Map".** Model it on the v2 codekb:
   - a per-repo store shared across projects;
   - a freshness check, with reuse, full scan or focused scan;
   - the 9 RE sections, with `business-overview` (business transactions, a business dictionary) presented first for non-technical readers;
   - human approval of the map;
   - Distill and Blueprint both read it.
3. **Assumption register plus source tags,** with explicit confirmation before G1. This extends `EvidenceLink`.
4. **Walking skeleton first.** Make the first delivery group a thin end-to-end slice with a recorded verification command, and take a test baseline before any brownfield change.
5. **A learning loop.** Corrections at gates become candidate rules. A human approves them before they are promoted into UA org, team or project standards, which are layered on the current global context.
6. **Halting conditions on every self-correcting loop,** with escalation to a human.

**Adapt**

- **Mob Elaboration becomes a "Huddle".**
  - **Synchronous:** a timeboxed Teams meeting around a shared project page, where AI asks and mixed business and technical attendees answer.
  - **Asynchronous:** role-labeled questions (data owner, product owner, engineer) routed to named people through Teams adaptive cards.
  - This is how the ideathon's cross-functional effect becomes product behavior.
- **Bolts.** Keep the file-overlap delivery groups, and add a Definition of Done, a confidence hypothesis and a business-chosen order (a light version of WSJF).
- **NFR and Operation become a "Graduate" step.** It produces an NFR and readiness checklist (data classification, SSO, Snowflake governance) and an engineering hand-off: a Jira epic, a Confluence page, and optionally an `aidlc-docs/`-shaped export so engineers can continue in Copilot with `/aidlc`. AI does not deploy to production.
- **Reviewer agents.** Add one advisory reviewer pass on the Distill and Blueprint output before the human gate.

**Reject**

- **The IDE/CLI distribution model,** and the [Answer]-tag question files.
- **The 33-stage, many-gate ceremony** and per-stage approvals.
- **Showing agent topology or persona names as the primary interface.** Users said they don't care.
- **Market Research and Team Formation stages** for internal prototypes.
- **AI-driven production deployment.**
- **The paper's exclusion of non-developers.** Reject it as a scope limit, but heed it as a warning: put a governed graduation path in place.
