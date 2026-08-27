# Hyperdelivery

Strands Agents SDK on Amazon Bedrock, deployed on Amazon Bedrock AgentCore Runtime.
Forked from `ua-ai-platform`'s skeleton - see that repo's README for the ports-and-adapters
rationale this reuses (declarative config, observability pattern).

## Architecture

See [docs/architecture.md](docs/architecture.md) for high-level and low-level diagrams,
and [docs/decisions.md](docs/decisions.md) for the log of architecture/tradeoff
decisions (why things are built the way they are, kept up to date via the
`log-decision` skill). Conventions and the Definition of Done live in
[AGENTS.md](AGENTS.md); setup and the gate are in [CONTRIBUTING.md](CONTRIBUTING.md).

```
src/
├── agent_runtime/    # one composition root per agent (distill/, blueprint/, review/, showroom/) + shared factory.py
├── core/             # domain models per gate, plus AgentName - depends on nothing else
├── config/           # declarative {name}.yaml per agent + environment-backed Settings
├── providers/        # adapters onto third-party SDKs (Strands agent builder, S3 fetch+parse)
├── mcp_clients/      # generic MCP client builders (Confluence/Jira over stdio)
├── tools/            # per-agent @tool functions - deterministic validators + the least-privilege policy layer
├── infrastructure/   # AWS adapters: DynamoDB repository, Step Functions client, logging/tracing
├── orchestration/    # Step Functions Lambda tasks (agent invoke, approval wait)
├── api/              # console API (FastAPI + Mangum) - create projects, record gate decisions
└── sdk/python/       # client for the console API

infra/                # AWS CDK: state machine, projects table, notifications, console API
ui/                   # Streamlit harness for poking an agent by hand
tests/unit/
```

Unlike `ua-ai-platform`, there is no hand-rolled orchestrator or agent registry here -
Strands owns the agent loop (tool-use, multi-agent patterns, context management).
`AgentConfig`/`config/agents/*.yaml` stay purely declarative, mirroring `ua-ai-platform`'s
`config/models.yaml` pattern. AgentCore Runtime deploys one container per agent, so each
agent gets its own entrypoint under `agent_runtime/` and its own `structured_output` model
(`core/domain/spec.py`'s `StructuredSpec` for Distill, `core/domain/blueprint.py`'s
`Blueprint` for Blueprint, `core/domain/review.py`'s `ReviewReport` for Review,
`core/domain/showroom.py`'s `DemoPackage` for Showroom) instead of returning free text.

Four agents, one per gate: **Distill** (raw FSD -> gate-scored `StructuredSpec`, G1),
**Blueprint** (approved `StructuredSpec` -> `Blueprint` with units of work, G2), **Review**
(built deliverable + code vs. FSD/Blueprint -> `ReviewReport` gap report and coverage view,
G3), and **Showroom** (FSD that cleared Review -> `DemoPackage` with seed data and a talk
track, G4).

## Getting started

```bash
uv sync --all-groups
cp .env.example .env
make hooks          # install pre-commit hooks, once
make dev-distill    # or: make dev-blueprint / make dev-review / make dev-showroom
```


Test locally (in another terminal):

```bash
curl http://localhost:8080/ping
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "<raw FSD text>"}'
```

## Testing

```bash
make check      # the gate: format, lint, types, tests, infra, secrets
make check-fix  # same, but auto-fixes the mechanical failures first
```

CI runs the same script ([scripts/precheck.sh](scripts/precheck.sh)), so green locally
means green in CI. Individual gates: `make format`, `make lint`, `make typecheck`,
`make test`.

## Deploying to AgentCore Runtime

```bash
export AGENTCORE_ROLE_ARN=arn:aws:iam::<account-id>:role/<agent-runtime-role>
make deploy AGENT=distill    # or blueprint / review / showroom
```

`scripts/deploy_agent.sh` builds the ARM64 image (`--build-arg AGENT=<agent>`), pushes it to
an `hyperdelivery-<agent>` ECR repo (creating it if needed), and calls
`create-agent-runtime`/`update-agent-runtime` (whichever applies) with the ARM64 image and
`AGENTCORE_ROLE_ARN`. The role must already exist with AgentCore Runtime's trust policy and
permissions - see AWS's
[IAM Permissions for AgentCore Runtime](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-permissions.html)
guide. For the underlying manual steps (ECR, `create_agent_runtime`), see
[Get started without the AgentCore CLI](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/getting-started-custom.html).


## Status

**Phase 1 - the agent suite (done).** Four Strands agents (Distill, Blueprint, Review,
Showroom) wired end-to-end through the AgentCore Runtime HTTP contract (`/invocations`,
`/ping`, port 8080), each returning a validated pydantic model instead of free text.
Distill has a read-only Confluence MCP tool and an S3 document-fetch tool (generic
fetch+parse in `providers/storage/s3.py`, policy wrapper gated on `S3_BUCKET`/`S3_REGION`
in `tools/documents.py` - the LLM only ever supplies an object key, never a bucket), and
Blueprint has a Jira issue-lifecycle MCP tool (generic client builders in
`mcp_clients/atlassian.py`, per-agent tool-filter policy in `tools/atlassian.py`, gated on
`ATLASSIAN_*` env vars). Review and Showroom have no external tools yet - they take their
input entirely from the prompt.

**Phase 2 - console and orchestration (scaffolded, not deployed).** A FastAPI console API
(`src/api/`) creates projects and records gate decisions against a single-table DynamoDB
projection (`infrastructure/repositories/`), a Step Functions state machine sequences the
line with `WAIT_FOR_TASK_TOKEN` holds at each human approval (`infra/stacks/`,
`orchestration/`), and `sdk/python/` is the client every interface should go through.
Nothing here is deployed yet: it is blocked on IAM, and the Lambda code assets still have
no dependency bundling (TODO ADVA-3015).

**Not started.** AgentCore Memory, Gateway and Identity; the Bedrock Knowledge Base; the
M365, GitHub and Snowflake integrations; and any front end beyond the Streamlit harness.
Add those as real use cases demand them, not speculatively.
