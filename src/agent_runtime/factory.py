"""Shared composition root: turns declarative config into an AgentCore Runtime app."""

import logging
from collections.abc import AsyncGenerator
from typing import Any, TypeVar

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from pydantic import BaseModel

from config.loader import load_agent_config
from config.settings import get_settings
from infrastructure.observability.logging import configure_logging, session_id_var
from infrastructure.observability.tracing import configure_tracing
from providers.agents.strands_factory import build_agent

OutputT = TypeVar("OutputT", bound=BaseModel)


def create_app(
    agent_name: str, output_model: type[OutputT], tools: list[Any] | None = None
) -> BedrockAgentCoreApp:
    """Wire a declaratively-configured Strands agent into the AgentCore Runtime contract.

    The agent's reply is validated against `output_model` instead of being returned as
    free text, so every station hands the next one a checked artifact.
    """
    settings = get_settings()
    configure_logging(settings.log_level)
    configure_tracing()

    agent = build_agent(load_agent_config(agent_name), region_name=settings.aws_region, tools=tools)
    app = BedrockAgentCoreApp()
    logger = logging.getLogger(agent_name)

    @app.entrypoint
    async def agent_invocation(  # pyright: ignore[reportUnusedFunction]  # registered by the decorator
        payload: dict[str, Any], context: object
    ) -> AsyncGenerator[dict[str, Any], None]:
        """AgentCore Runtime HTTP contract, streaming variant.

        JSON payload/context in, an SSE stream of `{"chunk": str}` events out (as the
        model produces text) ending in exactly one `{"result": dict}` or
        `{"error": str}` - see LocalAgentClient, which is the only current consumer,
        for how these are read back out.
        """
        session_id_var.set(getattr(context, "session_id", "-"))
        prompt = payload.get("prompt", "")
        if not isinstance(prompt, str) or not prompt.strip():
            yield {"error": "'prompt' must be a non-empty string"}
            return
        logger.info("invocation started")
        result = None
        tools_announced: set[str] = set()
        try:
            async for event in agent.stream_async(prompt, structured_output_model=output_model):
                if isinstance(event.get("data"), str):
                    yield {"chunk": event["data"]}
                # Distill (and any agent forced into structured_output_model) mostly
                # goes straight to tool calls with no free "data" text at all - without
                # this, those agents would show nothing until the final result.
                tool_name = event.get("current_tool_use", {}).get("name")
                if tool_name and tool_name not in tools_announced:
                    tools_announced.add(tool_name)
                    yield {"chunk": f"Using {tool_name}...\n"}
                if "result" in event:
                    result = event["result"]
        except Exception:
            logger.exception("agent invocation failed")
            yield {"error": "agent invocation failed"}
            return
        if result is None or result.structured_output is None:
            logger.error("agent did not produce structured output")
            yield {"error": "agent did not produce structured output"}
            return
        # DEBUG, not INFO - the result can contain full FSD/spec content (set
        # LOG_LEVEL=DEBUG in .env to see it).
        dumped = result.structured_output.model_dump()
        logger.debug("result: %s", dumped)
        logger.info("invocation succeeded")
        yield {"result": dumped}

    return app
