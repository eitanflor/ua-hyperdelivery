"""Shared composition root: turns declarative config into an AgentCore Runtime app."""

import asyncio
import contextvars
import json
import logging
import time
from collections.abc import AsyncGenerator, AsyncIterator
from typing import Any, NamedTuple, TypeVar

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from pydantic import BaseModel
from strands import Agent
from strands.hooks import AfterToolCallEvent
from strands.types.exceptions import MaxTokensReachedException
from strands.types.tools import ToolResult

from config.loader import load_agent_config
from config.settings import get_settings
from infrastructure.observability.logging import configure_logging, session_id_var
from infrastructure.observability.tracing import configure_tracing
from providers.agents.strands_factory import build_agent

OutputT = TypeVar("OutputT", bound=BaseModel)
_EventT = TypeVar("_EventT")

# For plumbing that runs underneath a turn rather than as part of one - the per-agent
# logger in `create_app` is the one that reports what the agent itself did.
_logger = logging.getLogger(__name__)

# Enough to tell one call in a fan-out from the next, and not enough for a file-writing
# tool's whole payload to ride along to the browser.
_MAX_INPUT_CHARS = 200

# Last line of defense for a turn that will never finish. Tool calls run concurrently, so
# one that never returns blocks the turn - and `agent` is shared across every invocation
# this container handles, so a stuck turn makes the station refuse all later ones until it
# restarts. Deliberately far above any legitimate run (the Snowflake client alone allows
# 240s): this says "definitely broken", not "slow".
_TURN_TIMEOUT_SECONDS = 600

# Short enough that the wait reads as live rather than as a frozen page, long enough that
# a normally-streaming turn emits almost none of these.
_HEARTBEAT_SECONDS = 5


class _FinishedToolCall(NamedTuple):
    """One completed tool call, as the `AfterToolCallEvent` hook sees it."""

    tool_use_id: str
    name: str
    tool_input: dict[str, Any] | None
    result: ToolResult


def _tool_input_summary(tool_input: dict[str, Any] | None) -> dict[str, Any] | None:
    """The call's arguments with long strings clipped, or `None` if there were none.

    What makes eighteen reads of the same tool legible is *which* file each one asked
    for, so the arguments matter - but `create_or_update_file` takes an entire file as
    one of them.
    """
    if not tool_input:
        return None
    return {
        str(key): f"{value[:_MAX_INPUT_CHARS]}\u2026"
        if isinstance(value, str) and len(value) > _MAX_INPUT_CHARS
        else value
        for key, value in tool_input.items()
    }


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


def _usage_payload(result: object) -> dict[str, int] | None:
    """Token counts for the whole invocation, or `None` if the provider reported none.

    Strands accumulates these across every model call the event loop made, so this is
    what the turn cost - not what the single call that produced the artifact cost.

    All five fields travel, because with prompt caching on `inputTokens` counts only the
    *uncached* part: a turn whose whole prefix hit the cache reports single-digit input
    against a six-figure total, and dropping the cache counts makes the two irreconcilable.
    """
    metrics = getattr(result, "metrics", None)
    usage: dict[str, int] = getattr(metrics, "accumulated_usage", None) or {}
    if not usage:
        return None
    return {
        "input_tokens": usage.get("inputTokens", 0),
        "output_tokens": usage.get("outputTokens", 0),
        "cache_read_tokens": usage.get("cacheReadInputTokens", 0),
        "cache_write_tokens": usage.get("cacheWriteInputTokens", 0),
        "total_tokens": usage.get("totalTokens", 0),
    }


