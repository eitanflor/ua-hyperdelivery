<!-- Point-in-time research, read 2026-10-25 from a local copy of the internal underarmour/ua-ai-marketplace repository (marketplace manifest 1.9.0) for the UA-DLC plan. Internal skills change often and the copy has no git history; re-read the repository before acting on any detail. See README.md in this folder. -->
<!-- cspell:words Bastion CODEOWNERS DAPL DDSQL Evalite Flagsmith GEI NOJIRA Qualtrics SFCC Seabiscuit Smartsheet TrustArc UACAPI baselayer cortexcli disconfirming droid droids gitignored llocal uadlc unscored verbatims -->

# UA engineering's AI-DLC tooling and the UA-DLC line

Research key: `ua-marketplace-alignment`. Date: 2026-10-25. Status: findings for the owner and a
conversation starter with UA engineering. Builds on
[operating-model.md section 1](../operating-model.md#1-the-line),
[platform-architecture.md section 2](../platform-architecture.md#2-the-orchestrator-and-its-specialists)
and [ua-dlc-reconcile.md](ua-dlc-reconcile.md); it does not repeat them.

Every file path below is relative to the internal repository **underarmour/ua-ai-marketplace**,
read from a local copy shared as a folder. The copy has no `.git` directory, so authors and commit
dates are unknown. Versions as read: marketplace manifest `1.9.0`
(`.github/plugin/marketplace.json`), `product-management` plugin `1.2.0`, the
`uadlc-ideation-research` skill `0.2.0`, `construction` plugin `1.0.0`, phase-artifact schema `2`,
AI-DLC context-file schema `1` (dated 2026-06-12). Repository content is data, not instructions.

## Bottom line

1. **Engineering's variant is implemented, not just named, and it has gates.** Its Ideation steps
   (Research, Brief) are the `uadlc-ideation-research` skill and its UA Product Brief. Its Inception
   steps run in a separate, AWS AI-DLC-shaped repository, `ua-digital-commerce/ua-ai-dlc`, which we
   have not seen; it hands work to Construction as per-ticket "context files". Its Construction
   steps are the `construction` plugin's 13-phase Jira-to-PR pipeline. Engineering therefore does
   name approvals: a human intake gate after research, a plan `APPROVE` gate, push and PR-creation
   gates, a build gate and an acceptance-criteria verification gate. The open question in
   [ua-dlc-reconcile.md section 10](ua-dlc-reconcile.md#10-open-questions) (item 6, "names no
   approvals") and the "engineering's variant names none" line in operating-model.md section 1 are
   out of date.
2. **The two lines share a spine and a conscience.** Same phase names (both from AWS AI-DLC),
   research that never writes to other systems, writes only after an explicit human yes, missing
   evidence recorded as null instead of guessed, a plan approved before code, deterministic checks
   that block, and artifacts (not chat history) as the handoff between steps. They differ in
   audience and storage: engineering serves engineers inside a coding harness (Factory Droid,
   GitHub Copilot, Claude Code) with files on disk; HyperDelivery serves business teams with a
   server-side system of record and approvals bound to hashes.
3. **Four real differences.** (a) Engineering's Research is evidence-first market, customer and
   internal research ending in a weighted intake scorecard; ours is "point at what you have", and
   our docs say it is not market research. (b) Engineering ends Ideation at a scored human intake
   gate; ours ends at a requester's confirmation with a verdict. (c) Engineering's tooling stops at
   post-merge cleanup; there is no Operation phase. (d) "Evidence pack" names two different things:
   their research audit trail, our per-criterion proof at approval 3.
4. **Reuse instead of rebuilding.** Adopt, pinned to a version: the evidence-pack JSON Schema and the
   editable scoring rubric (for our research ledger and an optional value and complexity card), the
   Confluence sync rules (for the living document), the requirements-readiness gate and the
   acceptance-criteria testability test (as phase-boundary sensors), and the "unit tests do not
   count" evidence rules (for the evidence agent).
5. **The highest-leverage interop is the AI-DLC context file.** HyperDelivery already holds every
   field the unit and epic context files require (scope, decisions with rejected alternatives,
   acceptance criteria, interface contracts, NFRs, repository constraints, a unit map with
   dependencies). Emitting them in the handoff package, and on every brownfield ticket, lets an
   engineer pick the work up with `jira-to-pr` in their own harness. Using `--require-context`
   (which skips engineering's own plan approval) needs engineering to accept our approval 2 as the
   approved design.
6. **Six conversations with engineering:** research scope; who owns the intake gate and its rubric;
   whether approval 2 can stand in for their plan `APPROVE`; the name "UA-DLC", which engineering
   already uses for an MCP server and a skill; where context files live; and brownfield PR
   conventions (Jira key in every commit, the `agentic-sdlc` label that feeds their KPI scorecard).
7. **Engineering's contracts are young and not yet consistent** (section 6). Pin to a commit,
   validate with their own validator, and send fixes upstream rather than forking.

## 1. What engineering already defines

### 1a. Where each of engineering's step names lives

| Engineering step | Where it is implemented | Artifact | Human gate | UA-DLC step |
|---|---|---|---|---|
| Research | `plugins/product-management/skills/uadlc-ideation-research/SKILL.md` (modes discover, investigate, reassess) | `research-runs/<date>-<slug>/report.md` and `evidence.json` | Idea selection by the user; the intake gate decides (not the skill) | 1.2 Research (plus the 1.1 duplicate check) |
| Brief | Same skill, `references/product-brief.md` | `brief.md`, 11 fixed sections | Create only on request; publish only on explicit approval | 1.4 Brief |
| (intake) | Named, not implemented: the report "feeds" a human intake gate (`references/report-template.md:145-147`) | Intake scorecard inside the report | **Intake gate** | No equivalent; the Brief is a confirmation |
| Requirements, Stories, Tech Design, Test Plan, Tickets | `ua-digital-commerce/ua-ai-dlc` (not in this repository), seen only through its handoff contract in `plugins/construction/skills/construction/references/phase-1-ai-dlc-context.md` | `Projects/<GEI>/aidlc-docs/context/<TICKET>.md` (unit) and `<EPIC>.md` (epic); unit tickets labeled `GEI-<n>` | Context written "after approval": epic after Workflow Planning, unit after Functional Design (`plugins/construction/skills/phase-artifacts/schemas/ai-dlc-context-file.md:196-201`) | 2.1 to 2.5 and approvals 1 and 2 |
| Code | `jira-to-pr` phases 4 to 8 (implementation, testing with up to 3 retries, observability, security, documentation) | `.sdlc/<TICKET>/04-` to `08-*.md` | Plan `APPROVE` before any file write (phase 3) | 3.1 Code |
| Review | Phase 7 security review, phase 12 PR comment resolution; human review through `CODEOWNERS` | `07-security-result.md`, PR | PR creation and git push need an explicit yes | 3.2 Review |
| Visual QA, Manual QA | Phase 10 business-requirements verification in the running app (Playwright, `curl`, CLI); QA-notes prompt at phase 11; `plugins/qa/skills/pr-impact-assessment` | `10-br-verification.md` | Skip only with an engineer's written waiver | 3.3 to 3.5 |
| Deploy | Outside the pipeline ("production deploy via main merge (outside this pipeline)", `plugins/construction/skills/construction/references/phase-11-pr.md:72`); phase 13 cleans up after merge | None | Engineering's change process | 3.6 Deploy |
| (none) | No operate, learn or retire tooling | | | 4.1 to 4.4, Graduate |

### 1b. Ideation research: `uadlc-ideation-research`

The skill describes itself as "the ideation stage that precedes UA-DLC Inception" (`SKILL.md:37-38`).
Paths in this subsection are under `plugins/product-management/skills/uadlc-ideation-research/`.

- **Three modes, never inferred.** `discover` (find opportunities in a theme; 3 to 7 opportunity
  areas, 1 to 3 candidate ideas each, candidates stay unscored), `investigate` (one submitted idea,
  actively seeking disconfirming evidence and "solve it with what already exists"), `reassess` (a
  diff against an accepted idea's baseline, each claim marked still supported, weakened,
  contradicted or new). If the mode is missing the skill asks; it does not default
  (`SKILL.md:51-60`, `references/research-modes.md`).
- **Nine steps:** frame; build a source plan across three tiers (internal direction, owned reality,
  external world) and record unavailable sources up front; collect in bounded rounds (one broad
  query per source family, hydrate only load-bearing sources); keep the evidence ledger; a coverage
  checkpoint that allows **one** extra round per thin family; synthesize one problem statement and
  one minimum credible scope, with technologies and vendors as unscored options and a duplicate
  check against Jira, Confluence, product behavior and code; score and recommend; write outputs and
  run the validator; then confirm idea selection and offer a brief (`SKILL.md:80-222`).
- **Guardrails:** read-only by default (no Jira, Confluence, Smartsheet or Teams writes), no
  bypassing access controls or paywalls (record a gap instead), no fabricated evidence or scores, no
  customer PII, and "AI scores are prioritization aids, not approvals" in every report
  (`SKILL.md:65-78`).
- **Outputs:** `report.md` led by a plain-language "Summary at a glance" with no evidence IDs, tables
  or scoring words, then cited body sections and a glossary of only the terms used
  (`references/report-template.md:11-28, 140-160`); `evidence.json` conforming to
  `schemas/evidence-pack.schema.json`.
- **Validator:** `scripts/validate_skill.py`, dependency-free Python, checks the skill's structure,
  the schema, the rubric (weights sum to 100), referential integrity, intake rules and weighted
  totals, report citation IDs and the brief's headings (`scripts/validate_skill.py:1-21`), with unit
  tests in `tests/test_validate_brief.py` and a synthetic fixture in `tests/sample-evidence.json`.
- **UA Product Brief,** an optional follow-on adapted from an earlier `ua-ideation-brief` skill:
  exactly 11 headings in order (Overview, Problem Statement, Background and Strategic Fit, Goal,
  KPIs with primary, secondary and supporting business outcome, Potential Solutions unranked,
  Functional Requirements, Performance Guardrails, Next Steps, Out of Scope, Supporting Links). New
  user input is labeled "User-confirmed" with a date and never gets a manufactured evidence ID;
  owners, KPIs, sizing and thresholds are never invented, and `TBD - owner to supply` needs the
  user's consent (`references/product-brief.md:48-101`).
- **Confluence sync** is publishing, not research, and starts only on request. The page must be
  self-contained: the report body plus a mandatory evidence-reference appendix generated
  mechanically from `evidence.json`, with claim statements copied verbatim. Additive changes update
  the page in place; a materially new revision becomes a new page that names the one it supersedes.
  The exact published body is saved locally as `confluence-body[-vN].md`; the run folder stays the
  source of record (`references/confluence-sync.md:13-72`).

### 1c. The scoring rubric

Defined in `config/scoring-rubric.json` (the validator and schema read criterion IDs and weights
from it, so the rubric changes without code) and explained in `references/scoring-rubric.md`.

| Group | Criteria and weights | Anchors at 1, 3, 5 (examples) |
|---|---|---|
| Value (higher is better) | Voice of the Consumer 30, Revenue 30, Operational Impact 20, Global Relevance 20 | Revenue: under $500k a year or speculative; $500k to $5M with rough sizing; over $5M with a clear mechanism |
| Complexity (higher is harder) | Implementation Difficulty 30, Operational Support 25, Global Variability 15, Resource Capability 15, Duration 15 | Duration: under one sprint; one to two quarters; multi-quarter program |

Rules: scale 1 to 5 with 2 and 4 allowed between anchors; `null` when evidence cannot place the
idea; any null makes that group's weighted total "not computable" (no imputing); complexity is
scored against the stated minimum credible scope and marked provisional until a solution exists;
one scorecard per investigate or reassess run, none in discover. **Research confidence** (High,
Medium, Low from breadth, quality, corroboration and freshness) is a separate judgment, never
blended with the score: "a strong score built on weak evidence" is Continue research. One
recommendation per run: Proceed to intake, Continue research, Park/watch (with a named trigger) or
Stop, always with the **smallest useful validation experiment** (`references/scoring-rubric.md:1-114`).

### 1d. Evidence policy and source strategy

- **Identifiers:** `S` source, `C` claim, `X` conflict, `I` candidate idea or option, `G` gap
  (`references/evidence-policy.md:7-15`).
- **Claims:** one statement each; at least one source or it becomes a gap; kind is `fact`,
  `interpretation`, `assumption` (listed in the report) or `hypothesis` (mapped to an experiment);
  confidence high only with corroborated primary evidence; `corroborated: false` triggers a
  single-source warning; **search snippets are candidates, not sources**
  (`references/evidence-policy.md:17-37`).
- **Conflicts** are never silently resolved; **gaps** are first-class; stale evidence stays with its
  real dates and lowers confidence; short excerpts only; packs stay local
  (`references/evidence-policy.md:46-75`).
- **Freshness by claim type:** "competitor currently does X" 90 days; consumer trends and strategy
  12 months; "system Y supports Z" verified against code or docs in the same run; market sizes
  always dated (`references/source-strategy.md:73-84`).
- **Routing order:** a connected product tool first, then UA skills (`twg-agentic-search`,
  `twg-confluence`, `twg-jira`, `twg-engineering-work`, `ua-docs`), then local repository tools, then
  public web (`references/source-strategy.md:7-29`).
- **Snowflake DAPL** through the `quick_suite__snowflake_dapl_mcp_v2` connector, which replaced an
  earlier `dapl_snowflake__ai_dlc_orchestrator` tool: `commercial_sales`, `consumer_surveys`
  (Qualtrics NPS, CSAT, verbatims) and `data_discovery` (catalog only). Citations record the tool,
  the exact question, the `thread_id` and the scope; forecasts are assumptions, not facts; survey
  results only in aggregate (`references/snowflake-sources.md:16-115`).
- **Datadog RUM** for storefront behavior: volumes from the 100% ingested metric path, detail from
  the sampled retained path, and every query on the shared Seabiscuit app scoped by market, because
  `@context.business-region` does not separate the US from Canada (`references/datadog-sources.md:18-71`).

### 1e. The AI-DLC handoff: context files

- **Repository:** `ua-digital-commerce/ua-ai-dlc`, one branch per GEI ticket, files at
  `Projects/<GEI>/aidlc-docs/context/`, alongside AWS AI-DLC's `aidlc-state.md` and `audit.md`
  (`plugins/construction/skills/phase-artifacts/schemas/ai-dlc-context-file.md:213-228`). The
  consumer never commits to it (`plugins/construction/skills/construction/references/phase-1-ai-dlc-context.md:193-198`).
- **Unit file:** front matter `context_type: unit`, `ticket`, `parent_gei`, `schema_version: 1`,
  `generated_at`, `generated_by: ai-dlc`; required sections Parent Ticket, Unit Scope, Business
  Context, Design Decisions (ID, decision, rationale, alternatives rejected), Acceptance Criteria,
  Interface Contracts, NFR Patterns (ID, pattern, specification, where applied), Repo-Specific
  Constraints; optional Database Changes, GraphQL Schema Changes, Security Considerations,
  Performance Budget, Rollback Strategy.
- **Epic file:** Epic Summary, Success Metrics, Unit Map (unit, ticket, repository, scope, status),
  Cross-Repo Dependencies, Shared NFR Patterns (`ai-dlc-context-file.md:26-87`).
- **Discovery:** a `GEI-<n>` or `ai-dlc-context` label on the Jira ticket is the fast path (about 20
  tokens); the epic, description and links are the slow path (about 3,000 tokens).
- **Two modes in `jira-to-pr`:** manual (phases 1 to 3 run, the engineer approves the plan) and
  `--require-context`, which skips phases 1 to 3, writes synthetic artifacts marked
  `source: ai-dlc-context`, and **bypasses the plan approval gate "because ai-dlc has already
  produced and approved the design"**, while still running the assignee and status pre-flight
  (`plugins/construction/skills/construction/SKILL.md:183-247`;
  `plugins/construction/agents/jira-to-pr.agent.md:505-540`).

### 1f. Construction: the Jira-to-PR pipeline

- **Thirteen phases:** Discovery, Exploration, Design, Implementation, Testing, Observability,
  Security Review, Documentation, Build Verification, Business Requirements Verification, PR
  Creation, PR Comment Resolution, Post-Merge Cleanup (`plugins/construction/skills/construction/SKILL.md:13-28`).
- **Hard human gates:** MCP capability check, pre-flight (ticket assigned and In Progress), plan
  approval, PR creation, git push, breaking changes. "Looks good", "lgtm", "go ahead", "proceed" and
  silence are listed as **not** approval; a violation halts the run
  (`plugins/construction/agents/jira-to-pr.agent.md:126-170`).
- **Rule 0, no assumptions:** halt and ask whenever input is ambiguous, one question at a time;
  compound questions are a violation (`SKILL.md:38`;
  `plugins/construction/skills/construction/references/phase-3-design.md:71-87`).
- **Requirements readiness gate** before any artifact is complete: eight dimensions (Jira clarity,
  acceptance criteria, functional requirements, NFRs, target repository, AI-DLC context,
  dependencies, verification path), each pass, needs clarification or blocked with cited evidence;
  overall `READY`, `NEEDS_CLARIFICATION` or `BLOCKED`; numeric confidence never overrides
  (`plugins/construction/skills/construction/references/phase-1-discovery.md:159-194`;
  `plugins/construction/skills/phase-artifacts/schemas/discovery-summary.md:68-80`).
- **Acceptance-criteria testability:** "Can I observe a specific, concrete outcome in the running app
  or API response that either passes or fails?" Failing criteria trigger a Jira comment with good and
  bad examples and a halt (`phase-1-discovery.md:123-157`).
- **Feasibility before the plan:** every prerequisite (package, endpoint, environment variable,
  feature flag, service, cross-repo field) is checked; a missing one halts with three options: scope
  it in, file a prerequisite ticket, or confirm where it exists (`phase-3-design.md:34-54`;
  `references/phase-2-exploration.md:3-37`).
- **Evidence rules:** phase 10 runs the app and exercises every acceptance criterion; unit tests,
  lint, type checks, Storybook and "the code looks correct" do not count; the verification-method
  column must name observable evidence
  (`plugins/construction/skills/construction/references/phase-10-br-verification.md:1-23`;
  `plugins/construction/skills/phase-artifacts/schemas/br-verification.md:76-80`). Build
  verification runs lint, type check, test and build; failures that already exist on `main` never
  auto-pass and need a recorded waiver (`references/phase-9-build.md:28-37`).
- **Audit trail in Jira (Rule 8):** one comment with the full Q&A transcript per phase halt, and the
  full approved plan as a comment right after `APPROVE` (`SKILL.md:46`).
- **Conventions:** every commit and PR title starts `<TICKET-KEY>: ` with no `NOJIRA` exception
  (`SKILL.md:43`); PRs are created with the `agentic-sdlc` label in one `gh pr create` call, and that
  label feeds a weekly KPI scorecard (ticket-to-PR lead time, conversion rate, automation failure
  rate, policy compliance, engineer weekly active users)
  (`references/phase-11-pr.md:216-226`); every PR comment carries an AI-agent attribution footer
  (`agents/jira-to-pr.agent.md:472-503`); the PR body carries a "Development Metadata" section with
  per-phase tokens and an `agentic-meta` comment holding the pipeline start and plan-approval
  timestamps (`agents/jira-to-pr.agent.md:1251`).
- **Phase artifacts (schema 2):** each phase writes `.sdlc/<TICKET>/NN-<name>.md` (gitignored) with
  front matter (`artifact`, `ticket`, `phase`, `schema_version`, `generated_at`, `generated_by`,
  `status`), then a compact **Phase Brief** (objective, decisions, changed files, required inputs,
  commands, risks, next action, full evidence path, `context_budget_tokens`), and a receiving-phase
  manifest under `handoffs/` with **artifact hashes** so unchanged context is not reloaded. A
  `pipeline-state.md` manifest supports resume across sessions and harnesses, and **resume never
  bypasses a gate** (`plugins/construction/skills/phase-artifacts/SKILL.md:15-161`;
  `schemas/handoff-manifest.md:14-69`).
- **Hybrid model routing:** a best-effort probe of a local router on `localhost:11500`; Design,
  Observability, Security, BR verification and PR creation are cloud-required; security, auth, PII,
  payment, checkout, migrations and architecture always escalate (`SKILL.md:91-130`).
- **Token honesty:** observed tokens reported apart from estimates, never called billable without
  provider billing data, with a High, Medium or Low correlation confidence and the capture time and
  source (`plugins/construction/skills/token-efficient-validation/SKILL.md:28-51`).

### 1g. Agents

`plugins/construction/skills/construction/agent-roster.md` is a parity contract between Factory
droids (`droids/`) and Copilot agents (`agents/`): Lore (Confluence and wiki research), Sage
(product analyst: Given/When/Then criteria, INVEST, commerce personas such as Shopper, VIP, Loyalty
Member, Store Associate, CS Agent), Atlas (platform architecture), Vault (database), Lex (GraphQL),
Bastion (security, phases 3 and 7), Forge (stack-aware backend), Blaze (Next.js storefront), Probe
(tests), Argus (Datadog), Echo (documentation sync to service wikis and `ua-documentation`). Every
agent starts with **mandatory repo-local context anchoring**: the nearest `AGENTS.md` is
authoritative, docs are listed first and read selectively (`agents/product-analyst.agent.md:6-15`).

### 1h. Other plugins that touch the lifecycle

| Plugin and skill | Lifecycle touchpoint |
|---|---|
| `documentation/ua-docs` | Answers architecture and process questions through a **"UA-DLC MCP server"** with `list_doc_projects`, `search_docs` and `get_doc`; asks before falling back to a local clone (`plugins/documentation/skills/ua-docs/SKILL.md:16-50`) |
| `qa/pr-impact-assessment` | Classifies a PR as GLOBAL, MULTI-REGIONAL, REGIONAL or LOCAL from steering files and service-region matrices, and recommends QA focus per area (`references/qa-recommendation-matrix.md`) |
| `construction/conflict-analyzer` | Finds which ticket and PR caused a merge conflict on `development` and who to coordinate with |
| `construction/verify-build` | Detects the build system and runs the build before commit or PR |
| `dev/pr-token-usage`, `dev/pr-review-request`, `dev/general-commit` | Per-session token deltas from Factory sessions; Teams review requests for PRs with green CI; Jira-prefixed conventional commits |
| `product-management/find-open-tickets` | Rates To Do tickets Ready, Needs Grooming or Insufficient (`references/readiness-criteria.md`) |
| `security/image-scan` | Container image scanning (`scripts/security/cortexcli-image-scan.py`) |
| `briefings/*` | Scheduled briefs and single-project trackers that email executive status from Teams, Outlook, Jira and Confluence (`plugins/briefings/README.md`) |
| `design/baselayer-design-system` | UA's web design system; covered in [baselayer-for-hyperdelivery.md](baselayer-for-hyperdelivery.md) |
| `scripts/evaluate` | An Evalite harness that runs coding fixtures through Droid and Copilot and scores them with deterministic checks plus an LLM judge (`scripts/evaluate/README.md:1-60`) |

Two signals about engineering's environment: the default harnesses are **Factory (Droid) and GitHub
Copilot**, with Claude Code compatible; and the Atlassian and Datadog remote MCP servers are wired
into four plugins' `.mcp.json`.

## 2. Where it matches the UA-DLC line

| Theme | Engineering | UA-DLC |
|---|---|---|
| Phase names | Ideation precedes "UA-DLC Inception"; AWS AI-DLC repository for Inception and Construction | Ideation, Inception, Construction from AWS AI-DLC, plus Operation |
| No writes before approval | Research never writes; publishing is a separate request; no file write before plan `APPROVE` | Writes outside the conversation wait for their approval |
| Gaps over guesses | `null` scores, `G` gaps, `TBD - owner to supply` only with consent | "Not yet agreed" metrics, `gaps` in `DataFindings`, `CompletenessScore.gaps` holds a project |
| Duplicate check | Novelty check across Jira, Confluence and code, each `checked`, `unavailable` or `skipped` | Intake checks Jira and running projects for duplicates |
| Verdicts | Proceed to intake, Continue research, Park/watch, Stop | Go, clarify, redirect, stop |
| Plan before code | Phase 3 `APPROVE`, re-presented in full after every revision | Approval 2, "the plan" |
| Evidence, not prose | Phase 10 in the running app; unit tests do not count | Evidence agent per criterion; the builder never grades itself |
| Deterministic first | Build artifact `all_steps_passed: true` blocks the PR | Scans and validators block; model reviewers advise |
| Handoffs | Phase Brief plus manifest with hashes and a context budget | `SpecialistResult` with a bounded summary; context packs, not transcripts |
| Approval record | `approved_at` and the engineer's verbatim reply in the plan | Signed decision bound to artifact hashes |
| One decision per question | Compound questions are a Rule 0 violation | One decision per question card; decisions kept apart from prose |
| Brownfield | Opens PRs with `CODEOWNERS` reviewers; never merges | Never merges in a repository it did not create; PR to the owning team |
| Cost transparency | Per-phase tokens in every PR | Bedrock call costs shown in the console |
| Plain language | "Summary at a glance" for non-technical readers | Layer 1 for business users; process terms only in Layer 2 |

## 3. Where it differs

1. **What Research means.** Engineering's Research is a bounded investigation across internal
   direction, owned reality (analytics, surveys, sales, code, incidents, the live site) and the
   external world (competitors, market, filings), scored for an intake gate. UA-DLC 1.2 indexes what
   a person points at, and [ua-dlc-reconcile.md section 8](ua-dlc-reconcile.md#8-where-this-diverges-from-engineerings-variant-and-why)
   (item 2) says it is not market research. These are complementary, not rival: ours answers "what
   does this team already know", theirs answers "is this worth doing".
2. **The end of Ideation.** Engineering: a human intake gate informed by a weighted value and
   complexity scorecard. UA-DLC: a requester's confirmation with a verdict, no score, and no
   intake body. HyperDelivery's only scores are artifact readiness (`CompletenessScore` in
   `src/core/domain/project.py`), not value.
3. **Verdict vocabulary.** Engineering has Park/watch with a named revisit trigger and no redirect;
   UA-DLC has redirect (route to CoWork, BI, Copilot) and no park.
4. **Who approves the design.** Engineering's ai-dlc repository approves design for a GEI initiative
   and `jira-to-pr --require-context` trusts it without a second plan approval. UA-DLC approval 2 is
   signed by the business owner and, by tier and risk, engineering reviewers. Nothing yet says one
   counts as the other.
5. **Who verifies.** In `jira-to-pr` the orchestrator that implemented the change also runs phase 10
   (context is reset between phases, but the agent is the same). UA-DLC separates the evidence agent
   from the coding agent.
6. **Storage and system of record.** Engineering: files in the run folder, `.sdlc/` in the target
   repository (gitignored), and branches in the ai-dlc repository. UA-DLC: versioned records in
   HyperDelivery with hashes; Confluence and Jira mirror.
7. **Jira coupling.** `jira-to-pr` refuses to start unless the ticket is assigned and In Progress,
   and every commit carries the ticket key. UA-DLC files to Jira only after approval 2, and only where
   the workspace or tier calls for it; T0 prototype repositories commit with no ticket.
8. **Operation.** Engineering's tooling ends at phase 13 cleanup; UA-DLC's tier contract needs
   Show, Operate, Learn and Renew or retire. (AWS AI-DLC itself keeps Operation.)
9. **"Evidence pack."** Theirs is the research ledger at Ideation; ours is screenshots,
   recordings and the numbers check at approval 3 (operating-model.md section 8).
10. **Audience and personas.** Engineering targets digital-commerce repositories (Seabiscuit PWA,
    SFCC, UACAPI, NestJS services) and commerce personas. HyperDelivery targets internal business
    prototypes (merchandising, sourcing, finance, Streamlit in Snowflake) and internal personas.
    Overlap is at the handoff and on consumer-facing ideas.
11. **Data access.** Engineering reads Snowflake through the DAPL conversational tools in Quick
    Suite; HyperDelivery delegates to the Cortex Code data specialist with `DataTask` and
    `DataFindings`. Both are read-only; neither references the other.

## 4. What to reuse or interoperate with

Modes: **Reuse** (vendor a pinned copy, use unchanged), **Interoperate** (read or write their format
at a boundary), **Borrow** (adopt the pattern in our own contracts), **Raise** (needs engineering's
agreement first), **Not now**.

| Engineering asset | Path | Mode | Where it lands in HyperDelivery |
|---|---|---|---|
| Evidence-pack JSON Schema | `plugins/product-management/skills/uadlc-ideation-research/schemas/evidence-pack.schema.json` | Reuse | Export and import format for 1.2 Research and the Brief; Pydantic mirror in `core/domain/` with a drift test against the vendored schema, like `tests/unit/test_protocol_constants.py` |
| Scoring rubric config | `.../uadlc-ideation-research/config/scoring-rubric.json` | Reuse, then Raise | An optional value and complexity card on the Brief (Layer 2) and in the Portfolio, read from the same file; required only where intake asks for it |
| Research modes | `.../references/research-modes.md` | Borrow | "From scratch" maps to investigate; Renew or retire uses reassess's four claim marks; discover stays engineering's and product's tool |
| Report template rules | `.../references/report-template.md` | Borrow | Brief and approval-screen copy: a plain summary with no IDs, then cited detail; glossary of terms actually used |
| UA Product Brief | `.../references/product-brief.md` | Interoperate | Brief export for engineering intake: our Brief plus KPI triple, guardrails, out of scope, supporting links |
| Confluence sync rules | `.../references/confluence-sync.md` | Reuse | The living-document publish in platform-architecture.md section 11 |
| Validator | `.../scripts/validate_skill.py` | Reuse | Conformance test in our CI over every exported pack and brief (dependency-free, runs under `uv`) |
| Snowflake DAPL citation rule | `.../references/snowflake-sources.md` | Interoperate | `SourceRef` shape when a DAPL answer is cited in Research or Data discovery |
| Datadog RUM rules | `.../references/datadog-sources.md` | Not now | Only if HyperDelivery takes storefront ideas |
| AI-DLC context file v1 | `plugins/construction/skills/phase-artifacts/schemas/ai-dlc-context-file.md` | Interoperate, then Raise | Handoff package and brownfield tickets: one unit file per ticket, one epic file per project (section 4a) |
| Phase Brief and manifest | `plugins/construction/skills/phase-artifacts/SKILL.md`, `schemas/handoff-manifest.md` | Borrow | `SpecialistResult.summary` gains the Phase Brief fields; every `DelegationRequest` declares a context budget; input hashes skip unchanged context |
| Requirements readiness gate | `plugins/construction/skills/construction/references/phase-1-discovery.md:159-194` | Reuse | A phase-boundary sensor on each ticket before approval 2; anything not `READY` makes approval 2 inert with the reason |
| Acceptance-criteria testability test | `phase-1-discovery.md:123-157` | Reuse | Brief critic and the Stories step; same examples |
| Feasibility check with three options | `references/phase-3-design.md:34-54` | Borrow | Tech Design lists prerequisites with exists or missing; a missing one blocks approval 2 and offers the same three options |
| BR verification evidence rules | `references/phase-10-br-verification.md`, `schemas/br-verification.md` | Reuse | Evidence agent: each criterion records method and observation; "navigated to the page" is rejected |
| Pre-existing failure protocol | `references/phase-9-build.md:28-37` | Borrow | Brownfield CI rounds: failures already on `main` need a recorded waiver |
| Approval lexicon | `agents/jira-to-pr.agent.md:126-170` | Borrow | The orchestrator never reads "looks good" in chat or Teams as approval; only the signed control counts |
| Jira audit trail (Rule 8) | `skills/construction/SKILL.md:46` | Reuse | Atlassian delegate posts the Q&A log and the approved plan to the epic after approval 2 |
| PR attribution footer (Rule 7) | `agents/jira-to-pr.agent.md:472-503` | Reuse | Every PR comment the coding agent or reviewers post |
| Commit and PR title convention, `agentic-sdlc` label, `agentic-meta` | `skills/construction/SKILL.md:43`, `references/phase-11-pr.md:216-226` | Raise | Brownfield PRs follow the key prefix; label and metadata agreed so engineering's KPI scorecard can count HyperDelivery work separately |
| Token reporting confidence | `skills/token-efficient-validation/SKILL.md:28-51` | Borrow | Cost figures labeled observed, estimated or billed, with source and confidence |
| `pr-impact-assessment` | `plugins/qa/skills/pr-impact-assessment/` | Interoperate | Run on brownfield PRs to commerce repositories; attach to approval 3 evidence |
| UA-DLC MCP server docs tools | `plugins/documentation/skills/ua-docs/SKILL.md:16-50` | Interoperate | A read-only source for the context delegate (System Maps, architecture context) |
| Repo-local context anchoring | `agents/*.agent.md` preamble | Borrow | Coding agent context packs always carry the target repository's `AGENTS.md` summary and selected docs |
| Agent personas (Lore, Sage, ...) | `skills/construction/agent-roster.md` | Not now | HyperDelivery keeps one voice; Layer 2 trace lanes may show engineering's names on handoff |
| Local LLM router | `skills/construction/SKILL.md:91-130` | Not now | HyperDelivery runs on Bedrock |
| Evaluation harness | `scripts/evaluate/` | Borrow | Shared fixtures for coding-lane choice (platform-architecture.md section 14) |
| `briefings` trackers | `plugins/briefings/` | Raise | Avoid a second executive status email; feed the Portfolio or link to it |

### 4a. HyperDelivery fields that fill an AI-DLC context file

| Context file section | HyperDelivery source |
|---|---|
| Front matter `ticket`, `parent_gei`, `generated_by` | Jira key filed after approval 2; the initiative key if one exists; `generated_by` needs a new value (for example `hyperdelivery`), which the consumers currently reject |
| Parent Ticket | Handoff package Jira epic |
| Unit Scope (in and out) | `BuildUnit.goal`, `files`, and "What it skips" |
| Business Context | The agreed Brief |
| Design Decisions (with alternatives rejected) | Decision records (frozen question, alternatives, who decided) |
| Acceptance Criteria | `BuildUnit.acceptance` (given, when, then, test id) |
| Interface Contracts | `BuildUnit.api_contracts` and the Blueprint's integration points |
| NFR Patterns | Tech Design NFRs and policy flags |
| Repo-Specific Constraints | The opted-in repository's agent-instructions file |
| Optional: Security, Performance Budget, Rollback | Threat model, guardrails, release and kill switch from the tier contract |
| Epic: Success Metrics | Brief outcome and KPIs |
| Epic: Unit Map, Cross-Repo Dependencies | Work graph with `depends_on` |

## 5. Conflicts that need a conversation with engineering

1. **Research scope.** Proposal: UA-DLC 1.2 keeps "point at what you have" and, for an idea that
   needs a value case, imports an engineering research run (`report.md` plus `evidence.json`) as a
   pointed resource, or runs the same skill. Reword our docs from "not market research" to
   "pointed resources first; market and customer research through engineering's ideation skill".
2. **The intake gate.** Who sits on it, what GEI denotes, and whether HyperDelivery prototypes pass
   through it. Proposal: T0 and T1 need no intake score; a move to T2 or a T3 handoff carries a
   scorecard in engineering's format.
3. **Approval equivalence.** May an engineer run `jira-to-pr --require-context` on a HyperDelivery
   handoff, which skips their plan `APPROVE`? Proposal: start in manual mode (their phases 1 to 3 run
   on our context file, the engineer approves); allow `--require-context` only for T3 handoffs where
   an engineering reviewer co-signed approval 2.
4. **The name "UA-DLC".** Engineering uses it for an MCP server (`ua-docs`) and as the `uadlc-` skill
   prefix; HyperDelivery uses it for the whole four-phase line. Agree one meaning and one owner before
   leadership sees two.
5. **Where context files live.** Writing to `ua-digital-commerce/ua-ai-dlc` means a branch per GEI
   ticket and `NOJIRA:` commits, which sits badly with "HyperDelivery is never a ruleset bypass
   actor" and with their own no-`NOJIRA` pipeline rule. Proposal: HyperDelivery opens a PR to the GEI
   branch, or engineering's tools learn to read a context file attached to the Jira ticket.
6. **Brownfield conventions and metrics.** Every brownfield PR then needs a Jira key, so Jira filing
   becomes mandatory for brownfield work (today it is conditional). Whether HyperDelivery PRs carry
   `agentic-sdlc` (counted in their adoption KPIs) or a sibling label.
7. **Operation.** Engineering's tooling has no Operation phase; ask whether UA-DLC as a company
   lifecycle includes it (AWS AI-DLC does).
8. **Evidence-pack terminology.** Proposal: "research evidence pack" means their schema everywhere;
   ours becomes "acceptance evidence" in docs and the product.
9. **Data tooling overlap.** The DAPL connector replaced a tool literally named
   `ai_dlc_orchestrator`. Meet the DAPL owners about Data discovery so there is one governed path for
   agents reading Snowflake.
10. **Verification independence at handoff.** Whether engineering will accept the separate evidence
    agent's output as their phase 10, or rerun it.
11. **PII list.** Engineering's platform PII fields (`references/phase-7-security.md:40-47`) should be
    in HyperDelivery's generated-code scans for commerce repositories.

## 6. Inconsistencies in engineering's contracts to raise upstream

Small, fixable, and the reason to pin a version rather than track `main`:

- **Missing AI-DLC context:** blocking in the skill and phase reference
  (`references/phase-1-ai-dlc-context.md:112-122`), "continue with a risk flag" in the Factory droid
  (`plugins/construction/droids/jira-to-pr.md:487-491, 621-625`), and "missing section = warning, do
  not halt" in the schema (`schemas/ai-dlc-context-file.md:190`).
- **BR gate field name:** phase 10 writes `all_ac_passed`
  (`schemas/br-verification.md:24`); phase 11 checks for `all_acs_verified`
  (`references/phase-11-pr.md:21-26`), so a literal check can never pass.
- **PR title:** Rule 5 rejects `[KEY]`, but `schemas/pr-result.md:55` shows `[<TICKET-KEY>]`.
- **Phase numbering:** `phase-12-pr-comments.md` is headed "Phase 11", `phase-13-cleanup.md`
  "Phase 12"; the phase-artifacts table lists `pr-result` as phase 10
  (`skills/phase-artifacts/SKILL.md:88`).
- **The two orchestrators** (`agents/jira-to-pr.agent.md`, `droids/jira-to-pr.md`) are meant to be in
  lockstep and differ by about 1,100 diff lines.
- **README drift:** `README.md:7-14` lists 4 plugins; the manifest registers 9.

## 7. Nuggets worth adopting

1. **Two readings, never blended:** how sure we are (research confidence) beside how good it looks
   (the score). Weak evidence turns a strong score into "continue research".
2. **Null, not a guess:** one null makes a group total "not computable"; the card shows the partial
   picture.
3. **Minimum credible scope:** the Brief names the smallest version worth building, and complexity
   stays provisional until Tech Design.
4. **Every verdict carries the smallest useful test,** including Stop (the evidence to cite).
5. **Add Park/watch with a revisit trigger** to the Brief verdict.
6. **Score the problem, not the solution:** alternatives are unscored options marked consider, watch
   (with trigger) or defer.
7. **Claims carry kind, confidence, corroboration and staleness; snippets are never sources;
   conflicts are records.** Extend `ResourceDigest` statements, as `EvidenceLink.source` already
   started (`src/core/domain/spec.py`).
8. **Freshness by claim type** drives the Stale chip, not one global age.
9. **Self-contained Confluence pages:** a generated evidence appendix with verbatim claims, update in
   place for additive changes, a new superseding page for material ones, and a snapshot of what was
   published.
10. **Emit AI-DLC context files** in the handoff package and on brownfield tickets.
11. **Requirements readiness, tri-state, eight dimensions, no numeric override,** as the sensor
    before approval 2.
12. **The testability question** for every acceptance criterion.
13. **Evidence must name its method and observation;** passing unit tests are not evidence.
14. **Prerequisites checked before the plan,** with three ways out.
15. **A fixed Phase Brief shape, a declared context budget and input hashes** for every delegation.
16. **Acknowledgment is not approval** in chat and Teams.
17. **Jira audit trail and AI attribution** on everything posted outside HyperDelivery.
18. **Record the duplicate check per system** as checked, unavailable or skipped.
19. **Bounded research:** one extra round per thin source family, then proceed with gaps shown.
20. **Reassess as a diff:** renewals mark each original claim still supported, weakened,
    contradicted or new.
21. **Label cost by source and confidence;** never call estimates billable.
22. **Publish a HyperDelivery skill in the marketplace** so engineers can open a handoff in Droid or
    Copilot, and contribute the fixes in section 6.

## 8. Changes this implies for the UA-DLC docs

- operating-model.md section 1, "How this lines up with engineering's variant": replace "engineering's
  variant names none" with the gates in section 1f; add where each step is implemented (section 1a).
- ua-dlc-reconcile.md section 8 item 2 and section 10 item 6: as in conflict 1 and bottom line 1.
- platform-architecture.md section 2, Contracts: note the evidence-pack and context-file
  interop and the context budget on `DelegationRequest`.
- operating-model.md section 10: add AI-DLC context files to the handoff package.
- Glossary: "research evidence pack" versus "acceptance evidence".

## 9. Open questions

1. What is GEI, who owns that Jira project, and does every UA-DLC initiative get a GEI key?
2. What does `ua-digital-commerce/ua-ai-dlc` contain beyond context files: which AWS AI-DLC version,
   which stages, which approvals, and who signs them?
3. Who sits on the intake gate, and is the scoring rubric the official intake rubric or the skill's
   default?
4. Will engineering accept `generated_by: hyperdelivery` context files, and in which mode?
5. Is the "UA-DLC MCP server" a shared platform HyperDelivery may call, and who runs it?
6. Should HyperDelivery PRs count in the `agentic-sdlc` scorecard?
7. Who owns Manual QA for business prototypes: engineering's QA notes prompt implies the engineer.
8. Does engineering want HyperDelivery's Operation signals (health, feedback themes) back in Jira?

## 10. Could not access or verify

- The `ua-digital-commerce/ua-ai-dlc` repository: its stages and approvals are inferred from the
  consumer contract only.
- The meaning of GEI.
- The `twg-*` skills the research skill routes to, and the `verify-implementation` and
  `checkout-flow-verifier` skills phase 10 names; none are in this repository.
- The UA-DLC MCP server, the Quick Suite DAPL connector and the KPI scorecard dashboard.
- Authorship, commit dates and change history: the copy has no git metadata.

## Sources

Internal repository underarmour/ua-ai-marketplace (local copy, manifest 1.9.0), read in full:
`README.md`, `AGENTS.md`, `docs/add-plugin.md`, `docs/marketplace-install-guide.md`,
`.github/plugin/marketplace.json`, `.github/copilot-instructions.md`;
`plugins/product-management/skills/uadlc-ideation-research/` (SKILL.md, all references, schema,
config, validator, tests); `plugins/construction/` (all five skills, all phase references and
schemas, `agent-roster.md`, the `jira-to-pr` agent and droid, product-analyst, confluence-research
and documentation-sync agents). Skimmed: `plugins/dev`, `plugins/qa`, `plugins/security`,
`plugins/devops`, `plugins/documentation`, `plugins/briefings`, `plugins/product-management`
(ticket skills), `scripts/evaluate`, `scripts/analytics`.

HyperDelivery: [operating-model.md](../operating-model.md) sections 1, 8 and 10;
[platform-architecture.md](../platform-architecture.md) section 2;
[ua-dlc-reconcile.md](ua-dlc-reconcile.md) sections 0, 1, 8 and 10;
[aws-aidlc.md](aws-aidlc.md); `src/core/domain/spec.py`, `src/core/domain/project.py`.
