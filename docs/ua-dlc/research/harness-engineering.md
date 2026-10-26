<!-- Point-in-time research, retrieved 2026-10-26 for the UA-DLC plan (round 5: harness engineering). Claims carry source links; vendor features and dates change quickly, so verify before acting. Section numbers cited for platform-architecture.md, operating-model.md and enterprise-plan.md were checked against their 2026-10-25 revisions. See README.md in this folder. -->
<!-- cspell:words Amodei Cemaj Firecrawl Gabe Lopopolo LogQL Prithvi PromQL Rajasekaran Substack TraceQL Wiggum ablate ablation fxtwitter lints underspecified worktree xwhrrari -->

# Harness engineering: what it changes for HyperDelivery

> Stage numbers here predate the three-phase plan (2026-10-26): Stages 1 to 3 are now the Final MVP and its pilot; Stages 4 and 5 are Enterprise.

Research key: `harness-engineering`. Date: 2026-10-26. Prompted by an X article the owner shared,
then checked against the four primary sources it cites. Builds on
[factory-sources-round4.md](factory-sources-round4.md),
[anthropic-playbook.md](anthropic-playbook.md) and
[strands-box-orchestration.md](strands-box-orchestration.md), and compares every idea with
[platform-architecture.md](../platform-architecture.md),
[operating-model.md](../operating-model.md) and [enterprise-plan.md](../enterprise-plan.md). It
reports only what is new or sharpens a decision; section 1 lists what was filtered out because the
plan already has it.

## Bottom line

1. **By the article's own scale, the plan is already a top-level harness from Stage 1.** Its
   highest level adds permissions, traces, recovery and human gates on top of state, tests and a
   bounded loop, which is the do-no-harm floor plus the line. Nothing in the five sources argues
   for removing an approval. OpenAI's light merge gates are tied to a greenfield internal repo
   where corrections are cheap, and OpenAI says its setup should not be assumed to generalize.