class _ToolUseStream:
    """Turns one `current_tool_use` delta into the events the console UI needs, if any.

    Two very different things arrive this way. A real tool call is worth announcing once,
    when it starts, and its deltas after that say nothing new. The artifact is not a call
    at all: Strands delivers structured output as a forced call to a tool named after the
    output model (`strands.tools.structured_output`), so the document is written as that
    tool's accumulating `input` and never reaches the free text stream. Each delta carries
    everything written so far, so only the unsent tail goes on the wire.
    """

    def __init__(self, draft_tool_name: str) -> None:
        """`draft_tool_name` is the output model's class name - see the class docstring."""
        self._draft_tool_name = draft_tool_name
        self._started: dict[str, str] = {}
        self._draft_use_id: str | None = None
        self._drafted = 0

    def events(self, current_tool_use: dict[str, Any]) -> list[dict[str, Any]]:
        """At most one event: the next slice of the artifact, or a tool call starting."""
        tool_use_id = current_tool_use.get("toolUseId")
        tool_name = current_tool_use.get("name")
        if tool_name == self._draft_tool_name:
            return self._draft_events(tool_use_id, current_tool_use.get("input"))
        if not tool_use_id or not tool_name or tool_use_id in self._started:
            return []
        self._started[tool_use_id] = tool_name
        return [{"tool_call": {"id": tool_use_id, "name": tool_name, "status": "running"}}]

    def drain_finished(self, finished: list[_FinishedToolCall]) -> list[dict[str, Any]]:
        """Empty `finished` into one "done" event per real tool call.

        The artifact's own call is dropped: its result is a validation acknowledgement,
        not a document, so showing it doubles up on the `result` event that follows.
        """
        events: list[dict[str, Any]] = []
        while finished:
            call = finished.pop(0)
            if call.name == self._draft_tool_name:
                continue
            # popped, not read: what stays behind is what `abandoned` has to close out
            announced = self._started.pop(call.tool_use_id, "")
            event: dict[str, Any] = {
                "id": call.tool_use_id,
                "name": call.name or announced,
                "status": "done",
                "result": _tool_result_payload(call.result),
            }
            summary = _tool_input_summary(call.tool_input)
            if summary is not None:
                event["input"] = summary
            events.append({"tool_call": event})
        return events

    def abandoned(self) -> list[dict[str, Any]]:
        """One "interrupted" event per announced call whose result never arrived.

        A call that times out inside the MCP layer, or one still in flight when the turn
        ends, never reaches the hook - and the console persists a turn's tool calls, so
        the chip goes on spinning long after the turn that started it is gone.
        """
        events = [
            {"tool_call": {"id": tool_use_id, "name": name, "status": "interrupted"}}
            for tool_use_id, name in self._started.items()
        ]
        self._started.clear()
        return events

    def _draft_events(self, use_id: str | None, partial: object) -> list[dict[str, Any]]:
        # a draft that fails validation is rewritten under a fresh tool use id, starting
        # from an empty input - so the sent offset has to restart with it
        if use_id != self._draft_use_id:
            self._draft_use_id, self._drafted = use_id, 0
        if not isinstance(partial, str) or len(partial) <= self._drafted:
            return []
        tail = partial[self._drafted :]
        self._drafted = len(partial)
        return [{"draft": tail}]


async def _with_heartbeat(
    stream: AsyncIterator[_EventT], every: float
) -> AsyncGenerator[_EventT | None, None]:
    """Relay `stream`, yielding `None` for each `every` seconds that pass without an event.

    A model call is unobservable until its first token: Strands is blocked reading the
    response body, no hook fires, and nothing can wake a consumer parked on `async for` -
    so a slow prefill and a hung turn look identical from outside. The pending item is
    polled rather than awaited through `asyncio.wait_for`, which cancels what it waits on
    and would leave the generator unusable for the rest of the turn.

    Every step is driven in one shared context. `asyncio.ensure_future` would copy the
    current context per task, and Strands holds an OpenTelemetry span attached across the
    yields in its tool loop (`tools/executors/_executor.py`) - so the span would be
    attached under one copy and detached under the next, which OTel rejects outright.
    """
    loop = asyncio.get_running_loop()
    context = contextvars.copy_context()

    async def _next() -> _EventT:
        return await anext(stream)

    def _step() -> asyncio.Task[_EventT]:
        return loop.create_task(_next(), context=context)

    pending = _step()
    try:
        while True:
            done, _ = await asyncio.wait({pending}, timeout=every)
            if not done:
                yield None
                continue
            try:
                event = pending.result()
            except StopAsyncIteration:
                return
            pending = _step()
            yield event
    finally:
        pending.cancel()


async def _model_events(
    agent: Agent,
    prompt: str,
    output_model: type[BaseModel],
    tool_uses: _ToolUseStream,
    finished: list[_FinishedToolCall],
) -> AsyncGenerator[dict[str, Any], None]:
    """Everything the console should see while the agent works, ending with its result.

    The result is yielded rather than returned so one loop covers the whole turn; the
    caller lifts it back out instead of forwarding it like the rest.
    """
    stream = agent.stream_async(prompt, structured_output_model=output_model)
    idle_since = time.monotonic()
    async for event in _with_heartbeat(stream, _HEARTBEAT_SECONDS):
        if event is None:
            waited = round(time.monotonic() - idle_since, 1)
            _logger.debug("waiting on the model for %ss", waited)
            # a tool that finished during the silence would otherwise sit here until the
            # model speaks again, leaving the console showing it as still running
            for done_event in tool_uses.drain_finished(finished):
                yield done_event
            yield {"thinking": {"seconds": waited}}
            continue
        idle_since = time.monotonic()
        # ahead of this event's own chunk/tool-use so a call that finished between
        # stream events is announced before the next one starts
        for done_event in tool_uses.drain_finished(finished):
            yield done_event
        if isinstance(event.get("data"), str):
            yield {"chunk": event["data"]}
        for tool_use_event in tool_uses.events(event.get("current_tool_use") or {}):
            yield tool_use_event
        if "result" in event:
            yield {"result": event["result"]}
    # a tool call can finish after the last model-stream event we see but before the loop
    # above exits - drain once more so its "done" event is never lost
    for done_event in tool_uses.drain_finished(finished):
        yield done_event


