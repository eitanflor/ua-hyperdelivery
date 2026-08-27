# Architecture & Tradeoff Decisions

Append-only log. One entry per decision, most recent first. Entries below dated 2026-08-26
were backfilled during that session from earlier work in the repo history - the date marks
when they were logged, not necessarily when the underlying change originally landed.

Template for new entries:

```markdown
## YYYY-MM-DD - <short title>
- **Status**: Accepted | Superseded by <link>
- **Context**: what problem/constraint forced a choice
- **Decision**: what was chosen
- **Alternatives considered**: what else was on the table, and why they lost
- **Consequences**: what this makes easier/harder, what to revisit and when
```

---

## 2026-08-27 - One executable gate (`scripts/precheck.sh`) shared by developers and CI

- **Status**: Accepted
- **Context**: CI ran `ruff check` and `pytest` as separate workflow steps, and never ran
  the `infra/` tests at all. Anything added to CI would have to be remembered separately by
  every developer, and the two definitions of "green" would drift.
- **Decision**: `scripts/precheck.sh` is the only definition of green: format, lint, types,
  tests, infra, secrets, printing a PASS/FAIL table and exiting non-zero on any failure.
  `make check` runs it and CI runs the same script with `--ci`. `--fix` applies the
  mechanical fixes first.
- **Alternatives considered**: Keeping discrete CI steps for a nicer GitHub UI - rejected
  because per-step annotations are worth less than the guarantee that local and CI agree.
  Making pre-commit the gate - rejected because type checking and the full test suite are
  too slow for a commit hook; pre-commit stays for fast mechanical checks only.
- **Consequences**: Adding a check means editing one file and it applies everywhere. CI
  output is a single job, so a failure needs the log read rather than the summary. Revisit
  if the suite gets slow enough to want parallel CI jobs.

## 2026-08-27 - Aggressive ruff plus pyright strict, with relaxations named at source

- **Status**: Accepted
- **Context**: Setting the engineering bar for a repo that will be largely written by
  coding agents. Lint was five rule families with no formatter enforcement and no type
  checker, so "good code" was a matter of reviewer attention.
- **Decision**: Ruff's full practical rule set including `D` (docstrings) and `ANN`
  (annotations), `ruff format` enforced, and pyright in strict mode. Where a third-party
  library's own typing is the blocker, the relaxation is a documented setting in
  `pyproject.toml` naming the upstream cause, rather than scattered `# type: ignore`.
  Three such causes are recorded: bedrock-agentcore types `.run`/`.entrypoint` loosely,
  strands' `@tool` declares an unparameterized `dict`, and boto3-stubs emits an overload per
  AWS service of which only the installed extras resolve. `infra/` additionally downgrades
  `reportArgumentType` because aws-cdk-lib's jsii stubs are self-inconsistent - its concrete
  `Function` does not satisfy its own `IFunction` protocol.
- **Alternatives considered**: A moderate rule set without `D`/`ANN` - rejected because
  docstrings are how an agent learns the codebase's intent, so they need to be enforced, not
  encouraged. mypy instead of pyright - pyright matches what Pylance already runs in the
  editor, so developers see the same errors as CI. `flake8-type-checking` (`TC`) - rejected
  outright: pydantic, FastAPI and strands all resolve annotations at runtime, so hoisting
  imports into `TYPE_CHECKING` blocks would break schema generation in ways tests would not
  reliably catch. Typing-only imports are placed in such blocks by hand instead.
- **Consequences**: New code has a high, machine-checked floor. The relaxations are visible
  in one file and can be removed as upstreams improve, rather than being invisible debt.

## 2026-08-27 - Documentation review is a build step, not a convention

- **Status**: Accepted
- **Context**: The README claimed the repo had "no control plane (Step Functions, gate
  manager)" long after Step Functions, the console API and the SDK had all shipped, and
  `.env.example` was missing four `Settings` fields. Asking people to remember had already
  failed once.
- **Decision**: Three layers. `tests/unit/test_docs_consistency.py` fails the build when
  `.env.example` drifts from `Settings`, or when an agent lacks a config file or a runtime
  entrypoint. The Definition of Done in `AGENTS.md` makes the review an explicit final step
  with a checklist of surfaces. The `sync-docs` skill executes that checklist for an agent.
