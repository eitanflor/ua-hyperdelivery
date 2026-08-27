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