def _record_finished_tool_calls(agent: Agent) -> list[_FinishedToolCall]:
    """Start collecting finished tool calls off `agent`, and return the list they land in.

    Strands never yields a tool's result from `stream_async` itself - `ToolResultEvent`
    opts out of the callback stream it iterates (`is_callback_event` is False), so the
    `current_tool_use` deltas can only ever announce a call starting, never finishing.
    This hook is the only place the result is observable. Registered once against the
    agent rather than per invocation: Strands serializes invocations one at a time per
    agent instance (a second concurrent call raises `ConcurrencyException`), so a plain
    list shared by the hook and the request handler is safe without per-request
    registration - and there is no `remove_callback` to undo one anyway.
    """
    finished: list[_FinishedToolCall] = []

    def _on_after_tool_call(event: AfterToolCallEvent) -> None:
        tool_use = event.tool_use
        finished.append(
            _FinishedToolCall(
                tool_use.get("toolUseId", ""),
                tool_use.get("name", ""),
                tool_use.get("input"),
                event.result,
            )
        )

    agent.hooks.add_callback(AfterToolCallEvent, _on_after_tool_call)
    return finished


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
    finished_tool_calls = _record_finished_tool_calls(agent)

    @app.entrypoint
    async def agent_invocation(  # pyright: ignore[reportUnusedFunction]  # registered by the decorator
        payload: dict[str, Any], context: object
    ) -> AsyncGenerator[dict[str, Any], None]:
        """AgentCore Runtime HTTP contract, streaming variant.

        JSON payload/context in, an SSE stream out: `{"chunk": str}` as the model
        produces free text, `{"draft": str}` carrying the next slice of the artifact's
        JSON as it is written (see `_ToolUseStream` - the slices concatenate into one
        document, so a consumer appends rather than replaces),
        `{"tool_call": {"id", "name", "status", "result"}}` once per
        tool call (`status` is `"running"` when it starts, `"done"` with its `result`
        when it finishes, and `"interrupted"` if the turn ended without one - `id` is the
        tool use id, so a retried call gets its own pair
        instead of being confused with the first), `{"thinking": {"seconds": float}}` every
        `_HEARTBEAT_SECONDS` that pass with nothing else to send, at most one
        `{"usage": {"input_tokens", "output_tokens", "cache_read_tokens",
        "cache_write_tokens", "total_tokens"}}`, ending in exactly one `{"result": dict}`
        or `{"error": str}`. See LocalAgentClient, which is the only current consumer, for
        how these are read back out.
        """
        session_id_var.set(getattr(context, "session_id", "-"))
        prompt = payload.get("prompt", "")
        if not isinstance(prompt, str) or not prompt.strip():
            yield {"error": "'prompt' must be a non-empty string"}
            return
        # `agent` is one shared instance across every invocation this container ever
        # handles (built once, above), and _build_prompt already reconstructs full
        # grounding (predecessor artifacts + the latest message) on every call - so any
        # history Strands accumulated on a prior call is both stale and, worse, a
        # different project's data. Start every invocation from a clean slate instead of
        # letting Strands' default SlidingWindowConversationManager carry messages across
        # projects/sessions that have nothing to do with each other.
        agent.messages = []
        logger.info("invocation started")
        result = None
        tool_uses = _ToolUseStream(output_model.__name__)

        error: str | None = None
        try:
            # the clock covers the consumer's time between `yield`s too, which is fine at
            # this scale: the only reader is an SSE proxy that writes and comes straight back
            async with asyncio.timeout(_TURN_TIMEOUT_SECONDS):
                async for event in _model_events(
                    agent, prompt, output_model, tool_uses, finished_tool_calls
                ):
                    if "result" in event:
                        result = event["result"]
                        continue
                    yield event
        except TimeoutError:
            logger.exception("agent invocation timed out after %ss", _TURN_TIMEOUT_SECONDS)
            error = "agent invocation timed out"
        except MaxTokensReachedException:
            # distinct from the generic failure below: the run worked, the artifact simply
            # did not fit in `max_tokens`, and raising that for this agent is the fix
            logger.exception("agent hit its output limit mid-artifact")
            error = "the model ran out of output space before finishing the artifact"
        except Exception:
            logger.exception("agent invocation failed")
            error = "agent invocation failed"
        # whatever happened, nothing is still running once this generator is done
        for abandoned in tool_uses.abandoned():
            yield abandoned
        if error is not None:
            yield {"error": error}
            return
        if result is None or result.structured_output is None:
            logger.error("agent did not produce structured output")
            yield {"error": "agent did not produce structured output"}
            return
        # DEBUG, not INFO - the result can contain full FSD/spec content (set
        # LOG_LEVEL=DEBUG in .env to see it).
        dumped = result.structured_output.model_dump()
        logger.debug("result: %s", dumped)
        usage = _usage_payload(result)
        if usage is not None:
            logger.info("invocation used %s tokens", usage["total_tokens"])
            yield {"usage": usage}
        logger.info("invocation succeeded")
        yield {"result": dumped}

    return app
