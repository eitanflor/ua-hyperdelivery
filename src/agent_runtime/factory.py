"""Shared composition root: turns declarative config into an AgentCore Runtime app."""

import asyncio
import json
import logging
from collections.abc import AsyncGenerator
from typing import Any, TypeVar

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from pydantic import BaseModel
from strands import Agent
from strands.hooks import AfterToolCallEvent
from strands.types.tools import ToolResult

from config.loader import load_agent_config
from config.settings import get_settings
from infrastructure.observability.logging import configure_logging, session_id_var
from infrastructure.observability.tracing import configure_tracing
from providers.agents.strands_factory import build_agent

OutputT = TypeVar("OutputT", bound=BaseModel)


def _tool_result_payload(tool_result: ToolResult) -> object:
    """Best-effort decode of a tool's raw result for the console UI's tool-call panel.

    Every `@tool` function here returns a plain dict, which Strands wraps as a JSON
    string in the first text content block - parse that back out, or fall back to the
    raw text if it is not JSON.
    """
    for block in tool_result.get("content", []):
        text = block.get("text")
        if isinstance(text, str):
            try:
                return json.loads(text)
            except ValueError:
                return text
    return None


def _capture_finished_tool_calls(agent: Agent) -> list[tuple[str, str, ToolResult]]:
    """Register the single callback that captures completed tool calls."""
    finished_tool_calls: list[tuple[str, str, ToolResult]] = []

    def _on_after_tool_call(event: AfterToolCallEvent) -> None:
        tool_use = event.tool_use
        finished_tool_calls.append(
            (tool_use.get("toolUseId", ""), tool_use.get("name", ""), event.result)
        )

    agent.hooks.add_callback(AfterToolCallEvent, _on_after_tool_call)
    return finished_tool_calls


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
    invocation_lock = asyncio.Lock()
    app = BedrockAgentCoreApp()
    logger = logging.getLogger(agent_name)

    # Strands never yields a tool's result from `stream_async` itself - `ToolResultEvent`
    # opts out of the callback stream it iterates (`is_callback_event` is False), so the
    # `current_tool_use` deltas below can only ever announce a call starting, never
    # finishing. This hook is the only place the result is observable. Registered once
    # against this module-level `agent` (built once, above) rather than per invocation:
    # Strands itself serializes invocations one at a time per agent instance (a second
    # concurrent call raises `ConcurrencyException`), so a plain list closed over by both
    # the hook and the request handler below is safe without per-request registration -
    # there is no `remove_callback` to undo one anyway.
    finished_tool_calls = _capture_finished_tool_calls(agent)

    @app.entrypoint
    async def agent_invocation(  # pyright: ignore[reportUnusedFunction]  # registered by the decorator
        payload: dict[str, Any], context: object
    ) -> AsyncGenerator[dict[str, Any], None]:
        """AgentCore Runtime HTTP contract, streaming variant.

        JSON payload/context in, an SSE stream out: `{"chunk": str}` as the model
        produces free text, `{"tool_call": {"id", "name", "status", "result"}}` once per
        tool call (`status` is `"running"` when it starts and `"done"` with its `result`
        when it finishes - `id` is the tool use id, so a retried call gets its own pair
        instead of being confused with the first), ending in exactly one
        `{"result": dict}` or `{"error": str}`. See LocalAgentClient, which is the only
        current consumer, for how these are read back out.
        """
        session_id_var.set(getattr(context, "session_id", "-"))
        prompt = payload.get("prompt", "")
        if not isinstance(prompt, str) or not prompt.strip():
            yield {"error": "'prompt' must be a non-empty string"}
            return
        logger.info("invocation started")
        result = None
        tool_names: dict[str, str] = {}  # tool use id -> name, so a "done" event can name it

        def _drain_finished_tool_calls() -> list[dict[str, Any]]:
            events = []
            while finished_tool_calls:
                tool_use_id, tool_name, tool_result = finished_tool_calls.pop(0)
                events.append(
                    {
                        "tool_call": {
                            "id": tool_use_id,
                            "name": tool_name or tool_names.get(tool_use_id, ""),
                            "status": "done",
                            "result": _tool_result_payload(tool_result),
                        }
                    }
                )
            return events

        try:
            async with invocation_lock:
                async for event in agent.stream_async(prompt, structured_output_model=output_model):
                    # ahead of this event's own chunk/tool-use so a call that finished
                    # between stream events is announced before the next one starts
                    for done_event in _drain_finished_tool_calls():
                        yield done_event

                    if isinstance(event.get("data"), str):
                        yield {"chunk": event["data"]}

                    current_tool_use = event.get("current_tool_use") or {}
                    tool_use_id = current_tool_use.get("toolUseId")
                    tool_name = current_tool_use.get("name")
                    if tool_use_id and tool_name and tool_use_id not in tool_names:
                        tool_names[tool_use_id] = tool_name
                        yield {
                            "tool_call": {
                                "id": tool_use_id,
                                "name": tool_name,
                                "status": "running",
                            }
                        }

                    if "result" in event:
                        result = event["result"]
                # a tool call can finish after the last model-stream event we see but before
                # the loop above exits - drain once more so its "done" event is never lost
                for done_event in _drain_finished_tool_calls():
                    yield done_event
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
