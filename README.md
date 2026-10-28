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
The proposal for the next phase, taking the EDM pilot to an enterprise platform that runs the UA-DLC
framework, is in [docs/ua-dlc/](docs/ua-dlc/README.md) (draft for leadership review). `make site`
serves its standalone concept site from [docs/ua-dlc/site/](docs/ua-dlc/site/) at
http://localhost:8766/: the plan as a page and a clickable canvas of the concept screens.

```
src/
├── agent_runtime/    # one composition root per agent (distill/, blueprint/, review/, showroom/) + shared factory.py
├── core/             # domain models per gate, the artifact gate in core/validation, delivery grouping, plus AgentName - depends on nothing else
├── config/           # declarative {name}.yaml per agent, model_pricing.yaml (USD per 1M tokens) + environment-backed Settings
├── providers/        # adapters onto third-party SDKs (Strands agent builder, S3 fetch+parse)
├── mcp_clients/      # generic MCP client builders (Confluence/Jira over stdio)
├── tools/            # per-agent @tool functions - deterministic validators + the least-privilege policy layer
├── infrastructure/   # AWS adapters: DynamoDB repository, Step Functions client, logging/tracing
├── orchestration/    # Step Functions Lambda tasks (agent invoke, approval wait)
├── api/              # console API (FastAPI + Mangum) - projects, gate decisions, Entra ID auth (api/auth.py)
└── sdk/python/       # client for the console API

infra/                # AWS CDK: state machine, projects table, notifications, console API
ui/console/           # React + Vite console UI - the real client for the console API (see its README)
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

`make dev-all` runs every agent, the console API and the console UI together. It frees the
dev ports before starting and again on exit - Ctrl-C alone does not always take everything
with it, since `uv`/`pnpm` spawn the real process as a child and uvicorn's `--reload`
supervisor respawns its worker. If a port is still stuck, `make dev-stop` clears it. A
leftover listener is worth catching: the new server cannot bind, so the console keeps
talking to an agent running the previous checkout's prompts and schema.


Test locally (in another terminal):

```bash
curl http://localhost:8080/ping
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "<raw FSD text>"}'
```

## Testing

```bash
make check       # fast gate: format, lint, types, tests, secrets (plus console UI checks when pnpm is installed)
make check-full  # fast gate plus AWS infrastructure checks
make check-fix   # fast gate, but auto-fixes mechanical failures first
```

CI runs the same script with its full mode ([scripts/precheck.sh](scripts/precheck.sh)), so
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
base runtime permissions. Deploy the storage stack with the same `AGENTCORE_ROLE_ARN`; its
resource policies grant the runtime scoped access to global context and project documents
without modifying the externally managed role. See AWS's
[IAM Permissions for AgentCore Runtime](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-permissions.html)
guide. For the underlying manual steps (ECR, `create_agent_runtime`), see
[Get started without the AgentCore CLI](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/getting-started-custom.html).

`make deploy AGENT=distill` also forwards configured `SNOWFLAKE_ACCOUNT`,
`SNOWFLAKE_PAT`, `SNOWFLAKE_DATABASE`, and `SNOWFLAKE_SCHEMA` values from `.env` to the
Distill runtime. The account and PAT must be set together; without both, the optional
`snowflake_query` tool is not attached.


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

**Phase 2 - console and orchestration (deployed to `dev`).** A FastAPI console API
(`src/api/`) creates projects, records gate decisions, and streams agent turns over SSE,
against a single-table DynamoDB projection (`infrastructure/repositories/`). Every route
is gated behind Entra ID (Azure AD) sign-in (`api/auth.py` - validates the bearer ID
token against Entra's JWKS; `sdk/python/` does not carry credentials and is not yet
updated for this). A Step Functions state machine (`hyperdelivery-project-line`,
us-east-1) sequences the line with `WAIT_FOR_TASK_TOKEN` holds at each human approval
(`infra/stacks/`, `orchestration/`) - `HyperdeliveryDevOrchestrationStack`,
`HyperdeliveryDevConsoleApiStack` and `HyperdeliveryDevStorageStack` are all live, and
the console API Lambda has `STATE_MACHINE_ARN` set, so the real execution path runs
rather than the DynamoDB-only local fallback. All four AgentCore Runtimes
(`hyperdelivery_distill`/`_blueprint`/`_review`/`_showroom`) are deployed and `READY` in
us-east-1, sharing the `hyperdelivery-agentcore-execution` IAM role - see
`scripts/deploy_agent.sh` and docs/decisions.md. Verified live end-to-end: a real project
brief runs through Distill (looping on `WaitForDistillAnswer`/`POST /projects/{id}/answer`
whenever it asks a clarifying question instead of drafting, the same way the local console
chat does) through to a real `StructuredSpec` and the `blueprint_approval` gate. The
Lambda code assets are now Docker-bundled (`infra/stacks/lambda_bundling.py`, ADVA-3015
resolved for `agent_invoker`/`persist_approval`/`persist_question`).

**The console UI (`ui/console/`).** A React + Vite + TypeScript app is the real client
for the console API, hosted in AWS on `ConsoleUiStack` (private S3 + CloudFront, no
custom domain yet) alongside running locally via `pnpm dev`. The four agents are
presented as a crew with sports-staff names and plain job titles - **Scout** (requirements
analyst), **Coach** (build planner), **Ref** (quality reviewer), **Host** (demo producer) -
each with its own face and identity color. Everything around them is plain language, so
the line reads `Requirements -> Gate 1 -> Plan -> Gate 2 -> Build check -> Gate 3 -> Demo`
and each gate is named for what approving it means ("Approve the plan"). The line itself
is the primary navigation object in the top bar. The three approval gates are the loudest
surface in the product: a gate says what you are approving and what happens next, shows
the criteria being signed against, records the signed-in user as the signer (the API takes
it from the validated token, never from the request body), and keeps every decision
undoable for twelve seconds before it is sent. Cleared gates show who signed, from the
decision trail at `GET /projects/{id}/decisions`. Light and
dark themes ship from one semantic token layer (today's console; the UA-DLC redesign is
light only). Signs in via MSAL against the same Entra ID app registration the API
validates against. Talks to the API directly over `fetch`
(`ui/console/src/api/client.ts`), not through `sdk/python`. The crew names are a display
layer only - the wire ids stay `distill`, `blueprint`, `review`, `showroom`. See
[ui/console/README.md](ui/console/README.md) and
[docs/console-redesign.md](docs/console-redesign.md). The current UI/UX audit, the
roadmap for non-technical users, and the research library behind both live in
[docs/design/](docs/design/README.md).

**Not started.** AgentCore Memory, Gateway and Identity; the Bedrock Knowledge Base; and
the M365 integration. Distill's Snowflake Cortex integration and Blueprint/Review's
GitHub integration are already implemented. Add the remaining integrations as real use
cases demand them, not speculatively.

**Next (proposed, not yet approved).** The MVP plan's Phase 4 pilot, baseline and security
close-out have not run. [docs/ua-dlc/](docs/ua-dlc/README.md) proposes three phases. Current
State: today's line keeps running while the baseline is measured and every long-lead request is
filed (weeks 1 and 2). The Final MVP: a short do-no-harm floor (Snowflake rows never stored outside
Snowflake, no plaintext secrets, repositories only in a prototype GitHub organization and builds
only in the sandbox account, writes only after approvals), then an orchestrator that hands
Snowflake work to Cortex Code and coding to a sandboxed coding agent, built to MVP ready in
week 14 and tried in a real testing pilot through week 22. Enterprise: identity, audit,
budgets, evals, policy and HyperDelivery's own production environment, decided on pilot evidence
and never holding up the Final MVP. HyperDelivery's build ends at Inception: a mockup, a working
prototype on dev data in a hosted sandbox and a handoff package; whether Construction is AI-driven
or AI-assisted with engineers is decided per project after Inception. The concept screens put
it in a chat-first shell (a side nav, and each project as a conversation beside its artifacts),
and the plan compares it with the products building toward UA-DLC. From the Enterprise phase
on, [north-star.md](docs/ua-dlc/north-star.md) sets the direction: UA-DLC steps move from human-led to
AI-driven on evidence with people still making every decision, linked meetings and expert answers
come in through Teams, and the record of how UA decides becomes an advantage that stays UA's.
