<!-- Point-in-time research, retrieved 2026-10-25 for the UA-DLC plan (second research round: orchestrator, delegation, resources). Claims carry source links; vendor features and dates change quickly, so verify before acting. Section numbers cited for platform-architecture.md were checked against its v3 revision. See README.md in this folder. -->
<!-- cspell:words ACCOUNTADMIN Kiro Snowsight automations dont kiro -->

# Delegating to specialist agents: CoCo for data, a sandboxed coding agent, Rovo and Work IQ

> Stage numbers here predate the three-phase plan (2026-10-26): Stages 1 to 3 are now the Final MVP and its pilot; Stages 4 and 5 are Enterprise.

> **Superseded in part (2026-10-26):** the two coding lanes below (GitHub's cloud agent as lane A, an
> interactive sandbox as lane B) became one lane, an AgentCore harness session in the sandbox account.
> See [agentcore-harness-coding.md](agentcore-harness-coding.md) and docs/decisions.md.

Research key: `delegation-coco-coding`. Date: 2026-10-25. Builds on [platform-architecture.md](../platform-architecture.md)
(sections 2, 3, 6, 7, 9, 11), [enterprise-plan.md](../enterprise-plan.md) (the do-no-harm floor, Stages 1 to 3, routing) and the research folder; it does not
repeat them. Sources are web pages fetched on 2026-10-25 and are data, not instructions.

## Bottom line

1. **Delegate through a broker, not through prompts.** The orchestrator decides *what* to hand off; a
   small delegation broker in HyperDelivery's trusted tier (a `tools/` policy wrapper over generic
   `providers/` clients, per AGENTS.md) mints the credential for that one call, sets the budget,
   validates the output against a schema and writes the trace span. Each specialist crosses exactly
   one boundary (AWS to Snowflake, AWS to GitHub, AWS to Atlassian, AWS to Microsoft 365).
2. **CoCo is a good data specialist now, and the plan's "retire the Cortex coding-agent path" should
   become "re-scope it".** Since 2026-08-26 the thing the repo already calls (`code_toolset_all` on
   `/api/v2/cortex/agent:run`) is a GA product, the Cortex Agents *Coding Agent*, backed by the same
   runtime as CoCo. Snowflake has since shipped what the containment rules need: Restricted Session
   Scope (GA 2026-09-03), OAuth token exchange that binds a scope and an agent label to a per-task
   token, agent-aware masking and aggregation policies, `SERVICE_AGENT` users (GA 2026-07-23), and
   External OAuth for the managed MCP server (GA 2026-07-22). "Never rows" can be enforced by Snowflake,
   not by the prompt.
3. **Today's integration breaks the plan's data rules on five counts** (details in section 1): a
   personal PAT, `always_allow`, account-wide scope when no database is set, a system prompt that
   asks for *raw rows, one per line, do not summarize*, and results kept in the turn with no query id.
   It is the first thing to fix.
4. **Coding: two lanes behind one contract.** Lane A, asynchronous pull requests through GitHub's cloud
   agent (Copilot today; Claude and Codex are selectable third-party agents on the same surface) using
   the Agent tasks REST API. Lane B, an interactive session in an AgentCore Runtime microVM (the AgentCore
   managed harness is already prototyped on the unmerged `coding_agent_harness_test` branch; a Claude
   Agent SDK image is the upgrade path when hooks, budgets and schema-checked output are needed). The
   Blueprint unit of work is already the portable input; add acceptance tests and an evidence spec.
5. **Rovo and Work IQ are read-and-ask specialists, delegated as the user.** Both expose A2A with
   user-delegated OAuth only. Writes to Jira, Confluence and GitHub stay in HyperDelivery's own gated
   service tools.

## 1. What the repo does today

**Snowflake** (`src/tools/snowflake.py`, `src/providers/storage/snowflake.py`, decision 2026-08-29):
one tool, `snowflake_query(question)`, attached to Distill only. It POSTs to the Cortex Agents run
endpoint with `code_toolset_all`, `permission_policy: always_allow`, orchestration model
`claude-sonnet-5`, and streams `response.text` blocks back as one string. Problems against the plan:

