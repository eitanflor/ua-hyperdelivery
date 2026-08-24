# Hyperdelivery

Strands Agents SDK on Amazon Bedrock, deployed on Amazon Bedrock AgentCore Runtime.
Forked from `ua-ai-platform`'s skeleton - see that repo's README for the ports-and-adapters
rationale this reuses (declarative config, observability pattern).

## Architecture

```
src/
├── agent_runtime/    # AgentCore Runtime entrypoint (composition root)
├── providers/agents/ # builds a strands.Agent from declarative config
├── core/domain/      # AgentConfig - declarative agent definition
├── config/           # settings + agent.yaml
├── infrastructure/   # observability (session-id-aware logging)
└── tools/            # custom @tool functions - none onboarded yet, prefer strands-agents-tools

tests/
└── unit/
```

Unlike `ua-ai-platform`, there is no hand-rolled orchestrator or agent registry here -
Strands owns the agent loop (tool-use, multi-agent patterns, context management).
`AgentConfig`/`agent.yaml` stay purely declarative, mirroring `ua-ai-platform`'s
`config/models.yaml` pattern.

## Getting started

```bash
uv sync
cp .env.example .env
cd src && uv run python -m agent_runtime.main
```

Test locally (in another terminal):

```bash
curl http://localhost:8080/ping
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "hello"}'
```

## Testing

```bash
uv run pytest
uv run ruff check .
```

## Deploying to AgentCore Runtime

Build the ARM64 image (required by AgentCore Runtime), push to ECR, then create an agent
runtime pointing at the image. See AWS's
[Get started without the AgentCore CLI](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/getting-started-custom.html)
guide for the ECR + `create_agent_runtime` steps.

## Status

Phase 0 skeleton: one Strands agent wired end-to-end through the AgentCore Runtime HTTP
contract (`/invocations`, `/ping`, port 8080). No tools, memory, Gateway, or Identity
integration yet - add adapters here only as a real use case demands them.