- **Alternatives considered**: Generating `.env.example` from `Settings` - rejected because
  the prose explaining *when* each variable is needed is the valuable part and cannot be
  generated. A PR-template checkbox - rejected as unenforceable; a checkbox is ticked, a
  test is not.
- **Consequences**: The mechanical half of doc drift is now impossible to merge. The
  judgment half (is the README Status section still true?) still depends on the reviewer,
  but it is at least on a list. Extend the consistency test whenever a new mechanical
  invariant appears.

## 2026-08-27 - `AGENTS.md` as the single source of truth for AI tool instructions

- **Status**: Accepted
- **Context**: The team uses the GitHub Copilot coding agent, and may add other tools. Each
  tool wants its own instruction file, which invites four copies of the same conventions
  drifting apart.
- **Decision**: `AGENTS.md` at the root holds all conventions. `.github/copilot-instructions.md`
  is a thin pointer plus Copilot-specific workflow notes. `.github/instructions/*.instructions.md`
  add only path-scoped rules via `applyTo` frontmatter, and link back rather than restating.
- **Alternatives considered**: Copilot-instructions as the source of truth - rejected
  because it is tool-specific and invisible to humans reading the repo. Symlinking
  `CLAUDE.md`/`AGENTS.md` - deferred until a second tool is actually in use.
- **Consequences**: One file to update. Adding a tool means adding a pointer file, not
  duplicating conventions.

## 2026-08-27 - Flat `src/` layout retained rather than an installable package

- **Status**: Accepted
- **Context**: `src/` holds flat top-level packages (`config`, `core`, `tools`, ...) that
  only import via pytest's `pythonpath`, with `[tool.uv] package = false`. Package names
  like `config` and `tools` could collide with PyPI distributions, `py.typed` cannot apply,
  and `ui/` cannot import from `src/` because `streamlit run` does not extend `sys.path`.
- **Decision**: Keep the flat layout for now. Document the convention and its consequences
  in `AGENTS.md` rather than adding a `py.typed` marker that would do nothing while nothing
  is distributed.
- **Alternatives considered**: Refactoring to `src/hyperdelivery/` as a real distribution -
  correct long-term, but it touches every import, the Dockerfile and the CDK handler paths,
  and was judged too large to combine with the standards work.
- **Consequences**: The Streamlit harness duplicates a small amount of agent config, and
  Lambda dependency bundling (TODO ADVA-3015) stays awkward. Revisit when that bundling is
  tackled - the two changes belong together.

## 2026-08-27 - Coverage reported with a deliberately low floor

- **Status**: Accepted
- **Context**: Coverage was not measured at all. Setting a high bar immediately would either
  block the PR that introduced it or invite tests written to satisfy the number.
- **Decision**: Report coverage on every run and fail CI below 10%. Actual coverage is
  around 90%; the floor exists to catch a collapse, not to describe the target.
- **Alternatives considered**: 80% or 90% enforced immediately - rejected for now because
  the boto3-heavy seams would push people toward mock-shaped tests. Reporting with no
  threshold - rejected because nothing then stops coverage silently going to zero.
- **Consequences**: The number is honest rather than gamed. Ratchet the floor upward
  deliberately as the suite matures; it is one line in `pyproject.toml`.

## 2026-08-27 - Lambda glue for agent invocation and human-approval task tokens

- **Status**: Accepted
- **Context**: The state machine's Task states were `Pass` placeholders. Needed real
  integrations for (1) invoking each of the four agents' AgentCore Runtime endpoints
  (cross-region: state machine in ap-southeast-2, AgentCore Runtime in us-east-1) and (2)
  pausing on human approval while persisting the callback task token onto the project's
  DynamoDB item. Discovered along the way: CDK's `DynamoUpdateItem` does not support
  `integration_pattern=WAIT_FOR_TASK_TOKEN` - it's silently ignored (verified against the
  compiled aws-cdk-lib JS; DynamoDB Step Functions integrations are Request/Response only).