| Issue | Where | Plan rule it breaks |
|---|---|---|
| Personal PAT in a plaintext env var | `config/settings.py:45-48`, `scripts/deploy_agent.sh` | Per-user and per-service identities (arch section 1, 3) |
| System prompt asks for "the raw data ... one row per line - do not summarize or omit rows" | `tools/snowflake.py:18-23` | Rows stay in Snowflake (arch section 7) |
| Unscoped when `SNOWFLAKE_DATABASE`/`SCHEMA` unset ("explores the whole account") | `tools/snowflake.py:1-7` | Data envelope (arch section 5) |
| `always_allow`, web search and every bundled skill available | `providers/storage/snowflake.py:82-86` | Deterministic controls first; no free-form SQL at T0/T1 |
| Results returned into the turn, no query id, no credits | `stream_agent` reads only `response.text` | Turn records store query id, not results |

Note: the Coding Agent's SQL tool is itself read-only (SELECT and SHOW, plus writes to stages), so
DML is less exposed than the 2026-08-29 decision feared, but reading anything the PAT's role can read
and printing it is exactly the risk.

**Coding**: Review dispatches GitHub Copilot through the remote GitHub MCP server
(`assign_copilot_to_issue`, `create_pull_request_with_copilot`) with a classic PAT, one pull request per
delivery group (`core.delivery.plan_delivery`), and the console polls builds. The G2 Blueprint is
already a portable build contract (decision 2026-09-04: files, API contracts, requirement links per
unit). The unmerged branch adds a second engine: an AgentCore *managed harness* session per project
where the API, not the model, clones, tests and pushes through `InvokeAgentRuntimeCommand`, so the
model never holds the GitHub token; it notes "the harness configuration has no hook field".

## 2. Snowflake CoCo as the data specialist

### Surfaces (status as of 2026-10-25)

| Surface | Status | What it is good for in HyperDelivery |
|---|---|---|
| CoCo in Snowsight, with Cloud Agents container | GA 2026-03-09; Cloud Agents GA, no extra charge "for now" | Human hand-off: a warm redirect for single-source apps (enterprise-plan routing table) |
| CoCo Desktop | GA 2026-07-21 | Engineers at handoff |
| CoCo CLI: `cortex -p ... --output-format stream-json`, `cortex exec`, `--cloud`, `--with-restricted-session-scope`, `--sql-read-only`, `--allowed-tools`/`--disallowed-tools`, `--max-turns`, `--private` | CLI GA 2026-02-02; cloud sandbox GA | Headless in a container we host (AgentCore session) if we need local files or MCP |
| CoCo automations | Preview 2026-08-21 | Not needed |
| **Cortex Agents Coding Agent** (`code_toolset_all` on `POST /api/v2/cortex/agent:run` or `SNOWFLAKE.CORTEX.AGENT_RUN`) | **GA 2026-08-26** | **Primary delegation surface**: Snowflake runs the sandbox, no CLI to host |
| Cortex Agent SDK (Python/TypeScript): `conversations`, background runs, managed coding agent (`agent: {type: "coding"}`) or a local CLI interface | Public preview 2026-10-13 (replaces the older Cortex Code Agent SDK, which will not be developed further) | A typed client for the same REST calls; optional |
| Snowflake-managed MCP server (`CORTEX_AGENT_RUN`, `CORTEX_ANALYST_MESSAGE`, `CORTEX_SEARCH_SERVICE_QUERY`, `SYSTEM_EXECUTE_SQL`, `GENERIC`) | GA; External OAuth binding GA 2026-07-22 | Fits the plan's "every tool is a Gateway target" (arch section 4) for named agents |
| A2A | No evidence found in docs or release notes | n/a |

