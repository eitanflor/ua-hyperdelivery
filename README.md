# Hyperdelivery

Strands Agents SDK on Amazon Bedrock, deployed on Amazon Bedrock AgentCore Runtime.
Forked from `ua-ai-platform`'s skeleton - see that repo's README for the ports-and-adapters
rationale this reuses (declarative config, observability pattern).

## Architecture

```
src/
├── agent_runtime/    # one composition root per agent (distill/, blueprint/) + shared factory.py
├── providers/agents/ # builds a strands.Agent from declarative config
├── core/domain/      # AgentConfig, StructuredSpec (G1), Blueprint (G2)
├── config/agents/    # one declarative {name}.yaml per agent
├── infrastructure/   # observability (session-id-aware logging)
└── tools/            # custom @tool functions - none onboarded yet, prefer strands-agents-tools

tests/
└── unit/
```

Unlike `ua-ai-platform`, there is no hand-rolled orchestrator or agent registry here -
Strands owns the agent loop (tool-use, multi-agent patterns, context management).
`AgentConfig`/`config/agents/*.yaml` stay purely declarative, mirroring `ua-ai-platform`'s
`config/models.yaml` pattern. AgentCore Runtime deploys one container per agent, so each
agent gets its own entrypoint under `agent_runtime/` and its own `structured_output` model
(`core/domain/spec.py`'s `StructuredSpec` for Distill, `core/domain/blueprint.py`'s
`Blueprint` for Blueprint) instead of returning free text.

Currently two agents: **Distill** (raw FSD -> gate-scored `StructuredSpec`, G1) and
**Blueprint** (approved `StructuredSpec` -> `Blueprint` with units of work, G2).

## Getting started

```bash
uv sync
cp .env.example .env
make dev-distill    # or: make dev-blueprint
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
uv run pytest
uv run ruff check .
```

## Deploying to AgentCore Runtime

Build the ARM64 image (required by AgentCore Runtime) with `--build-arg AGENT=distill` or
`--build-arg AGENT=blueprint` to select which agent it runs, push to ECR, then create an
agent runtime pointing at the image. See AWS's
[Get started without the AgentCore CLI](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/getting-started-custom.html)
guide for the ECR + `create_agent_runtime` steps.

## Status

Two Strands agents (Distill, Blueprint) wired end-to-end through the AgentCore Runtime HTTP
contract (`/invocations`, `/ping`, port 8080), each returning a validated pydantic model
instead of free text. No tools, memory, Gateway, or Identity integration yet, and no Triage/
Review/Showroom/Ship agents or control plane (Step Functions, gate manager) - add those only
as a real use case demands them.
