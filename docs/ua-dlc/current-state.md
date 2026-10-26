<!-- Point-in-time snapshot, 2026-10-25, of the repo at commit 3dc64a5. Compiled from six parallel reads of the code and docs, with the key claims re-checked against the code. File:line references drift as the code changes; re-check before acting on one. -->

# State of HyperDelivery

As of 2026-10-25. Branch `feat/planning-exploration-enhancements` is identical to `dev` at `3dc64a5`, committed 2026-10-01. Nothing has merged to `dev` in the 24 days since. This brief combines six reader reports (intent-history, decisions, agents-backend, platform-infra, console-ui, design-library). The claims that matter most were re-checked against the code.

Corrected on 2026-10-26 after a second read of the code: there are two DynamoDB tables, not one; browser uploads fail on `dev`; deployed project naming falls back; the agent runtimes live outside CDK; G3 refuses unfinished builds before it merges; and Distill reads Jira as well as Confluence. The plan draws this picture as a diagram in [Phase 1: Current State](enterprise-plan.md#phase-1-current-state).

## Bottom line

- **It is a working pilot.** HyperDelivery is a gated line: Distill → G1 → Blueprint → G2 → Review/build → G3 → Showroom. It runs end to end in local mode. In deployed `dev` it has been verified live only as far as G1 (README.md:136-140).
- **The core is sound, and an enterprise version should keep it.** A human signs every handoff. The server re-scores every artifact. Per-agent policy lives in `tools/`, apart from the generic clients.
- **The deployed path has three correctness breaks to fix before any expansion:**
  - Rejecting a gate kills the run.
  - Blueprint, Review and Showroom cannot ask questions or iterate.
  - Showroom marks the project done by itself.
- **The deployed configuration is incomplete in the IaC.** The console Lambda gets no `S3_BUCKET`, `GITHUB_PAT`, S3 grant or Bedrock grant, so uploads fail, the G3 merge and build status skip silently, and project names fall back to a heuristic. The deploy script forwards only the Snowflake settings, and only to Distill.
- **Authentication is real (Entra ID), but there is no authorization.** Every user acts through one person's GitHub, Atlassian and Snowflake credentials.
- **The console is carefully crafted, but it is organized around the agent crew and the pipeline.** Early users say they don't care about either. The running prototype, which is the outcome they want, is the least prominent thing on screen.

## 1. Purpose and intent

**What it is.** "Hyperdelivery is the factory line, not the cars" (AGENTS.md:7-10). Four gated stations move a project from intake to a demonstrable deliverable, and a human approves each handoff. The MVP goal is a single project traveling the full line "with agents doing the work and humans approving at each handoff" (docs/hyperdelivery-plan.md:7-9). The plan also wants enough measurement to tell whether the line is faster than today's process (docs/hyperdelivery-plan.md:11-13).

**Who it is for.** The design north star moved the default reader from engineers to the business: "Anyone at Under Armour can bring an idea to the line, see where it is, and approve the work with confidence - without learning to read an engineering tool" (docs/design/principles.md:10-11). There are six personas:
- Primary: requester, approver, SME and analyst.
- Secondary: developer and leadership.

All six are "assumed from the product plan and the code, not from research" (docs/design/personas.md:3-7). The examples come from merchandising and supply chain, not Enterprise Data Management (EDM). Three framings in this planning brief appear nowhere in the repo: "without waiting on engineering", the move from department tool to enterprise tool, and EDM as the home team.

**The friction it removes:** "agent guesswork" in requirements (plan:39-40), inputs supplied by hand and starting "fresh every project" (plan:119-120), demo slides built by hand (plan:77), and approved tasks copied by hand to a coding agent (plan:150-152).

**Binding principles:**
1. The gates are the product. Never remove or bypass one (AGENTS.md:186).
2. The server computes completeness from the stored artifact and does not trust the agent's own report (docs/decisions.md:1777-1828).
3. Provider/tool split. Generic clients have no policy. Per-agent least privilege lives in `tools/` (AGENTS.md:56-62).
4. Tools are gated by direction. Reads are proactive. Any write outside the conversation has a human gate after it (AGENTS.md:119-126).
5. No speculative infrastructure (AGENTS.md:179-181).
6. `core` is framework-free and dependencies point inward (AGENTS.md:53-55).
7. One core service with two seams, HTTP plus push, and every interface goes through the SDK (docs/decisions.md:3378-3403).
8. A documentation review and a decision-log entry are part of the Definition of Done (AGENTS.md:155-167).
9. Crew names exist only in the display layer. The wire ids stay `distill/blueprint/review/showroom` (README.md:159-161).

## 2. What exists today

"Local" means the `LocalAgentClient` bypass. "Deployed" means Step Functions plus AgentCore on `dev`.

| Capability | Status | Evidence | Note |
|---|---|---|---|
| **Agents & gates** | | | |
| Four typed agents built by one factory | done | src/agent_runtime/factory.py:509-625; src/core/domain/spec.py:84-133, review.py:61-76 | A fresh agent per request, Sonnet 5.5 for all four, no memory |
| Three human gates | done | infra/stacks/orchestration_stack.py:317-328 | `blueprint_approval`, `review_approval`, `showroom_approval`. No gate follows Showroom; one reader's "G4" is wrong |
| Server-side gate scoring | done | src/core/validation/artifacts.py:26-84 | Checks structure only, not quality |
| Signer from the token, plus a decision trail | done | src/api/routers/projects.py:1116-1122 | No artifact, prompt or model version (src/core/domain/project.py:106-114) |
| Distill question loop | done | src/tools/distill.py:320-336; orchestration_stack.py:359-367 | Local and deployed. No round cap |
| Questions and iteration at Blueprint, Review, Showroom | partial | orchestration_stack.py:350-357; ui/console/src/store/useProjectsStore.ts:955-972 | Local only |
| Review verdict | partial | src/core/validation/review.py:18-30, 75-83 | All `met=False` still scores 1.0 |
| Showroom demo | partial | src/core/domain/showroom.py:15-31 | Text only. No seeding, deck or video |
| Golden-path template | absent | src/config/agents/blueprint.yaml:153 | Exists only in prompt text |
| Citations resolve to the source file | partial | src/core/domain/spec.py:40-56 | Records the kind of source, not the file |
| **Build / coding-agent handoff** | | | |
| Review dispatches Copilot, one PR per delivery group | partial | src/tools/github.py:71-101; src/config/agents/review.yaml:141-158; src/mcp_clients/github.py:21-44 | Dependent groups branch before their predecessor's code exists |
| `plan_delivery` grouping | done | src/core/delivery.py:33-193 | |
| Build polling | done | src/api/routers/projects.py:466-503 | Polls every 15s per console on one PAT |
| G3 approval merges every build, blocking the approval if any merge fails | done | projects.py:115-153, 1112-1114; src/providers/github/merge.py:266-279 | Refuses while any open build PR is titled `[WIP]` (projects.py:131-142). Then takes each PR out of draft, updates a branch that is behind and squash-merges. No CI check of its own. Skips silently without a PAT (projects.py:127-129) |
| Separate build station | absent | src/tools/construct.py:1 | An abandoned stub. The unmerged `coding_agent_harness_test` reworks the build |
| **Orchestration** | | | |
| Step Functions line with task-token waits | done | orchestration_stack.py:285-370 | Deployed |
| Send-back on rejection | partial | src/infrastructure/repositories/project_repository.py:146; orchestration_stack.py:323-328 | Deployed goes to `Fail`, stranding the project |
| Retry or restart | absent | orchestration_stack.py:89, 372-406; projects.py:277 | 5-min Lambda against 600s turns (factory.py:48) |
| Iteration loop; deployed cancel | planned | orchestration_stack.py:323-324; docs/design/roadmap.md:132-133 | |
| Agent runtimes in CDK | absent | scripts/deploy_agent.sh:2-3, 49-74; infra/stacks/storage_stack.py:86-92 | `scripts/deploy_agent.sh` builds each image, pushes it as `:latest` and creates or updates its AgentCore Runtime. The shared execution role is also made outside CDK |
| Live streaming | done | projects.py:939-989; src/orchestration/agent_invoker.py:158-184 | SSE locally, WebSocket deployed |
| **Data & memory** | | | |
| Two DynamoDB tables: projects (single-table design: state, artifact versions, decisions, turns) and WebSocket connections | done | src/infrastructure/repositories/keys.py:8-58; infra/stacks/storage_stack.py:48-56; infra/stacks/orchestration_stack.py:118-132 | No PITR on the projects table. Lost updates (project_repository.py:149, 294, 318). The connections table holds watchers and one-time stream tickets, with a TTL |
| Standing context | partial | docs/decisions.md:616-659 | One global note |
| Historical FSD index | done | docs/decisions.md:1885-1912 | Rebuilt by hand |
| Project corpus fed back to agents | absent | src/providers/storage/s3.py:94-120 | Written, never read |
| Browser uploads | partial | src/api/routers/projects.py:451-453; src/providers/storage/s3.py:126-140; infra/stacks/storage_stack.py:108-125 | Fails on `dev` with `STORAGE_NOT_CONFIGURED`: the console Lambda has no `S3_BUCKET` and no S3 grant. Uploads go to `projects/<id>/uploads/`, and the bucket policy lets agents read only `documents/` and `fsds/`, so Distill could not open one even with storage set |
| AgentCore Memory, Bedrock KB | planned | README.md:166 | |
| **Integrations** | | | |
| Atlassian | done | src/tools/atlassian.py:15-93; src/agent_runtime/distill/main.py:37-40 | Distill reads Confluence and searches or reads Jira; Blueprint gets the Jira issue lifecycle. Static token. MCP server not version-pinned |
| GitHub (Blueprint, Review) | done | src/tools/github.py:24-118 | One classic PAT (docs/decisions.md:2078-2110) |
| Snowflake Cortex | partial | src/tools/snowflake.py:18-23 | Distill only. Read-only by prompt |
| S3 documents | partial | src/tools/documents.py:29-48; infra/stacks/storage_stack.py:108-125 | Distill only. The tool takes any key, but on `dev` the bucket policy lets agents read only `documents/` and `fsds/` |
| Microsoft 365 | absent | README.md:166 | |
| Integration settings on deployed runtimes | unverified | scripts/deploy_agent.sh:37-46; infra/stacks/console_api_stack.py:74-91 | IaC forwards Snowflake to Distill only. The console Lambda has no `S3_BUCKET` or `GITHUB_PAT`, and no S3 or Bedrock grant |
| **Auth & access** | | | |
| Entra ID SSO | done | src/api/auth.py:56-86 | ID token as the bearer. No roles |
| Roles, ownership, approvers per gate | absent / planned | src/core/domain/project.py:88-103; docs/design/roadmap.md:168-170 | |
| Per-user credentials (Identity) | planned | src/config/settings.py:35-53 | |
| **Observability & cost** | | | |
| Tokens, model and cost per turn | partial | src/agent_runtime/factory.py:144-158 | Successful turns only. No rollups |
| Tracing | partial | src/infrastructure/observability/tracing.py:7-15 | No exporter |
| Logging | partial | src/infrastructure/observability/logging.py:22-31 | Plain text. No retention |
| Metrics, alarms, analytics | absent | docs/design/personas.md:151-152 | |
| **Sandboxes & previews** | | | |
| Local preview | partial | src/infrastructure/local_preview.py:1-7 | Same machine, `localhost` |
| Hosted preview or sandbox | absent | src/config/settings.py:74-82 | |
| **Collaboration** | | | |
| SME answer page | done | ui/console/src/routes/Answer.tsx:22-159 | Copied link |
| Notifications | partial | src/orchestration/persist_approval.py:61-65 | SNS with no subscribers |
| Comments, presence, sharing | absent | src/orchestration/turn_log.py:15-25 | Turns don't record who sent them |
| Python SDK | partial | src/sdk/python/client.py:44-91 | Five endpoints. The UI doesn't use it |
| **Console UX** | | | |
| Guided intake, gate console, document viewer, canvas | done | ui/console/src/routes/Landing.tsx:19-102; ui/console/src/components/thread/GateConsole.tsx:124-534 | No brownfield starter |
| Simple and Detailed modes | partial | ui/console/src/routes/Settings.tsx:13-24 | Jargon leaks into Simple |
| Usability validation | absent | docs/design/roadmap.md:80 | |
| Phone layouts | absent | ui/console/src/routes/Workspace.tsx:95 | Out of scope since 2026-10-26: HyperDelivery targets desktop and laptop browsers |
| **Quality / evals** | | | |
| Unit tests (about 511 Python, 23 UI files, roughly 90% coverage) | done | pyproject.toml:77 | Coverage floor 10% |
| Eval sets, LLM judge, UI component tests | absent | docs/hyperdelivery-plan.md:161-162; ui/console/vite.config.ts:14-15 | |
| **Security** | | | |
| Per-agent allow-lists; no agent holds the merge client | done | docs/decisions.md:1173-1176 | |
| Write gating before G2 | partial | src/tools/github.py:24-49 | The prompt is the only gate |
| Secrets management | absent | scripts/deploy_agent.sh:43-45 | The Snowflake PAT is a plaintext env var |
| Threat model, dependency scanning, stage separation | absent | SECURITY.md:38-46 | |

**Against the MVP plan of record** (docs/hyperdelivery-plan.md, whose phases are not the UA-DLC plan's three). Phase 1 is done. Phase 2 is mostly done; the deployed line is verified only to G1. Phase 3 is about 40% done: there is no M365, Memory, Gateway, Identity or hosted preview. Phase 4 has not started: no evals, security close-out, pilot or runbook. The plan's window closed around 2026-10-18. Four branches have not merged to `dev`: `coding_agent_harness_test` (2026-10-22), `sme-dev-rebuild` (PR #30, with the UA EDMA template), `feat/more-ui-ux-enhancements` and `sme-answer-integration`.

## 3. How the line flows today

1. **Sign in.** The user sees "Sign in with Microsoft" (ui/console/src/auth/AuthGate.tsx:6-29). Home asks "What brings you here?" to pick a role, which only reorders the tiles.
2. **Start.** On `/start` the user picks a starter, fills in the four guided fields (problem, users, data, success) or writes freely, and drops in files (Landing.tsx:20-23). Pressing Start creates the project and sends Distill's first turn. In deployed mode it also starts the Step Functions execution (projects.py:277). Haiku names the project in the background (projects.py:281-293). The console Lambda has no Bedrock grant (infra/stacks/console_api_stack.py:88-91), so deployed naming falls back to a heuristic name (src/orchestration/project_namer.py:62-80). A dropped file fails in deployed mode with `STORAGE_NOT_CONFIGURED`, because the Lambda has no `S3_BUCKET` (projects.py:451-453).
3. **Distill asks.** The user sees a Kickoff card introducing the crew, then tool steps such as "Query Snowflake" (Distill can also read Confluence pages and search or read Jira issues) and questions one at a time with option chips. The user answers, skips, or copies an SME link. In deployed mode each answer resumes `WaitForDistillAnswer` (projects.py:1010-1039). The loop ends when a `StructuredSpec` is drafted.
4. **G1.** The panel reads "Scout is done. Coach starts when you approve." The user ticks the criteria, then approves or sends the draft back, with a 12s undo window.
   - Approve: `send_task_success`, and Blueprint runs.
   - Send back, local: Distill reruns with "Sent back: <comment>".
   - Send back, deployed: `send_task_failure` hits `Fail`, while DynamoDB moves the station back (project_repository.py:146). `/advance` returns 409 once a state machine exists (projects.py:653-654). The project is stranded.
5. **Blueprint.** In deployed mode it runs once. If it asks questions, nothing waits for the answers. The user sees a build plan and a Design canvas. Typing to Blueprint in deployed mode gets "This station runs automatically" (useProjectsStore.ts:955-972).
6. **G2.** The user approves the plan.
7. **Review / build.** Review groups units into delivery groups and hands each group to the Copilot coding agent, which opens one PR per group (src/tools/github.py:71-101). It then writes a coverage report that passes its gate even though no code exists yet. The user sees a BuildBoard with PRs, checks and "closes #12". The re-grade after builds settle runs only locally and is skipped once the project is at a gate (useProjectsStore.ts:825-845).
8. **G3.** The panel says "Approving merges the finished code" (GateConsole.tsx:34). The server refuses while any open build PR is still titled `[WIP]` (projects.py:131-142). Otherwise it takes each PR out of draft, brings a branch that is behind up to date and squash-merges it, all before it records the decision and with no CI check of its own (projects.py:1112-1114, 115-153; src/providers/github/merge.py:266-279). Locally, a preview is queued.
9. **Showroom.** It produces a demo script. Locally, the project finishes only when someone types "project completed" (projects.py:702-738). In deployed mode, `MarkDone` runs right after Showroom (orchestration_stack.py:350-357).
10. **Shipped.** Confetti in the crew's colors and their faces "signed off". If a local preview started, its link appears as 12px text (ui/console/src/components/thread/Thread.tsx:218-247).

## 4. The experience through a non-technical user's eyes

What works well: guided intake; questions one at a time with an "ask someone" escape; a gate that states what you approve and what happens next, with an undo bar; documents with contents, citations, export and "what changed"; plain stage names; Simple mode by default.

Where the console centers agents and machinery instead of the outcome:
- **The crew is everywhere, Simple mode included.** `AGENT_META` is imported in about 27-28 files, with 77 references; readers counted slightly differently. Specifically:
  - An avatar, name and jersey number on every turn (ui/console/src/components/thread/Turns.tsx:83-107).
  - Document tabs labeled "Scout", "Coach", "Ref" and "Host" (ui/console/src/components/inspector/Inspector.tsx:160-173).
  - "Approve and hand to Coach" (GateConsole.tsx:508) and "Message Scout…" (ui/console/src/components/thread/Composer.tsx:173).
  - A browser tab title of "Scout is working" (ui/console/src/App.tsx:60-65).
  - Kickoff, Handoff and Shipped moments all built around the crew (ui/console/src/components/moments/Kickoff.tsx:48-55, Shipped.tsx:91-122).
  - The usability test plan asks users to name "which crew member" is working (docs/design/personas.md:160).
- **The pipeline is the navigation.** "The line is the navigation" (ui/console/README.md:51). An 8-station indicator sits in the top bar, and the Portfolio board has one column per station.
- **Engineering vocabulary leaks into Simple mode,** against docs/design/vocabulary.md:136-139:
  - Pull requests, merge, checks and "No GitHub token on the console" (ui/console/src/components/thread/BuildBoard.tsx:83-149).
  - Copilot assignments with PR numbers (ui/console/src/components/inspector/views.tsx:799-838).
  - API contracts (views.tsx:621).
  - Unmet coverage shown as bare IDs such as "REQ-004 not met" (views.tsx:735-751).
- **The outcome is barely visible.** There is no "your app" object, no embedded preview and no screenshot. A project is defined by its station (ui/console/src/api/types.ts:24-36). The "demo" is a script document. The only canvas is an engineer's architecture graph.
- **Nothing is personal.** "Waiting for approval" counts every gate project for everyone (App.tsx:55-58). Handing work to someone else means copying a link. (The workspace also overflows at 375px (Workspace.tsx:95; Inspector.tsx:119); phone layouts are out of scope since 2026-10-26.)
- **None of it has been tested with users.** Every roadmap phase is marked "built, not yet usability-tested" (docs/design/roadmap.md:80, 120, 180, 216, 257, 293). The UX audit came from reading source only (docs/design/ux-audit-2026-09.md:24-26).

Hiding the crew is cheap because names live only in the display layer (ui/console/src/lib/pipeline.ts:38-45). One caveat: deployed iteration (chatting after Distill, sending work back) has to be built server-side before a single-assistant experience can feel conversational.

## 5. Enterprise readiness gap analysis

| Dimension | Current state | Gap | Severity | Foundation to build on |
|---|---|---|---|---|
| **Prerequisite: deployed correctness** | Local mode holds on gaps, sends work back, iterates and needs explicit finish. Deployed does none of these | Rejection strands the project. No Retry/Catch, a 5-min Lambda against 10-min turns, no restart. Full artifacts pass through the 256KB Step Functions payload (orchestration_stack.py:384-405) | high | Task-token waits. `prior_station` already encodes send-back. `_elicitation_wait` is the pattern for a per-station loop |
| **Future features / expansion** | Adding an agent takes YAML, a model and about 25 lines (src/agent_runtime/showroom/main.py:1-23) | Agent, station, runtime, ECR repo and port are one identity (src/core/constants.py:6-16; tests/unit/test_docs_consistency.py:53-62). The line is wired twice, locally (projects.py:168-172) and in Step Functions. Adding Handoff touched about 20 files (docs/decisions.md:2068-2077) | medium | Pure evaluators in `core/validation`. The shared `CompletenessScore`/`OpenQuestion` contract. The portable G2 contract (docs/decisions.md:1738-1773) |
| **UI/UX** | Polished and accessible, but centered on the crew | Outcome-first framing, one assistant voice, a live preview, a personal queue, Teams approval, a brownfield entry point, usability validation | high | The display-only naming layer. Simple/Detailed modes. Semantic tokens. The SME page. URL-addressable views |
| **Logging** | Plain-text stdout with a session id | No JSON logs. No user, project or request correlation. No retention. No read audit | medium | `project_id_var` already exists (src/infrastructure/observability/logging.py:22-31). Turn records in DynamoDB |
| **Agent traces** | Turn records (clipped to 1,500 chars and 60 calls) and an OTel provider with no exporter | No exported spans (Dockerfile:28 does not run `opentelemetry-instrument`). No prompt version. Decisions do not link to the artifact version they approved | medium | `TURN#` items. `ARTIFACT_VERSION#` history. X-Ray permissions on the role. Per-request Strands hooks (factory.py:390-448) |
| **Agents, sub-agents, specialists** | Review is the only LLM reviewer, and it both dispatches the build and grades it. No in-process multi-agent use (README.md:34 implies otherwise) | No independent reviewer at G1, G2 or G3. No security, data-quality or cost specialists. Every gap blocks the line, so advisory findings have nowhere to go (projects.py:693-699) | high | Add a generic critic hook after `evaluate_artifact` that writes a separate advisory record. Run specialists as agents-as-tools or a Parallel branch. Use a `BeforeToolCallEvent` hook to enforce write policy in code |
| **Fine-grained auth & access** | Authentication only | No roles, owners, departments, approver policy or 403 path (src/api/errors.py:30-90). Any user can approve their own request, delete, merge or edit the global prompt (src/api/routers/context.py:33-48). One person's credentials act for everyone, a confused deputy | high | The signer from the token. `oid` as a stable key. Entra already in place. AgentCore Identity permissions already granted (scripts/iam/agentcore-execution-policy.json:62-71) |
| **Cloud sandboxes / remote environments** | Copilot builds in GitHub Actions. Preview runs only on a laptop | No hosted preview per PR, no isolated sandbox per prototype, no teardown, no data sandbox. Deployed users never see a running app | high | `local_preview` contract (the repo's own preview script). `WorkspaceManager`/`EnvironmentScanner` (unused). Delivery groups map to branches |
| **Cross-team collaboration space** | Several people can watch a stream. Questions shared by link | No workspaces or teams. One global context. No comments, presence, sharing, assignment or notification channel. Turns do not record the sender | high | SNS publish at every wait. WebSocket fan-out. The SME answer page. `GlobalContext` could be split into layers |
| **M365 / Atlassian / AWS depth** | Atlassian and GitHub exist. Snowflake on Distill only. One account, one region, `dev` only | M365 absent (no Teams transcripts, SharePoint or notifications). Blueprint has no Snowflake or S3 access. Resource names are not env-suffixed (orchestration_stack.py:66-288). The agent runtimes and their role live outside CDK (scripts/deploy_agent.sh). No CD; images tagged `:latest` | medium-high | The provider/tool split makes new connectors cheap. The SDK as the seam for a Teams bot. CDK stacks |
| **Governance, audit, cost** | Signer and comment on each decision. Cost per successful turn | No artifact, prompt or model version on decisions. Hard deletes with no audit (project_repository.py:297-308). No PITR. G3 merges to the default branch on a business user's approval. No cost rollups or budgets. No eval or pilot baseline to back the "faster" claim | high | The fail-closed merge. Immutable artifact versions. `model_pricing.yaml`. The error-code catalog |
| **UA-specific moat** | Detects two UA FSD templates (src/tools/distill.py:16-36). Embedding search over historical FSDs. Cortex over UA Snowflake. Confluence and Jira. The UA EDMA template sits on an unmerged branch | No catalog of UA systems, data domains, owners or stewards. No golden-path template. Past projects are never fed back. Context is one free-text note. Brownfield repo discovery relies on `search_repositories` | high (strategic) | Evidence links, the FSD index, rule correlations, `plan_delivery`, and the Cortex agent. These are the seeds of a UA knowledge layer that generic tools lack |

## 6. Constraints and decisions: protect or revisit

**Protect:**
- **Gates as the product.** Every external write has a human after it (docs/decisions.md:1230-1260). The G3 merge blocks the approval if any merge fails (docs/decisions.md:1164-1193).
- **Completeness computed by the server** (docs/decisions.md:1777-1828). **Signer taken from the token,** with the decision written before the task token is released (docs/decisions.md:213-231).
- **Provider/tool split, and no agent holds the merge client** (docs/decisions.md:3562-3574, 1173-1176).
- **The portable, vendor-neutral G2 contract** (docs/decisions.md:1738-1773) and **`plan_delivery`** (docs/decisions.md:1502-1546). Rejecting a separate Handoff station also stays (docs/decisions.md:2114-2157).
- **Step Functions durable waits** (docs/decisions.md:3432-3454) and **an agent built per request** (docs/decisions.md:415-426).
- **Question cards** (docs/decisions.md:1580-1689). **Turns and cost recorded server-side** (docs/decisions.md:20-35, 122-164).
- **Undo instead of a confirmation modal** (docs/decisions.md:2518-2539). **The truststore TLS pattern** (docs/decisions.md:2609-2629).

**Revisit:**
- **Persona.** "One continuous 'Assistant' persona" (docs/decisions.md:2860-2890) was reversed four times, ending at "Plain stage names around a named crew" (docs/decisions.md:339-362). The user feedback supports the first decision. Keep attribution in Detailed mode and in the audit trail.
- **A single global context** (docs/decisions.md:616-659). Needs layering by department and project.
- **Shared credentials:**
  - The classic PAT (docs/decisions.md:2078-2110).
  - The static Atlassian token, accepted as "the one concrete cost of skipping Identity" (docs/decisions.md:3456-3471).
  - Snowflake read-only by prompt, chosen "over my objections" (docs/decisions.md:2276-2331).
  - Per-user token fields rejected (docs/decisions.md:248-262).
- **A role stored per browser, with no group mapping** (docs/decisions.md:281-298). **The ID token as the API credential** (docs/decisions.md:2560-2605).
- **G3 auto-merge on a business user's approval** for brownfield repos. Consider code-owner review or a separate engineering gate (docs/decisions.md:1164-1193).
- **A preview on a single machine** (docs/decisions.md:1134-1160).
- **Rejection fails the run** (docs/decisions.md:1974-2007 against orchestration_stack.py:323-324). Also, `LocalAgentClient` was meant to be "deleted ... not extended" (docs/decisions.md:3111-3114).
- **"No speculative infrastructure."** It has been used to reject webhooks (docs/decisions.md:1483-1486), Gateway, MCP Tasks and per-user tokens. Enterprise rollout is now the real use case.
- **No exporter for the OTel provider** (docs/decisions.md:3473-3487).
- **Skipping UA's internal design system** (docs/decisions.md:3162-3172).

**Environmental constraints that will not go away:** a TLS-inspecting proxy; PowerUserAccess without `iam:*`, so roles are managed outside CDK (docs/decisions.md:1942-1947); one hard-coded AWS account (docs/decisions.md:3371-3376); GitHub SAML SSO, which forces a classic PAT; Copilot licensing and seat prerequisites (docs/decisions.md:2183-2190); no GitHub Enterprise Server support; a single-tenant Entra app with no API scope; an unreachable private Artifactory.

## 7. Contradictions and open questions

**Docs vs code:**

| Doc claim | Code reality |
|---|---|
| A rejection "sends the project back to the agent" (docs/decisions.md:1974). The roadmap calls send-back undefined (docs/design/roadmap.md:172) | Locally it does. In deployed mode it goes to `Fail` (orchestration_stack.py:323-328) |
| An intake turn "holds at its station via the same `_has_open_gaps` path" (docs/architecture.md:287-291) | The function is now `_is_incomplete`. The deployed invoker never holds (src/orchestration/agent_invoker.py:219-235) |
| The SDK is what "the UI and CLI use" (AGENTS.md:50) | The UI uses `fetch` (README.md:158-159). There is no CLI |
| The SDK "does not carry credentials" (README.md:127; docs/architecture.md:134) | `api_token` exists (src/sdk/python/client.py:46-49) |
| "Review and Showroom have no external tools yet" (README.md:120-121) | Review has a GitHub allow-list (src/tools/github.py:86-118) |
| "Strands owns ... multi-agent patterns" (README.md:34) | No Graph, Swarm or agents-as-tools anywhere in `src/` |
| "The conversation lives in the browser" (ui/console/README.md:188-191) | `loadTurns` rebuilds the conversation from server records (useProjectsStore.ts:699-712) |
| Only local mode carries draft events (docs/decisions.md:1391-1393) | Deployed broadcasts them too (agent_invoker.py:77-95) |
| Every physical resource name is env-suffixed (docs/architecture.md:78) | Orchestration names are hard-coded (orchestration_stack.py:66, 74, 137, 161, 186, 229, 260, 288) |
| "Branch from `main`" (CONTRIBUTING.md:97); CI runs on `main` (.github/workflows/ci.yml:5) | `dev` is the trunk |
| Stale comments (agent_invoker.py:3-5; src/mcp_clients/bounded.py:8-12; useProjectsStore.ts:829-830) | Runtimes are deployed, agents are built per request, and no merge state exists |

**Where readers disagreed, resolved here:**
- **Decision-log size.** It has 116 `##` headings. The decisions reader also found 12 entries with no heading, for 127 in total. The log is out of date order in places, and docs/decisions.md:1944 cross-references an entry that does not exist.
- **Coding-agent handoff.** One reader called it "done (local)", another "partial". This brief uses partial: it works locally, and in deployed mode it depends on configuration the IaC does not set.
- **"G4".** That label was a reader error. There are three gates.

**Open questions for the owner:**
1. Are `GITHUB_PAT`, `ATLASSIAN_*` and `S3_BUCKET` set out-of-band on the deployed runtimes and the console Lambda? Has any deployed project gone past G2? (The IaC sets none of them. Setting `S3_BUCKET` alone would not make uploads work: the Lambda also needs an S3 grant, and the agents need read access to `projects/`.)
2. Should deployed mode match local mode: send-back loops, gap holds and multi-turn chat at every station, plus an explicit Showroom finish?
3. Is `coding_agent_harness_test` the intended build direction? Will Copilot remain the only builder, given licensing across UA orgs? *(Decided for the plan on 2026-10-26 in docs/decisions.md: in the Final MVP the coding agent runs on an AgentCore harness in the sandbox account, and Copilot's cloud agent is no longer a builder. `dev` still hands each delivery group to Copilot (src/tools/github.py:86-101) until that work lands.)*
4. Should G3 wait until builds settle and CI is green? Should brownfield merges need code-owner approval instead of a business sign-off?
5. Which tenancy unit applies (department, team or workspace), and should isolation be logical or physical?
6. What approval policy applies per gate (a named person, any member of a group, or all must sign), and does it come from Entra groups? Is "assignment required" enabled on the app?
7. Which identity model replaces the shared tokens: AgentCore Identity, Entra on-behalf-of, a GitHub App, or a service identity per department?
8. Should Simple mode collapse to one assistant voice, with documents named by what they contain, and the crew kept only in Detailed mode and the audit trail?
9. What is the primary deliverable for a business user: a hosted preview URL, a clickable mockup or a demo script? Where do previews run, and who tears them down?
10. Which M365 piece comes first: Teams notifications and approvals, Teams transcripts, or SharePoint?
11. Is the UA EDMA Request template the canonical FSD format? Who owns the golden-path template and a catalog of UA systems and data?
12. Will cost be charged back per department, with budgets? Will a pilot baseline be captured to prove "faster than today"?
13. What is the staffing plan? Commits show effectively one primary engineer.