2. **Step Functions is the harness's loop and history, so keep it.** Harness engineering splits
   the brain (model and loop), the hands (sandboxes and tools) and the history (an append-only
   record) so each can fail or be replaced alone
   ([Anthropic](https://www.anthropic.com/engineering/managed-agents)). In HyperDelivery, Step
   Functions and DynamoDB are the history and the controller across days, Strands is the brain
   inside one step, and the broker and sandboxes are the hands. Moving the line into LangGraph
   checkpoints would put the history back inside the agent's process, which is the coupling
   Anthropic removed. Add a crash-and-resume test instead (H1).
3. **The real gaps are at the feedback edges.** What a failed check tells the agent (H2), what the
   builder can sense while it works (H6), and what a run leaves behind, including a rollback point
   for a live app (H7).
4. **Every rule should exist twice: once as guidance, once as a check the agent cannot skip.** The
   golden path should ship its invariants as lints in each generated repository (H3), and every
   factory fix should land both ways (H8).
5. **Every harness component encodes an assumption about what the model cannot do, and those go
   stale.** Anthropic dropped context resets and then sprints as models improved. Each model change
   should trigger an ablation pass on the golden intakes (H9).
6. **Generated repositories need a map, not a manual.** A short `AGENTS.md` that points to the
   signed decisions and the data contract, in the repository from the first build rather than only
   at handoff (H4).

## 1. Already in the plan (filtered out)

These appear in the sources, but the plan already decides them, so no nugget is raised:

- **A contract before acting.** `BuildUnit` carries goal, acceptance tests, limits and lane; the
  sprint contract and failing tests the builder may not edit came from Anthropic's harness posts
  (platform-architecture.md section 2; [anthropic-playbook.md](anthropic-playbook.md) section 3).
- **Permissions enforced outside the model.** The floor, key and wall layers; signed gate tokens;
  no credential in the model or the sandbox; per-unit egress limits (platform-architecture.md
  sections 2, 3 and 9). Anthropic's Managed Agents reaches the same rule: tokens are never
  reachable from where generated code runs.
- **A bounded loop with escalation:** 2 CI rounds and 3 review rounds, then plain-language
  escalation (platform-architecture.md section 2).
- **A separate evaluator.** The builder never grades itself; reviewers start in shadow mode and earn
  their place (platform-architecture.md sections 2 and 9); untuned Claude is a lenient QA agent
  ([anthropic-playbook.md](anthropic-playbook.md) section 2).
- **State outside the context window.** Decisions and confirmed facts in DynamoDB, artifacts in S3,
  durable waits in Step Functions, specialists that start with no transcript
  (platform-architecture.md sections 2, 11 and 12).
- **Traces.** The OpenTelemetry GenAI contract, an `invoke_agent` span per delegation with retries
  and cost, and policy decisions carrying their rule id (platform-architecture.md section 8).
- **The smallest harness that closes the loop.** The depth dial and the tiers scale the evidence
  and the signers; "no speculative infrastructure" still holds (operating-model.md section 2;
  platform-architecture.md section 1).
- **Fixing the class of failure, not the output,** with fixed causes and owners from Stage 2, and
  instructions improved before a model is swapped (platform-architecture.md sections 9 and 14).
- **A durable session log separate from disposable sandboxes,** already filtered in round 4
  ([factory-sources-round4.md](factory-sources-round4.md) section 1). H1 below uses it only to
  sharpen the Step Functions question.

## 2. What the article says

[Source](https://x.com/0xwhrrari/status/2093685107534000560), read in full through the
[fxtwitter API](https://api.fxtwitter.com/0xwhrrari/status/2093685107534000560). "Harness
Engineering: How to Build AI Agents That Don't Fall Apart", an X article by the account
@0xwhrrari, posted Aug 29, 2026, with about 6.2 million views at retrieval. The author promotes a
Substack and a Telegram channel. It is a synthesis of OpenAI and Anthropic posts with no data of its
own, so it is alignment, not evidence.

**The argument.** When an agent keeps failing, people change the prompt, then the model, then the
context window. The article says the cause is usually the environment around the model, which it
calls the harness: what the model can see and touch, what survives between sessions, what counts as
evidence and when a run must stop.

**The seven jobs of a production harness:**

1. **Contract.** Turn the request into a bounded object (goal, inputs, output, constraints, done
   criteria) so the agent cannot quietly finish a different job.
2. **Context.** A small root guide that points to deeper, task-specific guides, loaded only when
   needed.
3. **Tools.** Each tool has a clear purpose, predictable output, an explicit failure state and a
   permission boundary.
4. **State.** Decisions, artifacts, failures and open risks stored outside the context window, so
   the next session inherits the work rather than a retelling of it.
5. **Sensors.** Tests, linters, screenshots, logs, metrics and schema validators, matched to the
   artifact: code, UI, research (source and contradiction checks) or data (schema, range and
   freshness).
6. **Policy.** The model proposes, a policy check decides, the tool executes. Do not let one
   probabilistic system plan, approve the risk and execute the side effect.
7. **Traces.** Every run leaves a readable trail: request, context, tool calls, state changes,
   verification, retries, cost, final artifact and rollback point.

**Further claims.** Encode important rules twice, as guidance and as a mechanical check. The loop
belongs to the harness: evidence, bounded retries, a budget and an escalation path. Classify each
failure and change the harness (a map, a tool description, a validator, a retry cap, a gate, durable
state or tracing). Keep the brain, the hands and the history separate. Give every run a compact
"change receipt" so model upgrades are comparable and regressions attributable. Start with the
smallest harness that can observe, verify and recover, on a four-level scale. It closes with a
12-question checklist (section 6).

**Attribution notes.** The line about finding the simplest solution and adding complexity only when
needed is credited to Anthropic's harness design post, but that post is quoting
[Building effective agents](https://www.anthropic.com/research/building-effective-agents)
(Dec 2024). The opening quote from Dario Amodei was not traced to a primary source.

## 3. What the primary sources add

### 3.1 OpenAI: "Harness engineering: leveraging Codex in an agent-first world" (Ryan Lopopolo, Feb 11, 2026)

[Source](https://openai.com/index/harness-engineering/). Re-read in full this round (round 4 cited
it through Firecrawl).

- Three engineers, later seven, drove Codex to about a million lines and roughly 1,500 merged pull
  requests in five months, about 3.5 per engineer per day, with no hand-written code. Early progress
  was slow because the environment was underspecified, not because the model was weak.
- **Map, not manual.** One big `AGENTS.md` failed: it crowds out the task, rots, and cannot be
  checked mechanically. Their advice is to "give Codex a map, not a 1,000-page instruction manual":
  an `AGENTS.md` of about 100 lines as a table of contents, with a versioned `docs/` tree (design
  docs, active and completed execution plans, a tech-debt tracker, a generated database schema,
  quality grades per domain). Linters and CI check that the docs are fresh and cross-linked.
- **What the agent cannot see does not exist.** Decisions made in chat threads, documents or
  people's heads must be written into the repository to count.
- **Legibility as sensors.** The app boots per git worktree so the agent can drive one instance per
  change through the Chrome DevTools Protocol. Each worktree gets an ephemeral logs, metrics and
  traces stack the agent queries with LogQL, PromQL and TraceQL, so criteria such as "startup under
  800 ms" become checkable.
- **Invariants, not implementations.** A fixed layer order per domain, enforced by custom linters
  and structural tests the agent wrote, plus "taste invariants" (structured logging, naming, file
  size). Because the linters are custom, their error messages carry remediation instructions
  written for the agent.
- **Garbage collection.** The team spent every Friday cleaning up agent output until it encoded
  "golden principles" and scheduled background runs that scan for drift, update quality grades and
  open small refactoring pull requests, most reviewable in under a minute. A doc-gardening agent
  opens fix-up pull requests for stale docs.
- **Low merge friction,** stated as right only at very high throughput: minimal blocking gates,
  flaky tests re-run, agents squash and merge their own pull requests.

### 3.2 Anthropic: "Effective harnesses for long-running agents" (Justin Young, Nov 26, 2025)

[Source](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents). The
feature list and progress file are already in [anthropic-playbook.md](anthropic-playbook.md). New
here:

- Two failure modes: trying to do everything at once and leaving a half-built, undocumented state,
  and a later session seeing progress and declaring the job done.
- Every session starts the same way: read the progress notes and the git log, pick one unfinished
  feature, start the app with `init.sh` and run a basic end-to-end check **before** new work, so a
  broken state is found before it is built on. Every session ends with a commit and a progress
  update.
- JSON for the feature list, because the model was less likely to rewrite it than Markdown.

### 3.3 Anthropic: "Harness design for long-running application development" (Prithvi Rajasekaran, Mar 24, 2026)

[Source](https://www.anthropic.com/engineering/harness-design-long-running-apps). The planner,
generator and evaluator, the sprint contract and evaluator leniency are already in
[anthropic-playbook.md](anthropic-playbook.md). New here:

- **Every harness component encodes an assumption about what the model cannot do alone,** and it
  goes stale as models improve. A radical cut lost quality and hid which parts were load-bearing, so
  the author removed **one component at a time**. With a newer model the sprint structure went and
  the evaluator moved to a single pass at the end.
- **The evaluator is not a fixed yes or no.** It pays only for work beyond what the current model
  does reliably alone. The full harness cost about 20x a solo run on an older model (6 hours,
  $200); the simplified one ran about 4 hours for $125.
- Calibrate the evaluator with few-shot examples and score breakdowns, and tune it by reading its
  logs where its judgment diverged from a person's. Each criterion has a hard threshold.
- Agents communicate through files; the criteria wording steers the generator as much as the
  evaluator.

### 3.4 Anthropic: "Scaling Managed Agents: decoupling the brain from the hands" (Lance Martin, Gabe Cemaj, Michael Cohen, Apr 8, 2026)

[Source](https://www.anthropic.com/engineering/managed-agents). Round 4 cited it through Firecrawl.
New here:

- A **session** (append-only log of everything that happened), a **harness** (the loop that calls
  the model and routes tool calls) and a **sandbox** (where code runs) are separate interfaces. A
  dead container is a tool error the model can retry; a dead harness reboots, reads the session log
  and resumes from the last event. Neither is a "pet" to nurse back.
- **The session is not the context window.** Compaction and trimming are irreversible guesses about
  what later turns need. The log stays durable and queryable by position, and the harness decides
  what to put into the context each turn.
- Tokens stay out of the sandbox: Git credentials are wired into the remote at sandbox start, and MCP
  calls go through a proxy that fetches credentials from a vault.
- Provisioning a sandbox only when a tool call needs it cut median time to first token by about 60%
  and p95 by over 90%.

## 4. Harness jobs against the plan

| Harness job | What HyperDelivery has | Gap | Recommendation | Stage |
|---|---|---|---|---|
| 1 Contract | `BuildUnit` with acceptance tests and limits; sprint contract; server computes station completeness | `DelegationRequest` for data and resource work has an objective and an output schema but no checkable done criteria, so the specialist reports its own `completed` | H10: add `done_when` to `DelegationRequest`; the broker computes the status from it, as the server already does for station artifacts | Stage 1 |
| 2 Context (map) | Context packs of cited excerpts; `hyperdelivery-builder` instructions with exact build and test commands; decision records reach the repository only in the Stage 4 handoff package | The coding agent cannot see DynamoDB, so signed decisions and the data contract are invisible to it until handoff; no size cap or freshness check on the repository's guide | H4: a map-sized `AGENTS.md` (size checked in CI) pointing to the signed plan, `/decisions` and a generated data contract, committed from the first build | Stage 1 |
| 3 Tools | Typed results, status and refusal shapes, a conformance suite, `policy_refusals` with rule id and description | Rejections say what failed, not how to fix it | H2: every rejection the platform owns carries a remediation line written for the agent | Stage 1 (broker), Stage 4 (Gateway policy) |
| 4 State | DynamoDB decisions and facts, S3 artifacts, Step Functions waits, AgentCore Memory summaries, turn records | Summaries are the only cheap way back to older turns; lane A retries and lane B sessions start cold | H1: keep the orchestrator stateless with a log reread tool and a crash test. H5: each build attempt starts with a smoke test and ends with a handoff note | Stage 1 (H1, H5 lane A), Stage 3 (H5 lane B) |
| 5 Sensors | Deterministic scans, tests, the evidence agent with Playwright, the Ops monitor with freshness, performance evidence at Thorough depth | The builder cannot see runtime signals while it works; previews are "per project" in platform-architecture.md but "per slice" in operating-model.md | H6: a preview per slice (branch), with its logs, latency and data freshness readable by the builder and the evidence agent, so NFRs become criteria with evidence | Stage 3; fix the doc mismatch now |
| 6 Policy | Floor, key and wall; signed gate tokens; Dogwood from Stage 4 | None | None; filtered (section 1) | n/a |
| 7 Traces | OTel spans, decision records with prompt, model and instructions versions, `BuildResult` cost and tests, `Assisted-by` trailers | No single receipt per run; no policy-set or golden-path version, no count of human corrections, no rollback point for a live app | H7: assemble a receipt per unit and per approval from existing records, add the four missing fields, and measure human corrections per accepted outcome | Stage 1 (fields), Stage 2 (measure), Stage 3 (rollback) |
| Rules twice | Golden path instructions versioned and bound to the decision | Rules live as instructions; the generated repository has scans but no golden-path lints | H3: the golden path ships its invariants as lints and structural tests in every generated repository | Stage 1 (data and secret rules), Stage 3 (Streamlit in Snowflake path) |
| Failure upgrades the system | Fixed causes and owners from Stage 2 | Causes cover context, tests, criteria, definitions and the model; none points at the harness itself | H8: add harness causes and require each fix to land as guidance plus a check | Stage 2 |
| Smallest harness | Depth dial, tiers, golden intakes rerun on model changes | Intakes check quality, never whether a component is still load-bearing | H9: an ablation pass on each model change; each component names the assumption it encodes | Stage 3 (on demand), Stage 4 (CI) |
| Garbage collection | Critical patches rebuilt within 7 days; a docs-drift test in HyperDelivery's own repo | No recurring sweep for drift in docs or live apps | H11: scheduled doc gardening on HyperDelivery's repo now; a golden-path drift sweep over live apps only at Scale | Stage 2 (own repo), Stage 5 (live apps) |

## 5. The recommendations

**H1. Keep Step Functions as the loop and the history; keep the orchestrator disposable (Stage 1).**
This answers the owner's question about where Step Functions is still needed. It holds each project
across days and parks it on a task token at every approval, resumes when someone signs, waits on long
delegations, retries and times out steps, restarts from a failed step through redrive, keeps the execution history,
and drives each sandbox's lifecycle (platform-architecture.md sections 2, 9 and 12). Strands does the
reasoning inside a step. The harness lens adds two checks rather than a new framework: a Stage 1
resilience test that kills the orchestrator mid-turn and shows the next turn resumes from the
project's record with no lost decision, and an orchestrator tool that rereads the project's turn and
decision log by position (for example, "everything since decision D-2") so an AgentCore Memory
summary is never the only way back to what someone said. Revisit LangGraph only on the triggers
already listed in platform-architecture.md ("Strands, not LangGraph, for now").

**H2. Rejections that teach (Stage 1, Stage 4).** OpenAI writes its lint messages to tell the agent
how to fix the problem. Give every rejection HyperDelivery owns a `remediation` line written for the
agent: the broker's grain and envelope checks ("return counts by country and HTS chapter, not
rows"), `touchpoint_drift`, the scope check, conformance failures and `policy_refusals`. The next
attempt inside the loop budget then repairs instead of guessing. Stage 4 applies the same field to
AgentCore Policy refusals.

**H3. Golden-path invariants as checks in the generated repository (Stage 1, Stage 3).** Each rule
stays in the `hyperdelivery-builder` instructions and also becomes a lint or structural test with a
remediation message: Snowflake access only through one data module that sets `QUERY_TAG` and the app
role; no credentials or connection strings in code; responses parsed into typed models at the
boundary; no query results written to disk or the repository. The data and secret rules back the
do-no-harm floor from Stage 1; the layer rules for the Streamlit in Snowflake golden path arrive with
it in Stage 3.

**H4. A map in every generated repository (Stage 1).** Each generated repository gets a short
`AGENTS.md` (a CI check caps it; OpenAI's is about 100 lines) beside the `hyperdelivery-builder`
instructions. It points to the signed Brief and plan, `/decisions` and a generated data contract
(objects, columns, grain and owners from `DataFindings`, never rows), all committed as files.
Signed decisions that bind a unit (for example, the FX rates source) are exported with their hash
from the first build, not first at the Stage 4 handoff, because a decision the coding agent cannot
read does not exist for it.

**H5. Start with a smoke test, end with a handoff note (Stage 1 lane A, Stage 3 lane B).** The plan
expects about one in three units to need a second pass, and lane A tasks stop at 59 minutes. Each
attempt runs the slice's existing end-to-end check before changing anything, and ends by writing a
short handoff note on the branch (what was done, what failed, what is next), so a retry or a resumed
lane B session continues rather than starts over. Lane B's session storage is wiped on runtime
updates, so the note and Git are the record.

**H6. Sensors for the builder (Stage 3; doc fix now).** Settle previews as one per slice (branch),
torn down at merge, as operating-model.md step 3.1 already says; platform-architecture.md section 9
says "per project". The evidence agent must verify the slice's own branch, and parallel units must
not share an instance. Expose that preview's logs and request latency, and for data apps Snowflake's
query history and source freshness by `QUERY_TAG`, read-only to the lane B builder and the evidence
agent. NFRs from Tech Design (the Tariff planner's "p95 under 3 s" and "refreshed by 06:00") then
become acceptance criteria with a sensor, not prose.

**H7. A receipt per unit and per approval (Stage 1, 2, 3).** Most of the fields already exist across
the decision record, `BuildResult`, spans and trailers; assemble them into one view on the approval
and in Layer 2, and add four: the policy-set and golden-path versions in force, the context sources
the unit received, the number of human corrections (point-and-say fixes, course corrections,
send-backs), and a rollback point. Report human corrections per accepted outcome beside cost. For
live T1 and Streamlit in Snowflake apps, the Deploy step records the previously signed SHA, and
"Roll back to the version signed on [date]" is an owner or platform action recorded like the kill
switch. Whether that needs a new signature is a decision to log.

**H8. Harness causes in the failure taxonomy (Stage 2).** Add to the fixed causes in
platform-architecture.md section 14: a tool or contract gap, a missing sensor, a policy gap (an
unsafe action attempted, even if blocked), lost state and an untraceable failure, each owned by the
platform team. "Model error" is assigned only when the trace shows the harness gave the model what
it needed. Every fix that is a rule lands twice: in the skill or instructions, and as a check (lint,
broker validation, Dogwood rule or golden case).

**H9. Ablation on each model change (Stage 3, Stage 4).** Extend round 4's registry of specialists,
skills, golden paths and connectors with the assumption each harness component encodes (unit size,
loop budgets, per-unit scope check, context pack size, each reviewer). When a model changes, run the
golden intakes with one component removed at a time and retire what no longer changes the result,
logged as a decision. Shadow mode runs the reverse test for new components.

**H10. Done criteria on every delegation (Stage 1).** `DelegationRequest` gains `done_when`, a list
of checkable conditions (for example, "every metric in the Brief is bound to a certified object or
listed in `gaps`"). The broker computes `completed` or `partial` from it, extending "completeness is
computed by the server, not taken from the agent" to specialists.

**H11. Recurring cleanup, sized to need (Stage 2, Stage 5).** Run the `sync-docs` skill as a weekly
doc-gardening job on HyperDelivery's own repository that opens fix-up pull requests; this repo has
already drifted once. A golden-path drift sweep over live apps waits for Scale, when enough apps live
long enough to drift; until then the 7-day patch rule covers it, and any such change still goes back
through the line.

## 6. The article's checklist against the plan

| Question | Plan today | Where |
|---|---|---|
| Success defined before execution | Yes | `BuildUnit` acceptance; Test Plan step 2.4 |
| Right knowledge without loading everything | Partly; H4 | Context packs; builder instructions |
| Every tool has a contract and failure state | Yes; H2 sharpens | Contracts and conformance suite |
| Execution isolated from production | Yes | Sandbox account, prototype organization |
| Decisions stored outside the conversation | Yes | Decision record in DynamoDB |
| Evidence for every risky transition | Yes | Evidence pack at each approval |
| Irreversible actions behind approval | Yes | Signed gate tokens |
| Every loop has a retry cap and budget | Yes | Loop budgets; broker budgets |
| Runs resume after interruption | Yes; H1 tests it | Task tokens, redrive |
| Every tool call and state change explainable | Yes | Spans, decision record, side-effect ledger |
| Failure updates a guide, test, tool or policy | Partly; H8 | Fixed causes from Stage 2 |
| The final artifact can be rolled back | No for live apps; H7 | Deploy step |

## 7. Not adopted

- **Minimal blocking merge gates and agents merging their own work** (OpenAI). The gates are the
  product, and OpenAI ties the practice to a greenfield internal repository. Per-unit pull requests
  already merge into the prototype repository on passing checks, with the human signature at
  approval 3.
- **Looping until every agent reviewer is satisfied** (OpenAI's version of the Ralph Wiggum loop).
  The plan's caps stay.
- **Context resets and sprint decomposition as fixed design** (Anthropic). Anthropic itself removed
  both as models improved; H9 is the mechanism for finding that out locally.
- **Hosting the orchestrator on Claude Managed Agents.** It runs on the Claude Platform, and the plan
  routes Claude through Bedrock; AgentCore Runtime plays the same role. Its interfaces are the
  lesson, not the product.

## 8. Could not access or verify

- The Dario Amodei quote in the article was not traced to a primary source.
- The article's view and like counts are from the fxtwitter API at retrieval and change over time.
- OpenAI's figures (lines of code, pull requests, the one-tenth time estimate) are self-reported, on
  one internal product.
- Anthropic's cost and duration figures come from single demonstration runs, not benchmarks.
- Publication dates for the three Anthropic posts come from each page's metadata.

## Sources

### The article

- @0xwhrrari, [Harness Engineering: How to Build AI Agents That Don't Fall Apart](https://x.com/0xwhrrari/status/2093685107534000560) (X article, Aug 29, 2026), via [fxtwitter](https://api.fxtwitter.com/0xwhrrari/status/2093685107534000560)

### Primary sources it cites, read in full

- OpenAI, [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/) (Ryan Lopopolo, Feb 11, 2026)
- Anthropic, [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) (Prithvi Rajasekaran, Mar 24, 2026)
- Anthropic, [Scaling Managed Agents: decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents) (Lance Martin, Gabe Cemaj, Michael Cohen, Apr 8, 2026); Claude, [Managed Agents launch post](https://x.com/claudeai/status/2041927687460024721) (Apr 8, 2026)
- Anthropic, [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) (Justin Young, Nov 26, 2025)

### Quoted inside those sources

- Anthropic, [Building effective agents](https://www.anthropic.com/research/building-effective-agents) (Dec 2024)

### Earlier rounds this builds on

- [factory-sources-round4.md](factory-sources-round4.md): the registry, "fix the factory", the scope
  check and review capacity
- [anthropic-playbook.md](anthropic-playbook.md): sprint contract, feature list, progress file,
  evaluator leniency
- [strands-box-orchestration.md](strands-box-orchestration.md): Strands against LangGraph, Step
  Functions waits, sandboxes