- **Decision**: Added `src/orchestration/agent_invoker.py` (a Lambda, resolves the
  AgentCore runtime ARN by name via `list_agent_runtimes` since it isn't known at CDK
  synth/deploy time, then calls `invoke_agent_runtime`) as the `LambdaInvoke` Task for
  Distill/Blueprint/Review/Showroom. Added `src/orchestration/persist_approval.py` (a
  second Lambda) as a `LambdaInvoke` Task with `integration_pattern=WAIT_FOR_TASK_TOKEN`
  for the two approval waits - it writes `task_token`/`station`/gsi1 pending-lookup
  attributes and returns immediately, while the execution itself stays paused until the
  console API calls `send_task_success`/`send_task_failure` (now wired into
  `POST /projects/{id}/decisions`, replacing the earlier TODO stub; `POST /projects` now
  also starts the execution). Both Lambdas get least-privilege IAM: `agent_invoker` is
  scoped to `bedrock-agentcore:InvokeAgentRuntime` on `runtime/hyperdelivery_*` only;
  `persist_approval` gets DynamoDB write on the project table only.
- **Alternatives considered**: `DynamoUpdateItem` directly with `WAIT_FOR_TASK_TOKEN` -
  not actually supported by the CDK construct/AWS service integration, would have deployed
  successfully but never paused. A single combined Lambda for both agent invocation and
  approval-persistence - rejected for clearer least-privilege IAM boundaries (one function
  never needs the other's permissions).
- **Consequences**: Both Lambdas still use an unbundled code asset (no real dependency
  packaging - deferred like `ConsoleApiStack`'s Lambda, since deploy is blocked on IAM
  regardless). Rejections currently fail the whole execution (`States.ALL` catch to a
  `Fail` state) - no resubmit/retry loop; revisit if that's needed before Showroom's
  iteration-loop work (Phase 3+) lands. Agent prompts are placeholders (`"Project {id}"`)
  until Phase 3 memory/retrieval work supplies real artifact-grounded prompts.

## 2026-08-27 - Decision-needed notifications come from persist_approval, not EventBridge

- **Status**: Accepted
- **Context**: Automated PR review of the above entry's changes flagged that the
  `StateEnteredRule` EventBridge rule was named/intended to notify "who owes a decision"
  per approval station, but its `event_pattern` only matched
  `"Step Functions Execution Status Change"` - an execution-level event (RUNNING/
  SUCCEEDED/FAILED/...), not a per-state-entry event. Investigated whether Step Functions
  emits any native per-state EventBridge event (it does not - confirmed against AWS's own
  docs; the reviewer's own suggested fix, `"Step Functions State Change"`, is not a real
  detail-type either) so the rule as designed could never have driven the notification.
- **Decision**: Publish the "decision needed" SNS notification directly from
  `persist_approval.py` (the Lambda that runs at exactly the moment an approval wait
  begins), granted `notifications_topic.grant_publish`. Renamed the EventBridge rule
  construct `StateEnteredRule` -> `ExecutionStatusRule` to accurately describe its
  remaining scope (execution-level status only, kept for future ops/observability use,
  not per-station notifications).
- **Alternatives considered**: Polling DynamoDB's pending-approval GSI on a schedule to
  detect new waits - rejected as unnecessary latency/cost when the Lambda that creates the
  pending state can just publish inline.
- **Consequences**: Notification delivery is now coupled to `persist_approval`'s own
  success - if it throws after the DynamoDB write but before the SNS publish, the wait is
  still correctly persisted but no notification fires. Acceptable for now (the console can
  still poll/list pending approvals); revisit with a dead-letter queue or at-least-once
  retry if that gap matters in practice.

## 2026-08-27 - PR-review fixes: decision-write ordering, terminal state, response guard

- **Status**: Accepted
- **Context**: The same automated PR review flagged three more issues in the Step
  Functions glue: (1) `ProjectRepository.record_decision` wrote the DECISION audit item to
  DynamoDB *before* checking whether the project existed, risking orphaned audit records
  for unknown project IDs; (2) the domain model's station line (`core.domain.project`)
  ends in a terminal `"done"` station, but the Step Functions definition ended at
  `Showroom` with nothing ever writing `station="done"`; (3) `submit_decision` called
  `_to_response(repo.get_project(project_id))` on a final re-fetch with no `None` guard,
  risking an unhandled `AttributeError` if the project vanished between the two fetches.
- **Decision**: (1) Reordered `record_decision` to fetch and validate the project first,
  raising immediately if missing, before writing the Decision record. (2) Added a
  `MarkDone` `DynamoUpdateItem` Task (plain Request/Response - not a wait, so no callback
  pattern needed) after `Showroom` in the chain, setting `station="done"` and removing the
  now-irrelevant `gsi1pk`/`gsi1sk` GSI attributes. (3) Added an explicit `None` check in
  `submit_decision` that raises `HTTPException(500, ...)` instead of crashing.
- **Alternatives considered**: None of these had a real alternative design - they're
  correctness fixes, not tradeoffs.
- **Consequences**: None beyond the fixes themselves. Two other review comments (hardcoded
  AWS account ID in `scripts/iam/agentcore-trust-policy.json` and
  `agentcore-execution-policy.json`) were deliberately left as-is: this is a genuine
  single-account project and those are the actual files used for the real admin IAM grant
  request, not a reusable public template - parameterizing them would add templating
  complexity for no benefit here.

## 2026-08-27 - One core service, two integration seams, for multi-interface support

- **Status**: Accepted
- **Context**: The console API will eventually need more than one client (web console UI,
  a CLI, and possibly future integrations like a Slack/Teams bot), plus at least one
  streaming/push use case (chatbot-style token streaming, approval notifications). Needed
  a shape that adds new interfaces cheaply rather than growing bespoke backend logic per
  client.
- **Decision**: Keep exactly one place for business logic (`ProjectRepository`, and future
  services like a `ChatService`) behind exactly two integration seams: (1) a
  request/response seam (the HTTP API) for anything synchronous, and (2) a push/event
  fan-out seam (the existing SNS/EventBridge notification topic, extended later with a
  WebSocket API Gateway + connections table) for anything server-initiated. Added
  `src/sdk/python/` (`HyperdeliveryClient`, mirroring `ua-ai-platform`'s `sdk/python`
  convention) as the one client every interface (CLI, web UI, future integrations) should
  depend on instead of hand-rolling HTTP calls.
- **Alternatives considered**: Letting each interface (web UI, CLI) call the API directly
  with its own request-building code - rejected because it duplicates auth/retry/schema
  logic per client and drifts as the API evolves. A separate backend-for-frontend per
  interface - rejected as unnecessary complexity until a real interface-specific need
  (e.g. GraphQL for the web UI) actually appears.
- **Consequences**: New interfaces should almost never require new backend surface - a
  Slack bot, for instance, is just another SDK consumer plus an SNS/EventBridge
  subscriber, not new business logic. The WebSocket connections table/broadcast Lambda
  and a `ChatService` for streaming are still unbuilt - tracked as follow-up work, not
  yet implemented.

## 2026-08-27 - Console backend as a standalone FastAPI service, not another AgentCore Runtime

- **Status**: Accepted
- **Context**: Phase 2 needs a thin API for creating projects, reading their DynamoDB
  state projection, and submitting approvals - none of which is agent inference, so it
  doesn't belong behind the `/invocations` AgentCore Runtime contract the four agents use.
- **Decision**: Added `src/api/` (FastAPI, mirroring `ua-ai-platform`'s `main.py`/
  `routers/`/`schemas/` convention this repo forked from) as its own process, run via
  `make dev-console` / `uv run uvicorn api.main:app`. State lives in a new
  `ProjectRepository` (`src/infrastructure/repositories/`) wrapping the DynamoDB table
  from the orchestration CDK stack, with domain rules (station order, transitions) in
  `core/domain/project.py`. Table name/region are separate `Settings` fields
  (`projects_table`, `orchestration_region`) from `aws_region`, matching the existing
  intentional us-east-1 (Bedrock)/ap-southeast-2 (orchestration infra) split.
- **Alternatives considered**: Adding these endpoints as a fifth `agent_runtime/` app -
  rejected, since AgentCore Runtime's contract (`/invocations`, `/ping`) is
  agent-inference-shaped and would force CRUD/query traffic through an interface that
  doesn't fit it. Using `moto` to mock DynamoDB in tests - rejected in favor of this
  repo's existing convention (see `test_s3_storage.py`) of a small hand-written stub
  client, avoiding a new dev dependency for a handful of tests.
- **Consequences**: The approval endpoint (`POST /projects/{id}/decisions`) is currently
  a stub for the Step Functions callback - it advances the DynamoDB station but does not
  yet call `SendTaskSuccess`/`SendTaskFailure`, since no state machine is deployed (see
  `TODO(ADVA-3015)` in `api/routers/projects.py`). Must be wired up once the CDK stack
  actually deploys. The manually-created `hyperdelivery-projects` table (see prior entry)
  still needs CDK reconciliation before this and the CDK stack can coexist safely.

## 2026-08-27 - Step Functions + DynamoDB for Phase 2 orchestration

- **Status**: Accepted
- **Context**: Phase 2 needs a per-project state machine that sequences the four agents,
  survives a multi-day human approval wait, and keeps an audit trail (FSD/prompt/model
  version, signer) per decision - none of which exists yet.
- **Decision**: Use AWS Step Functions **Standard** workflows (not Express - supports
  executions up to 1 year) as the state machine, with the `waitForTaskToken` callback
  pattern for the human-hold/approval steps. DynamoDB holds the queryable project
  projection (current station, artifact versions, pending task tokens) since Step
  Functions execution history alone isn't efficient to query for "where is project X."
  EventBridge rules on Step Functions state-entered events drive notifications (who owes
  a decision) via SNS/SES. Each task state invokes the existing per-agent AgentCore
  Runtime `/invocations` endpoint - no change to the agents themselves.
- **Alternatives considered**: A custom Lambda/DynamoDB-only state machine - rejected
  because it would reinvent callback-token bookkeeping, retries, and execution history
  that Step Functions provides natively, for a workflow that genuinely needs multi-day
  durable waits.
- **Consequences**: Ties orchestration to a proprietary AWS service (harder to test
  locally, per-transition cost) in exchange for not hand-rolling durable human-in-the-loop
  waits and audit history. The project console (Phase 2 front end) becomes a thin client
  over the DynamoDB projection + an approval endpoint that calls `SendTaskSuccess`/
  `SendTaskFailure` - no orchestration logic in the frontend.

## 2026-08-26 - No AgentCore Memory/Gateway/Identity yet

- **Status**: Accepted
- **Context**: Bedrock AgentCore offers Memory, Gateway (MCP tool federation), and
  Identity (credential vending) beyond the Runtime HTTP contract. None are adopted.
  Static long-lived Atlassian API token in `.env` is the one concrete cost of skipping
  Identity today.
- **Decision**: Only use AgentCore Runtime (the `/invocations`/`/ping` HTTP contract) for
  now. Defer Memory/Gateway/Identity to the plan's Phase 3 ("Memory, MCP and
  Integrations").
- **Alternatives considered**: Adopt Gateway now for the Confluence/S3 tools instead of
  hand-rolled `@tool` wrappers - rejected because Gateway requires provisioning real AWS
  infra (Gateway + Gateway Target + IAM role) that doesn't exist yet, and no second
  consumer of these tools exists yet to justify centralizing them.
- **Consequences**: Revisit Identity specifically (not just Gateway/Memory) sooner than
  Phase 3 if the static Atlassian PAT becomes a real audit/security concern.

## 2026-08-26 - Register a real OTel TracerProvider at startup

- **Status**: Accepted
- **Context**: `bedrock_agentcore.runtime.tracing` auto-registers a `BaggageSpanProcessor`
  on every request, but silently no-ops against the default `ProxyTracerProvider` when
  nothing has called `trace.set_tracer_provider(...)`. Installing `opentelemetry-sdk`
  alone doesn't fix it - the provider still has to be set explicitly.
- **Decision**: Added `infrastructure/observability/tracing.py`'s `configure_tracing()`,
  called once in `factory.create_app()`, which sets a plain `TracerProvider()` unless one
  is already registered (so the managed Runtime environment's own provider, if any, wins).
- **Alternatives considered**: Rely on the managed AgentCore Runtime to inject a real
  provider at deploy time and ignore the local warning - rejected because it left local
  dev with zero tracing and a recurring swallowed exception in every startup log.
- **Consequences**: No exporter is configured yet, so spans aren't shipped anywhere -
  this only makes the existing auto-instrumentation hook functional instead of dead code.

## 2026-08-26 - Log invocation results at DEBUG, not INFO

- **Status**: Accepted
- **Context**: `agent_runtime/factory.py`'s `agent_invocation` only logged lifecycle
  events (started/succeeded/error), giving zero visibility into what an agent actually
  returned - which made diagnosing the `MaxTokensReachedException` bug harder than it
  needed to be.
- **Decision**: Log the full `result.structured_output.model_dump()` at `DEBUG`, gated
  behind `LOG_LEVEL=DEBUG` in `.env`.
- **Alternatives considered**: Log at `INFO` by default - rejected because results can
  contain full FSD/spec content, and dumping that into stdout by default is an
  unnecessary default-on data exposure.
- **Consequences**: Debugging a live agent requires remembering to set `LOG_LEVEL=DEBUG`
  first; this is an accepted tradeoff over always-on verbose logging.

## 2026-08-26 - Explicit `max_tokens` on every agent's `BedrockModel`

- **Status**: Accepted
- **Context**: `BedrockModel(...)` silently omits `maxTokens` from the Bedrock Converse
  API request if not set, falling back to a default too low for a real multi-entry
  `StructuredSpec` - this passed short smoke-test prompts but crashed
  (`MaxTokensReachedException`) on a real fetched document.
- **Decision**: Added `AgentConfig.max_tokens: int = 8192`, passed through in
  `strands_factory.build_agent()`. Every agent gets this default without needing to
  declare it in its YAML.
- **Alternatives considered**: Set `max_tokens` per-agent in each `config/agents/*.yaml` -
  rejected as unnecessary duplication until an agent is shown to need a different value.
- **Consequences**: Verified against a real 579 KB PDF producing a 30-requirement
  `StructuredSpec` with no truncation. Revisit the default if a future document needs more.

## 2026-08-26 - `aws_region` and `s3_region` stay separate settings

- **Status**: Accepted
- **Context**: Both happen to be `ap-southeast-2` today, which looked like possible
  duplication.
- **Decision**: Keep them as two independent `Settings` fields - one is the Bedrock
  compute region, the other is the S3 bucket's fixed physical region.
- **Alternatives considered**: Collapse into a single `AWS_REGION` env var - rejected
  because these are two genuinely independent resources with independent lifecycles that
  could diverge in the future even though they coincide today.
- **Consequences**: None currently; revisit only if a real reason to diverge appears.

## 2026-08-26 - Drop the `HYPERDELIVERY_` env var prefix

- **Status**: Accepted
- **Context**: All app config vars were prefixed `HYPERDELIVERY_*`, which read as
  redundant inside the `hyperdelivery` repo itself.
- **Decision**: Removed the prefix repo-wide (`settings.py`, `.env`, `.env.example`,
  `Makefile`, `scripts/dev_all.sh`, `README.md`, tool docstrings).
- **Alternatives considered**: Keep the prefix for future multi-service namespacing -
  rejected as premature; add a prefix back only if/when this config is actually shared
  across services.
- **Consequences**: None; verified via `grep` (zero remaining matches), lint, and tests.

## 2026-08-26 - S3 document access as an agentic `@tool`, not a separate API

- **Status**: Accepted
- **Context**: Needed a way for Distill to read FSD documents uploaded to S3
  (`edma-ai-test` bucket).
- **Decision**: Implemented as a Strands `@tool` (`tools/documents.py`'s
  `s3_get_document_text`) that the LLM calls by object key, backed by a generic,
  policy-free `providers/storage/s3.py` (fetch + parse, testable via an injected client).
  The tool wrapper pulls `bucket`/`region` from `Settings` - the LLM can only ever supply
  a `key`, never an arbitrary bucket, as a least-privilege boundary.
- **Alternatives considered**: A separate microservice/API endpoint that Distill calls -
  rejected because fetch+parse is deterministic, mechanical work with no need for the LLM
  to reason about *how* to fetch, only *whether* to. This exactly mirrors the existing
  `mcp_clients/atlassian.py` + `tools/atlassian.py` split, so no new architectural pattern
  was introduced.
- **Consequences**: Established "generic reusable provider + policy-gated tool wrapper"
  as this repo's standing convention for any new external-service integration, not just
  MCP-based ones.

## 2026-08-26 - `mcp_clients/` (generic) vs `tools/` (policy) split

- **Status**: Accepted
- **Context**: Needed a place for MCP client construction (Confluence, Jira) that's
  reusable across agents without baking in per-agent tool-filtering policy.
- **Decision**: Generic, `Settings`-free MCP client/session builders live in
  `mcp_clients/atlassian.py`; per-agent policy (which tools an agent is allowed to call,
  env-var gating) lives in `tools/atlassian.py`.
- **Alternatives considered**: One combined module per integration - rejected because it
  would couple reusable connection logic to agent-specific tool-filtering, making the
  connection logic harder to reuse for a future third agent.
- **Consequences**: This split was directly reused as the template for the (non-MCP) S3
  integration - see the entry above.