Sources: [CoCo overview](https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code),
[CLI reference](https://docs.snowflake.com/en/user-guide/cortex-code/cli-reference),
[cloud sandbox](https://docs.snowflake.com/en/user-guide/cortex-code/cloud-sandbox),
[Coding Agent](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-coding-agent),
[Cortex Agent SDK](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agent-sdk/cortex-agent-sdk),
[managed MCP server](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-mcp),
[2026 release notes](https://docs.snowflake.com/en/release-notes/new-features-2026).

### Authentication

- REST and SDK accept PATs, OAuth access tokens (Snowflake OAuth or External OAuth), key-pair JWTs and
  session tokens. The CLI uses `~/.snowflake/connections.toml` (browser SSO or PAT).
- **OAuth token exchange for agent delegation** is the right primitive. The trusted tier sends the
  user's credential (External OAuth access token, PAT or workload identity) to `/oauth/token` with
  `scope=session:role:<ROLE>`, `authorization_details=[{"type":"snowflake-rss.v1","rss":"<scope>"}]` and
  `act={"sub":"<agent id>","type":"agent"}`. The issued token runs as the user, inside the scope, is
  labeled `EXTERNAL_AGENT` in `QUERY_HISTORY` and `ACCESS_HISTORY.agents_info`, lasts one hour, has no
  refresh token and cannot be re-exchanged. Snowflake does not authenticate the client calling the
  exchange, so the subject token must never reach the agent
  ([docs](https://docs.snowflake.com/en/user-guide/oauth-token-exchange)). The page carries no preview
  label; I found no release note for it, so confirm status with the account team.
- **Agent activation matters.** Admin-managed scopes and agent-aware policies apply only when
  `IS_AGENT_ACTIVATED` is true: Cortex Agents and CoCo (including lite agents over REST), the managed
  MCP server, an OAuth integration with `IS_AGENTIC = TRUE`, token exchange with `act` type agent, or a
  `SERVICE_AGENT` user. Plain PAT or key-pair SQL from our own code is *not* agentic
  ([IS_AGENT_ACTIVATED](https://docs.snowflake.com/en/sql-reference/functions/is_agent_activated),
  [agent identity](https://docs.snowflake.com/en/user-guide/agent-identity)).
- Fit with the plan: keep the HyperDelivery Entra External OAuth client (arch section 6), add
  `IS_AGENTIC = TRUE`, and exchange per delegation. Use a `SERVICE_AGENT` user only for unattended work
  with no human principal.

### Constraining it

| Control | Mechanism | Strength |
|---|---|---|
| Role | `session:role:<workspace role>` in the exchange; `EXTERNAL_OAUTH_ALLOWED_ROLES_LIST`; secondary roles off | Hard |
| Privilege ceiling | Restricted Session Scope: predefined `SNOWFLAKE$DATA_READ`, `SNOWFLAKE$DATA_READ_WITH_AI`, or custom YAML (data read on envelope databases or schemas, object discovery, write only to the sandbox schema, blocked roles). Token-bound per call; admin-managed via session policy as a backstop; intersection applies ([RSS](https://docs.snowflake.com/en/user-guide/restricted-session-scope)) | Hard, but does not limit *how much* is read or stop results being sent elsewhere |
| Grain | Secure views at the envelope's grain, plus an **aggregation policy** whose body returns `AGGREGATION_CONSTRAINT(MIN_GROUP_SIZE => n)` when `IS_AGENT_ACTIVATED` is true ([aggregation policies](https://docs.snowflake.com/en/user-guide/aggregation-policies); Enterprise Edition) | Hard: Snowflake refuses row-level queries from agents |
| Sensitive columns | Masking or projection policies keyed on `IS_AGENT_ACTIVATED` | Hard |
| Compute | Per-workspace warehouse (arch section 13), `STATEMENT_TIMEOUT_IN_SECONDS`, `execution_environment.query_timeout` on agent tools | Hard |
| Agent run | `orchestration.budget {seconds, tokens}`; 15-minute synchronous limit, 6-hour background runs with threads | Hard |
| Spend | Resource budgets for Cortex Agents (can revoke access at a limit), Snowflake Budgets, per-user CoCo quotas | Periodic |
| Tool approvals | `permission_policy: always_ask` emits `tool_use` with `permission.options`; resume with a `permission_decision` block | Hard, if the broker answers |
| Capabilities | `disabled_skills` (for example `dashboard`, `streamlit` when not building); web search is an account-level ACCOUNTADMIN switch shared with Cortex Agents and CoWork; `COCO_CLOUD_AGENTS_NON_SNOWFLAKE_EGRESS_DISABLED` blocks sandbox egress (coverage of REST sandboxes unconfirmed) | Medium |
| Instructions | `instructions.system/response/orchestration` | Weakest; advisory |

Caveat: CLI `--cloud` refuses `--sql-read-only` and RSS because they cannot be enforced server-side;
the token-bound RSS on the REST path has no such gap.

### What it returns

Over REST: SSE events `response.thinking`, `response.tool_use` (including generated SQL),
`response.tool_result` (with `query_id`, `resultSetMetaData` and the result set), `response.table`,
`response.chart`, `response.text`, `response.status` and a `metadata` event with `run_id`, thread ids
and token usage per model ([Run API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-run)).
With a mounted workspace it can leave files: SQL, Python, notebooks (`.ipynb`), Streamlit apps, dbt
projects. The SDK supports JSON-schema structured output. Traces land in
`SNOWFLAKE.LOCAL.AI_OBSERVABILITY_EVENTS`; credits in `SNOWFLAKE_COCO_USAGE_HISTORY` and
`CORTEX_AGENT_USAGE_HISTORY` ([observability](https://docs.snowflake.com/en/user-guide/cortex-code/observability)).
The broker should parse `tool_use`/`tool_result` for SQL and query ids and drop result sets.

### Cost and limits

- Billed per token at the Service Consumption Table rate per model (I could not read the PDF; a
  third-party guide reports up to about 12 credits per million tokens for Opus-class models), plus
  warehouse compute. Warehouse resource monitors do not cover CoCo; use budgets and quotas.
- Latency: the repo measured about 117 seconds for a single-table listing (decision 2026-08-29), so
  delegations must be asynchronous (Step Functions task token or background runs).
- Managed MCP: 50 tools per server, 250 KB response truncation, recursion depth 10.
- CoCo requires cross-region inference to be enabled. Check this against the plan's EMEA
  processing rule before any EMEA workspace.
- Models: Claude Opus 5, Sonnet 5, OpenAI GPT 5.x and `auto`; no Sonnet 5.5 (repo decision 2026-09-30).

### Alternatives and when to use each

| Job | Best Snowflake surface |
|---|---|
| Answer a business question from certified data | **Named Cortex Agent** over the envelope's semantic views and Cortex Search. Snowflake now recommends Cortex Agents over standalone Cortex Analyst (2026-08-28). Expose it through the managed MCP server behind the AgentCore Gateway |
| Discover objects, profile columns, check a named table exists, draft SQL | **Coding Agent** (`code_toolset_all`) with token-bound RSS, `always_ask` answered by the broker, envelope views only. The bundled `certified-data-product-discovery` and `recommend-object` skills match UA's golden-report pattern |
| Build a Streamlit in Snowflake app | Coding Agent with a mounted workspace (below) |
| Anything a human analyst can do alone | Route to CoCo or CoWork directly (existing routing table) |
| Raw SQL execution (`SYSTEM_EXECUTE_SQL`) | Avoid; Snowflake itself advises keeping it off an agent's server |

### The data delegation contract

```yaml
DataTask:                      # what the orchestrator sends to the broker
  task_id, project_id, station, decision_id     # also go to QUERY_TAG and act.sub
  kind: discover | profile | answer | validate_metric | build_sis_app
  question: str                # plain language
  envelope:                    # resolved by the broker from the workspace record, never from the model
    envelope_id, tier: T0|T1|T2, classification
    allowed_objects: [db.schema.view, semantic_view, search_service]
    grain: {dimensions: [...], time: week}      # finest grain allowed in outputs
    min_group_size: 5
    rss: GOVERNANCE.SCOPES.<WORKSPACE>_AGENT    # or SNOWFLAKE$DATA_READ_WITH_AI
    role: HD_<WORKSPACE>_READ
  budget: {seconds: 600, tokens: 200000, credits: 2.0, statement_timeout_s: 120, warehouse: HD_<WS>_XS}
  output_schema: DataFindings  # enforced via structured output and re-validated by the broker
DataFindings:                  # what comes back; never rows
  status: ok | partial | refused | over_budget | error
  objects: [{name, kind, certified: bool, owner, columns: [{name, type, null_rate?}], row_count}]
  aggregates: [{metric, grain, groups: n, suppressed_groups: n, values_ref}]  # values only at or above grain
  sql: [{purpose, text, query_id}]
  gaps: [str]                  # "PROMO_TIER does not exist"; conflicts with certified definitions
  cost: {credits, tokens_in, tokens_out, duration_s, warehouse_seconds}
  trace: {run_id, thread_id, request_ids: [...]}
```

Broker rules: subject token stays in the broker; one exchange per task with `act.sub =
hyperdelivery/<project>/<station>/<task>`; reject any output column or object not in the envelope and
any group below `min_group_size`; store query ids, SQL and aggregates, never result sets; span
attributes record objects, query ids, role, warehouse, row counts, bytes and duration (arch section 7).
Tier mapping: T0 metadata and synthetic data only (RSS allows object discovery on the synthetic
database); T1 secure views with aggregation policies; T2 data-owner grants.

### Delegating a Streamlit in Snowflake build

1. Blueprint marks the unit `runtime: sis`. The broker ensures a project Snowflake Workspace in the
   project sandbox schema, connected to the prototype-org Git repository (Streamlit in Workspaces is
   GA 2026-06-01).
2. One Coding Agent run with `workspace_mounts` for that workspace, the bundled
   `developing-with-streamlit` skill, a UA golden-path skill attached from a stage, and an RSS that allows
   data read on envelope views and object management only in the sandbox schema. The role is the
   project build role, not the app role. `always_ask` for writes, answered by policy in the broker.
3. Output: a commit in the workspace (or a diff the broker commits), the app manifest, SQL with query
   ids, and tests. The agent does not deploy.
4. After the human approves, CI deploys with the Snowflake CLI under the deploy user into the apps
   database, owned by a functional app role, with **restricted caller's rights** (GA 2026-06-01, which
   settles the plan's "to confirm with the account team" item).
5. The evidence agent, not the builder, opens the app as a test viewer and records screenshots.
   For richer UIs, Snowflake App Runtime (Next.js, GA 2026-09-01, `snow app deploy`) is a second
   in-Snowflake golden path to evaluate.

## 3. The coding specialist

| Option | Dispatch | Sandbox and limits | Evidence | Identity and cost | Fit |
|---|---|---|---|---|---|
| **GitHub Copilot cloud agent** (in use) | Agent tasks REST API `POST /agents/repos/{o}/{r}/tasks` (public preview since 2026-05-13; returns `state`, `artifacts` of type pull or branch, sessions with `usage` in AI credits) or issue assignment with `custom_agent`, `custom_instructions`, `model` | Ephemeral Actions runner, firewall on by default, 59-minute cap, one repo and one PR per task; self-hosted only on ephemeral Ubuntu x64 or Windows runners with the firewall off | Automatic CodeQL, secret scanning, advisory database and Copilot code review before review is requested; Playwright screenshots in PRs; session logs | **User-to-server tokens only; GitHub App installation tokens are not supported**; Actions minutes plus AI credits | Lane A default |
| **Claude or Codex as GitHub third-party agents** | Same surfaces (issues, Agents tab, `@` mentions) | Same protections as Copilot | Same security validation | Copilot subscription; public preview | Swap-in for Lane A |
| **Claude Agent SDK / Claude Code headless in AgentCore Runtime** | `claude --bare -p` with `--output-format json`, `--json-schema`, `--max-budget-usd`, `--permission-mode dontAsk`, `--permission-prompts none`, `--allowedTools`, hooks; Bedrock via `CLAUDE_CODE_USE_BEDROCK` | Firecracker microVM per session, up to 8 hours, session storage at `/mnt/workspace` (preview, 14 days), VPC mode, AgentCore Identity vault keeps tokens out | Whatever we run: Playwright traces and video | Bedrock tokens plus AgentCore CPU and memory | Lane B upgrade |
| **AgentCore managed harness** | `InvokeHarness` plus `InvokeAgentRuntimeCommand` | Same microVM; preview since 2026-04-22; no hook field | Ours | No extra harness charge | Lane B now (prototyped) |
| **Strands Box** | `box run` | Developer preview 2026-10-07, stable only on macOS (Seatbelt), Linux ARM64 experimental; AgentCore packaging is a roadmap item | n/a | Open source | Watch; Dogwood temporal policies are attractive later |
| Claude Code self-hosted environments | claude.ai cloud sessions routed to our runners | Public beta; session content still goes to `api.anthropic.com` | Ours | Claude Code plan | Not for UA data |
| OpenAI Codex cloud | ChatGPT, `@codex` on GitLab and GitHub, Slack; no documented public API to start cloud tasks found | Reusable environments (DevDay 2026) | Security findings evidence | ChatGPT Enterprise; Codex CLI/SDK can use Amazon Bedrock since July 2026 | Only via GitHub third-party agent |
| Factory `droid exec` | CLI in CI; `--auto low/medium/high`, JSON output | Our runner | `/demo` recordings in Factory's product | `FACTORY_API_KEY`; UA appears on Factory's customer logos | Possible Lane B engine if UA already licenses it |
| Kiro autonomous agent | GitHub `kiro` label or `/kiro` | Sandbox per task; preview, us-east-1, 90-day session retention | PR descriptions | Kiro Pro and above | Not yet |

Sources: [Copilot agent tasks API](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-via-the-api),
[REST reference](https://docs.github.com/en/rest/agent-tasks/agent-tasks),
[cloud agent limits](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent),
[environment and runners](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/customize-the-agent-environment),
[third-party agents](https://docs.github.com/en/copilot/concepts/agents/about-third-party-agents),
[validation tools](https://github.blog/changelog/2026-04-10-copilot-cloud-agents-validation-tools-are-now-20-faster),
[Claude Code headless](https://code.claude.com/docs/en/headless),
[hosting coding agents on AgentCore](https://aws.amazon.com/blogs/machine-learning/its-safe-to-close-your-laptop-now-hosting-coding-agents-on-amazon-bedrock-agentcore/),
[AgentCore managed harness](https://aws.amazon.com/about-aws/whats-new/2026/04/agentcore-new-features-to-build-agents-faster/),
[Strands Box](https://aws.amazon.com/blogs/opensource/introducing-strands-box-ai-agent-sandboxes-powered-by-dogwood/),
[self-hosted environments](https://code.claude.com/docs/en/self-hosted-environments.md),
[Codex docs](https://learn.chatgpt.com/docs/codex-manual.md),
[droid exec](https://docs.factory.com/cli/droid-exec/overview),
[Kiro autonomous agent](https://kiro.dev/docs/autonomous-agent/).

**Recommendation.** Lane A for autopilot builds: switch Review from the MCP hand-off to the Agent
tasks API, because it returns task state, branch and PR artifacts and per-session credit usage that the
trace and cost views need, and keep the MCP tools as a fallback. Define a `hyperdelivery-builder` custom
agent in each generated repository so the contract travels with the repo. Lane B for interactive builds,
Streamlit-adjacent web apps and anything needing a preview while the person watches: merge the harness
branch, then move to a Claude Agent SDK image on AgentCore Runtime when per-tool hooks, a hard dollar cap
and schema-checked results are needed. The builder and the evidence agent stay separate agents.

### The build delegation contract

```yaml
BuildUnit:
  unit_id, blueprint_version_hash, project_id, decision_id
  repo: {org: ua-prototypes, name, base_ref, branch: hyperdelivery/<project>/<group>}
  goal: str                               # from the unit description
  files: [{path, change, purpose}]        # existing FileTouchpoint
  api_contracts: [...]                    # existing ApiContract
  acceptance: [{ac_id, given, when, then, test_id}]
  tests_in: [path]                        # acceptance tests written first by HyperDelivery or required first
  golden_path: id                         # template, stack, UA look
  data: {mode: synthetic_fixtures, schema_ref}   # no credentials, ever
  limits: {wall_clock_min: 55, ci_rounds: 2, credits: n, egress: allowlist_id}
  evidence: {screens_per_ac: true, recording: short, viewer: test_user}
  lane: async_pr | interactive
BuildResult:
  status: done | needs_input | failed | timed_out | over_budget
  pr: {url, number, head_sha} | branch
  touchpoint_drift: {undeclared_files: [...], untouched_declared: [...]}
  tests: {junit_ref, passed, failed, skipped}
  ac_coverage: [{ac_id, test_id, result}]
  security: {codeql, secrets, dependencies}   # from GitHub validation or our required workflows
  evidence: [{ac_id, screenshot_ref, recording_ref}]   # project evidence store, KMS, not the repo
  cost: {ai_credits | tokens, usd_estimate, actions_minutes}
  logs_url, questions: [...], error
```

The broker computes `touchpoint_drift` and `ac_coverage` itself from the diff and test reports, which
closes the gap decision 2026-09-04 left open ("nothing yet diffs the delivered change against the
declared touchpoints").

## 4. Rovo and Microsoft 365 (brief)

- **Rovo A2A**: `https://a2a.atlassian.com/v1/rovo`, A2A protocol 0.3.0, OAuth 2.0 with PKCE through
  dynamic client registration only (no service accounts or manual clients), synchronous calls cut at
  about 30 seconds so use `message/stream`, actions respect the signed-in user's permissions and can
  create work items and pages; organization-level enablement required
  ([Rovo A2A](https://developer.atlassian.com/cloud/rovo-a2a/)). Use it as a read and ask specialist
  ("which teams own the promo tier tickets?", Teamwork Graph context). Credit cost is not stated on the
  page. Writes after approval 2 stay on the Rovo MCP server with a service account (arch section 11).
- **Work IQ A2A**: `https://workiq.svc.cloud.microsoft/a2a/`, A2A 1.0 (send the `A2A-Version: 1.0`
  header), Entra delegated token with scope `WorkIQAgent.Ask`, reachable through AgentCore Identity
  on-behalf-of; usage-based billing independent of Microsoft 365 Copilot licenses; launched in preview in
  April with GA announced for 2026-06-16 ([Work IQ A2A](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/work-iq/a2a/overview),
  [dev blog](https://devblogs.microsoft.com/microsoft365dev/work-iq-production-ready-intelligence-for-every-agent/)).
  Use it to answer "what did we decide about X" across the user's mail, chats and files, with citations,
  when a user points at a resource. It does not replace transcript ingestion.
- **Copilot Studio agents** behind Direct Line are not a supported external call path (community answer);
  call Work IQ instead.

## 5. Recommended roster

| Specialist | Engine | Boundary crossed | Credential carried | In | Out |
|---|---|---|---|---|---|
| Orchestrator (the one assistant) | Strands on AgentCore Runtime | none | none; asks the broker | user turns, project memory | plan, delegations, decisions |
| Data analyst | Named Cortex Agent via managed MCP behind Gateway | AWS to Snowflake | exchanged user token, RSS, `act` | DataTask (`answer`, `validate_metric`) | DataFindings |
| Data explorer | Cortex Agents Coding Agent (CoCo runtime) | AWS to Snowflake | same | DataTask (`discover`, `profile`) | DataFindings |
| Streamlit builder | Coding Agent with mounted workspace | Snowflake workspace, sandbox schema writes only | same, build role | BuildUnit with `runtime: sis` | commit, manifest, SQL ids |
| Code builder, async | GitHub cloud agent (Copilot, Claude or Codex) | AWS to GitHub prototype org | Copilot-seated service user's user-to-server token, unlocked by a signed gate | BuildUnit | BuildResult |
| Code builder, interactive | AgentCore session (managed harness, later Claude Agent SDK) | sandbox AWS account microVM | none in the model; API runs git | BuildUnit | BuildResult |
| Evidence agent | Playwright in the preview environment | preview, as a test viewer | test identity | acceptance list | screenshots, recording, AC results |
| Atlassian context | Rovo A2A (reads), Rovo MCP (gated writes) | AWS to Atlassian | user OAuth | question | cited answer |
| Microsoft 365 context | Work IQ A2A | AWS to Microsoft 365 | Entra OBO | question | cited answer |

Writes with side effects (repositories, pushes, Jira and Confluence writes, coding-agent assignment)
remain service tools behind the signed-gate hook, never a specialist's discretion.

## 6. Phasing under the owner's direction

As the plan adopted it ([platform-architecture.md](../platform-architecture.md#what-lands-in-which-phase)):

- **Stage 1 Working version (W1 to W8):** rewrite the Snowflake system prompt to "never return rows;
  return schema, counts and aggregates at the stated grain"; require database and schema; parse
  `tool_use` and `tool_result` for SQL and query ids; stop storing result text. Exchange the PAT for a
  delegated token with `SNOWFLAKE$DATA_READ_WITH_AI` (or a custom scope) and `act` type agent in the
  tool code, so the model never sees the PAT. Add `orchestration.budget`. The broker and the
  DataFindings schema. Move Review to the Agent tasks API (coding lane A). Trace spans per delegation
  with vendor logos, handoff connectors and failed or retry markers mapped from task states.
- **Stage 2 Tester loop (W7 to W14):** the same, measured with testers, plus touchpoint drift and
  criteria coverage computed by the broker.
- **Stage 3 MVP (W15 to W24):** coding lane B (harness branch merged), Streamlit builder, evidence
  agent, Rovo and Work IQ read specialists, named Cortex Agent per workspace behind the managed MCP
  server.
- **Stage 4 Enterprise hardening (W19 to W32):** Entra External OAuth with `IS_AGENTIC = TRUE`, one
  role per workspace, aggregation policies on envelope views, AgentCore Policy on every Gateway tool
  call, admin-managed RSS session policies as a backstop, resource budgets, SIEM forwarding of
  `ACCESS_HISTORY.agents_info` joined on `QUERY_TAG`.

## 7. Could not verify

- CoCo per-model credit rates (Service Consumption Table PDF not read).
- Release status of Snowflake OAuth token exchange.
- Whether a managed MCP `CORTEX_AGENT_RUN` tool can front an agent with `code_toolset_all`, and how
  `always_ask` behaves through MCP.
- Whether `COCO_CLOUD_AGENTS_NON_SNOWFLAKE_EGRESS_DISABLED` covers REST Coding Agent sandboxes, and
  whether web search can be disabled per request.
- GA date for GitHub's Agent tasks API and any plan to accept GitHub App installation tokens.
- A public API to start Codex cloud tasks.
- Work IQ A2A GA confirmation and Rovo A2A credit consumption.
- UA's Snowflake edition (aggregation policies need Enterprise Edition) and whether cross-region
  inference, which CoCo requires, is acceptable for EMEA data.
