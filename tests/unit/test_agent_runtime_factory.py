"""Tests for the shared AgentCore Runtime composition root.

All four agents route their HTTP contract through `create_app`, so its error handling is
the single place a bad prompt or a failed model call is turned into a response. The
entrypoint is a streaming async generator (see factory.py's docstring) - these tests
drain it into a list of events rather than asserting on a single return value.
"""

import asyncio
import contextvars
import json
from collections.abc import AsyncGenerator, AsyncIterator
from typing import Any

import pytest
from pydantic import BaseModel
from strands.types.exceptions import MaxTokensReachedException
from strands.types.tools import ToolResult

from agent_runtime import factory
from core.constants import AgentName
from core.domain.agent_config import AgentConfig

# Stands in for the OpenTelemetry span context Strands attaches around its tool loop.
_SPAN: contextvars.ContextVar[int] = contextvars.ContextVar("span", default=0)


class _Output(BaseModel):
    value: str


class _Result:
    def __init__(
        self, structured_output: _Output | None, usage: dict[str, int] | None = None
    ) -> None:
        self.structured_output = structured_output
        self.metrics = _Metrics(usage) if usage is not None else None


class _Metrics:
    """Duck-types strands' `EventLoopMetrics` - factory.py only reads accumulated_usage."""

    def __init__(self, accumulated_usage: dict[str, int]) -> None:
        self.accumulated_usage = accumulated_usage


class _FakeAfterToolCallEvent:
    """Duck-types strands' real `AfterToolCallEvent` - factory.py only reads these two."""

    def __init__(self, tool_use: dict[str, Any], result: dict[str, Any]) -> None:
        self.tool_use = tool_use
        self.result = result


def _after_tool_call(
    tool_use_id: str, name: str, payload: object, tool_input: dict[str, Any] | None = None
) -> _FakeAfterToolCallEvent:
    """A finished tool call, shaped like the real `ToolResult` `_tool_result_payload` parses."""
    tool_use: dict[str, Any] = {"toolUseId": tool_use_id, "name": name}
    if tool_input is not None:
        tool_use["input"] = tool_input
    return _FakeAfterToolCallEvent(
        tool_use=tool_use,
        result={
            "toolUseId": tool_use_id,
            "status": "success",
            "content": [{"text": json.dumps(payload)}],
        },
    )


class _FakeHookRegistry:
    """Stands in for `agent.hooks`: records callbacks so a test can fire one directly."""

    def __init__(self) -> None:
        self.callbacks: list[Any] = []

    def add_callback(self, event_type: type, callback: Any) -> None:
        self.callbacks.append(callback)


class _StubAgent:
    """Stands in for a strands Agent: records the prompt, streams canned events.

    A `_FakeAfterToolCallEvent` in `events` isn't yielded - like the real
    `AfterToolCallEvent`, it only ever reaches `factory.py` through the hooks callback
    registered on `.hooks`, never through `stream_async`'s own yielded events.
    """

    def __init__(
        self,
        events: list[dict[str, Any] | _FakeAfterToolCallEvent] | None = None,
        error: Exception | None = None,
    ) -> None:
        self._events = events if events is not None else [{"result": _Result(_Output(value="ok"))}]
        self._error = error
        self.calls: list[str] = []
        self.hooks = _FakeHookRegistry()
        self.messages: list[Any] = []
        self.delay = 0.0

    async def stream_async(
        self, prompt: str, structured_output_model: type[BaseModel]
    ) -> AsyncIterator[dict[str, Any]]:
        self.calls.append(prompt)
        if self._error is not None:
            raise self._error
        for event in self._events:
            await asyncio.sleep(self.delay)
            if isinstance(event, _FakeAfterToolCallEvent):
                for callback in self.hooks.callbacks:
                    callback(event)
                continue
            # Strands keeps an OpenTelemetry span attached across the yields in its tool
            # loop, so a token set here is reset on the *next* step of this generator.
            # Drive those steps in different contexts and the reset raises.
            token = _SPAN.set(id(event))
            yield event
            _SPAN.reset(token)


@pytest.fixture
def stub_agent(monkeypatch: pytest.MonkeyPatch) -> _StubAgent:
    agent = _StubAgent()

    def fake_load_agent_config(name: str) -> AgentConfig:
        return AgentConfig(name=name, model_id="m", system_prompt="p")

    def fake_build_agent(
        config: AgentConfig, region_name: str, tools: list[Any] | None
    ) -> _StubAgent:
        return agent

    monkeypatch.setattr(factory, "load_agent_config", fake_load_agent_config)
    monkeypatch.setattr(factory, "build_agent", fake_build_agent)
    return agent


@pytest.fixture
def invoke(stub_agent: _StubAgent, monkeypatch: pytest.MonkeyPatch) -> Any:
    captured: dict[str, Any] = {}

    class _StubApp:
        def entrypoint(self, fn: Any) -> Any:
            captured["fn"] = fn
            return fn

    monkeypatch.setattr(factory, "BedrockAgentCoreApp", _StubApp)
    factory.create_app(AgentName.DISTILL, _Output)
    return captured["fn"]


@pytest.fixture
def voluntary_invoke(stub_agent: _StubAgent, monkeypatch: pytest.MonkeyPatch) -> Any:
    """Same as `invoke`, but with `force_structured_output=False` - Distill's real mode."""
    captured: dict[str, Any] = {}

    class _StubApp:
        def entrypoint(self, fn: Any) -> Any:
            captured["fn"] = fn
            return fn

    monkeypatch.setattr(factory, "BedrockAgentCoreApp", _StubApp)
    factory.create_app(AgentName.DISTILL, _Output, force_structured_output=False)
    return captured["fn"]


async def _drain(events: AsyncGenerator[dict[str, Any], None]) -> list[dict[str, Any]]:
    return [event async for event in events]


async def test_returns_the_validated_structured_output(invoke: Any, stub_agent: _StubAgent) -> None:
    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [{"result": {"value": "ok"}}]
    assert stub_agent.calls == ["do the thing"]


async def test_concurrent_invocations_use_independent_agents(
    monkeypatch: pytest.MonkeyPatch, stub_agent: _StubAgent
) -> None:
    other_agent = _StubAgent(events=[{"result": _Result(_Output(value="other"))}])
    agents = iter([stub_agent, other_agent])

    def fake_build_agent(
        config: AgentConfig, region_name: str, tools: list[Any] | None
    ) -> _StubAgent:
        return next(agents)

    monkeypatch.setattr(factory, "build_agent", fake_build_agent)
    captured: dict[str, Any] = {}

    class _StubApp:
        def entrypoint(self, fn: Any) -> Any:
            captured["fn"] = fn
            return fn

    monkeypatch.setattr(factory, "BedrockAgentCoreApp", _StubApp)
    factory.create_app(AgentName.DISTILL, _Output)
    invocation = captured["fn"]

    first, second = await asyncio.gather(
        _drain(invocation({"prompt": "first"}, None)),
        _drain(invocation({"prompt": "second"}, None)),
    )

    assert first == [{"result": {"value": "ok"}}]
    assert second == [{"result": {"value": "other"}}]
    assert stub_agent.calls == ["first"]
    assert other_agent.calls == ["second"]


async def test_voluntary_draft_succeeds_without_forcing_structured_output(
    voluntary_invoke: Any, stub_agent: _StubAgent
) -> None:
    # the model's own tool call wraps its one Pydantic-typed parameter, unlike the
    # Strands-forced path where the fields arrive at the top level - see
    # `factory._unwrap_single_param`
    stub_agent._events = [  # pyright: ignore[reportPrivateUsage]  # arranging the stub's script
        _after_tool_call("call-1", "_Output", {}, tool_input={"draft": {"value": "ok"}}),
        {"result": _Result(None)},
    ]

    events = await _drain(voluntary_invoke({"prompt": "draft it"}, None))

    assert {"result": {"value": "ok"}} in events


async def test_voluntary_turn_with_no_draft_ends_cleanly(
    voluntary_invoke: Any, stub_agent: _StubAgent
) -> None:
    # a bare greeting or a clarifying-question turn is a valid outcome, not a failure - it
    # must not be reported as an error, nor forced to produce an empty artifact
    stub_agent._events = [{"result": _Result(None)}]  # pyright: ignore[reportPrivateUsage]

    events = await _drain(voluntary_invoke({"prompt": "hi"}, None))

    assert not any("error" in event for event in events)
    assert not any("result" in event for event in events)


async def test_reports_that_it_is_waiting_while_the_model_produces_nothing(
    invoke: Any, stub_agent: _StubAgent, monkeypatch: pytest.MonkeyPatch
) -> None:
    # a model working through a large context emits nothing until its first token, which
    # from outside is indistinguishable from a hung turn
    monkeypatch.setattr(factory, "_HEARTBEAT_SECONDS", 0.01)
    stub_agent.delay = 0.05

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert [event["thinking"]["seconds"] for event in events if "thinking" in event]
    assert events[-1] == {"result": {"value": "ok"}}


async def test_announces_a_tool_that_finished_while_the_model_was_silent(
    invoke: Any, stub_agent: _StubAgent, monkeypatch: pytest.MonkeyPatch
) -> None:
    # a finished call left not drained until the model speaks again shows in the console as
    # still running - which is exactly when someone is staring at it wondering if it hung
    monkeypatch.setattr(factory, "_HEARTBEAT_SECONDS", 0.01)
    stub_agent.delay = 0.05
    stub_agent._events = [  # pyright: ignore[reportPrivateUsage]  # arranging the stub's script
        _after_tool_call("call-1", "s3_get_document_text", {"ok": True}),
        {"result": _Result(_Output(value="ok"))},
    ]

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    announced = next(i for i, event in enumerate(events) if "tool_call" in event)
    assert any(i > announced for i, event in enumerate(events) if "thinking" in event)


async def test_project_context_is_scoped_to_the_invocation(
    invoke: Any, stub_agent: _StubAgent
) -> None:
    async def reads_project_context(
        prompt: str, structured_output_model: type[BaseModel]
    ) -> AsyncIterator[dict[str, Any]]:
        yield {"result": _Result(_Output(value=f"project::{factory.project_id_var.get()}"))}

    stub_agent.stream_async = reads_project_context

    events = await _drain(invoke({"prompt": "do the thing", "project_id": "project-123"}, None))

    assert events == [{"result": {"value": "project::project-123"}}]
    assert factory.project_id_var.get() is None


@pytest.mark.parametrize("payload", [{}, {"prompt": ""}, {"prompt": "   "}, {"prompt": 7}])
async def test_rejects_a_missing_or_blank_prompt(
    invoke: Any, stub_agent: _StubAgent, payload: dict[str, Any]
) -> None:
    events = await _drain(invoke(payload, None))

    assert events == [{"error": "'prompt' must be a non-empty string", "code": "invalid_prompt"}]
    assert stub_agent.calls == []


async def test_reports_an_error_when_the_agent_raises(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    monkeypatch.setattr(stub_agent, "_error", RuntimeError("bedrock exploded"))

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [{"error": "agent invocation failed", "code": "agent_failed"}]


async def test_says_so_when_the_artifact_outgrew_the_output_limit(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    # worth telling apart from a generic failure: nothing went wrong, the artifact just
    # did not fit in max_tokens, and raising it for that agent is the fix
    monkeypatch.setattr(stub_agent, "_error", MaxTokensReachedException("truncated"))

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [
        {
            "error": "the model ran out of output space before finishing the artifact",
            "code": "agent_output_limit",
        }
    ]


async def test_reports_an_error_when_no_structured_output_is_produced(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    monkeypatch.setattr(stub_agent, "_events", [{"result": _Result(None)}])

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [
        {"error": "agent did not produce structured output", "code": "agent_no_result"}
    ]


async def test_gives_up_on_a_turn_that_will_never_finish(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    # a tool call that never returns blocks the whole turn, and the agent instance is
    # shared - without this the station refuses every later invocation until it restarts
    monkeypatch.setattr(factory, "_TURN_TIMEOUT_SECONDS", 0.01)

    async def never_finishes(prompt: str, structured_output_model: type[BaseModel]) -> Any:
        await asyncio.sleep(10)
        yield {"result": _Result(_Output(value="ok"))}

    monkeypatch.setattr(stub_agent, "stream_async", never_finishes)

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [{"error": "agent invocation timed out", "code": "agent_timeout"}]


async def test_streams_free_text_chunks_before_the_result(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    monkeypatch.setattr(
        stub_agent,
        "_events",
        [{"data": "Analyzing"}, {"data": "..."}, {"result": _Result(_Output(value="ok"))}],
    )

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [
        {"chunk": "Analyzing"},
        {"chunk": "..."},
        {"result": {"value": "ok"}},
    ]


async def test_reports_the_turn_s_token_usage_before_the_result(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    # cache counts travel too: with prompt caching on, inputTokens is only the uncached
    # part, so without them a turn reads as "8 in" against a six-figure total
    result = _Result(
        _Output(value="ok"),
        usage={
            "inputTokens": 8,
            "outputTokens": 6113,
            "cacheReadInputTokens": 110000,
            "cacheWriteInputTokens": 2379,
            "totalTokens": 118500,
        },
    )
    monkeypatch.setattr(stub_agent, "_events", [{"result": result}])

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [
        {
            "usage": {
                "input_tokens": 8,
                "output_tokens": 6113,
                "cache_read_tokens": 110000,
                "cache_write_tokens": 2379,
                "total_tokens": 118500,
            }
        },
        {"result": {"value": "ok"}},
    ]


async def test_omits_usage_when_the_provider_reports_none(invoke: Any) -> None:
    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [{"result": {"value": "ok"}}]


async def test_announces_each_tool_once_when_no_free_text_is_produced(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    # Distill (and any agent forced into structured_output_model) mostly goes straight
    # to tool calls with no free "data" text at all. A tool call streams several
    # `current_tool_use` deltas (one per input token) before it actually finishes -
    # only the first delta (which carries the tool use id) should announce it. Its
    # result only ever reaches factory.py through the `AfterToolCallEvent` hook (see
    # `_FakeAfterToolCallEvent`), never through a stream event.
    monkeypatch.setattr(
        stub_agent,
        "_events",
        [
            {"current_tool_use": {"toolUseId": "t1", "name": "score_completeness"}},
            {"current_tool_use": {"toolUseId": "t1", "name": "score_completeness"}},
            _after_tool_call("t1", "score_completeness", {"score": 1.0, "gaps": []}),
            {"result": _Result(_Output(value="ok"))},
        ],
    )

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [
        {"tool_call": {"id": "t1", "name": "score_completeness", "status": "running"}},
        {
            "tool_call": {
                "id": "t1",
                "name": "score_completeness",
                "status": "done",
                "result": {"score": 1.0, "gaps": []},
            }
        },
        {"result": {"value": "ok"}},
    ]


async def test_streams_partial_tool_results_under_the_original_call_id(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    tool_use = {"toolUseId": "t1", "name": "snowflake_query"}
    monkeypatch.setattr(
        stub_agent,
        "_events",
        [
            {"current_tool_use": tool_use},
            {"tool_stream_event": {"tool_use": tool_use, "data": "first block"}},
            {"tool_stream_event": {"tool_use": tool_use, "data": "first block\nsecond block"}},
            _after_tool_call("t1", "snowflake_query", "first block\nsecond block"),
            {"result": _Result(_Output(value="ok"))},
        ],
    )

    events = await _drain(invoke({"prompt": "query Snowflake"}, None))

    assert events == [
        {"tool_call": {"id": "t1", "name": "snowflake_query", "status": "running"}},
        {
            "tool_call": {
                "id": "t1",
                "name": "snowflake_query",
                "status": "running",
                "result": "first block",
            }
        },
        {
            "tool_call": {
                "id": "t1",
                "name": "snowflake_query",
                "status": "running",
                "result": "first block\nsecond block",
            }
        },
        {
            "tool_call": {
                "id": "t1",
                "name": "snowflake_query",
                "status": "done",
                "result": "first block\nsecond block",
            }
        },
        {"result": {"value": "ok"}},
    ]


async def test_drains_a_tool_result_that_finishes_after_the_last_stream_event(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    # The hook can fire after the loop has already consumed the final stream event (e.g.
    # a tool called for cleanup around the model's very last turn) - the post-loop drain
    # is the only thing that would still surface it.
    monkeypatch.setattr(
        stub_agent,
        "_events",
        [
            {"current_tool_use": {"toolUseId": "t1", "name": "score_completeness"}},
            {"result": _Result(_Output(value="ok"))},
            _after_tool_call("t1", "score_completeness", {"score": 1.0, "gaps": []}),
        ],
    )

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [
        {"tool_call": {"id": "t1", "name": "score_completeness", "status": "running"}},
        {
            "tool_call": {
                "id": "t1",
                "name": "score_completeness",
                "status": "done",
                "result": {"score": 1.0, "gaps": []},
            }
        },
        {"result": {"value": "ok"}},
    ]


async def test_announces_a_repeat_call_of_the_same_tool_separately(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    # e.g. Blueprint/Review/Showroom's "fix any issues and call it again" retry loop -
    # a second real invocation of the same tool must get its own running/done pair,
    # keyed by tool use id rather than name.
    monkeypatch.setattr(
        stub_agent,
        "_events",
        [
            {"current_tool_use": {"toolUseId": "t1", "name": "validate_units_of_work"}},
            _after_tool_call("t1", "validate_units_of_work", {"valid": False, "issues": ["bad"]}),
            {"current_tool_use": {"toolUseId": "t2", "name": "validate_units_of_work"}},
            _after_tool_call("t2", "validate_units_of_work", {"valid": True, "issues": []}),
            {"result": _Result(_Output(value="ok"))},
        ],
    )

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [
        {"tool_call": {"id": "t1", "name": "validate_units_of_work", "status": "running"}},
        {
            "tool_call": {
                "id": "t1",
                "name": "validate_units_of_work",
                "status": "done",
                "result": {"valid": False, "issues": ["bad"]},
            }
        },
        {"tool_call": {"id": "t2", "name": "validate_units_of_work", "status": "running"}},
        {
            "tool_call": {
                "id": "t2",
                "name": "validate_units_of_work",
                "status": "done",
                "result": {"valid": True, "issues": []},
            }
        },
        {"result": {"value": "ok"}},
    ]


def _draft(tool_use_id: str, partial: str) -> dict[str, Any]:
    """One delta of the structured-output tool call, whose input accumulates as it streams."""
    return {
        "current_tool_use": {"toolUseId": tool_use_id, "name": _Output.__name__, "input": partial}
    }


async def test_streams_the_artifact_as_the_agent_writes_it(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    # the artifact is written as input to a tool named after the output model, so without
    # singling it out the whole document arrives as one silent tool call. Each event
    # carries the input accumulated so far - only the new suffix should be streamed.
    monkeypatch.setattr(
        stub_agent,
        "_events",
        [
            _draft("t1", '{"value"'),
            _draft("t1", '{"value": "o'),
            _draft("t1", '{"value": "ok"}'),
            {"result": _Result(_Output(value="ok"))},
        ],
    )

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [
        {"draft": '{"value"'},
        {"draft": ': "o'},
        {"draft": 'k"}'},
        {"result": {"value": "ok"}},
    ]


async def test_restarts_the_draft_when_a_rejected_artifact_is_rewritten(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    # a draft that fails validation is rewritten under a fresh tool use id, starting from
    # an empty input - carrying the first attempt's offset over would truncate the second
    monkeypatch.setattr(
        stub_agent,
        "_events",
        [
            _draft("t1", '{"value": "bad"}'),
            _draft("t2", '{"val'),
            _draft("t2", '{"value": "ok"}'),
            {"result": _Result(_Output(value="ok"))},
        ],
    )

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [
        {"draft": '{"value": "bad"}'},
        {"draft": '{"val'},
        {"draft": 'ue": "ok"}'},
        {"result": {"value": "ok"}},
    ]


async def test_does_not_show_the_draft_tool_s_validation_result_as_a_tool_call(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    monkeypatch.setattr(
        stub_agent,
        "_events",
        [
            _draft("t1", '{"value": "ok"}'),
            _after_tool_call("t1", _Output.__name__, {"ok": True}),
            {"result": _Result(_Output(value="ok"))},
        ],
    )

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [{"draft": '{"value": "ok"}'}, {"result": {"value": "ok"}}]


async def test_reports_which_arguments_a_finished_tool_was_called_with(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    # eighteen reads of the same tool are only legible if each says which file it asked for
    monkeypatch.setattr(
        stub_agent,
        "_events",
        [
            _after_tool_call("t1", "get_file_contents", {"ok": True}, {"path": "src/api/main.py"}),
            {"result": _Result(_Output(value="ok"))},
        ],
    )

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events[0]["tool_call"]["input"] == {"path": "src/api/main.py"}


async def test_reports_a_tool_that_errored_as_failed_not_done(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    # Strands returns an errored call as a normal result; a lookup that failed must not
    # read as one that succeeded, or the console shows a green tick beside an error message
    failed = _after_tool_call("t1", "get_file_contents", "404 Not Found")
    failed.result["status"] = "error"
    monkeypatch.setattr(stub_agent, "_events", [failed, {"result": _Result(_Output(value="ok"))}])

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events[0]["tool_call"]["status"] == "failed"
    assert events[0]["tool_call"]["result"] == "404 Not Found"


async def test_clips_a_long_tool_argument_instead_of_sending_the_whole_file(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    # create_or_update_file takes an entire file as an argument - the console needs the
    # path next to the call, not the payload
    monkeypatch.setattr(
        stub_agent,
        "_events",
        [
            _after_tool_call(
                "t1", "create_or_update_file", {"ok": True}, {"path": "a.py", "content": "x" * 500}
            ),
            {"result": _Result(_Output(value="ok"))},
        ],
    )

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    sent = events[0]["tool_call"]["input"]
    assert sent["path"] == "a.py"
    assert sent["content"] == "x" * 200 + "\u2026"


async def test_closes_out_a_tool_call_that_never_reported_a_result(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    # create_pull_request_with_copilot can time out inside the MCP layer, so its hook
    # never fires - and the console persists a turn's tool calls, so the chip would go on
    # spinning long after the turn that started it is gone
    monkeypatch.setattr(
        stub_agent,
        "_events",
        [
            {"current_tool_use": {"toolUseId": "t1", "name": "create_pull_request_with_copilot"}},
            {"result": _Result(_Output(value="ok"))},
        ],
    )

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [
        {
            "tool_call": {
                "id": "t1",
                "name": "create_pull_request_with_copilot",
                "status": "running",
            }
        },
        {
            "tool_call": {
                "id": "t1",
                "name": "create_pull_request_with_copilot",
                "status": "interrupted",
            }
        },
        {"result": {"value": "ok"}},
    ]


async def test_closes_out_a_running_tool_call_when_the_turn_fails(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    class _FailsMidCall:
        async def __call__(self, prompt: str, structured_output_model: type[BaseModel]) -> Any:
            yield {"current_tool_use": {"toolUseId": "t1", "name": "search_code"}}
            error = "bedrock exploded"
            raise RuntimeError(error)

    monkeypatch.setattr(stub_agent, "stream_async", _FailsMidCall())

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [
        {"tool_call": {"id": "t1", "name": "search_code", "status": "running"}},
        {"tool_call": {"id": "t1", "name": "search_code", "status": "interrupted"}},
        {"error": "agent invocation failed", "code": "agent_failed"},
    ]


async def test_session_id_from_context_reaches_the_log_filter(invoke: Any) -> None:
    class _Context:
        session_id = "session-abc"

    await _drain(invoke({"prompt": "do the thing"}, _Context()))

    assert factory.session_id_var.get() == "session-abc"


def test_tool_result_payload_decodes_a_single_json_block() -> None:
    result: ToolResult = {
        "toolUseId": "t1",
        "status": "success",
        "content": [{"text": '{"ok": true}'}],
    }

    assert factory._tool_result_payload(result) == {"ok": True}  # pyright: ignore[reportPrivateUsage]


def test_tool_result_payload_falls_back_to_raw_text_for_non_json() -> None:
    result: ToolResult = {
        "toolUseId": "t1",
        "status": "success",
        "content": [{"text": "plain text"}],
    }

    assert factory._tool_result_payload(result) == "plain text"  # pyright: ignore[reportPrivateUsage]


def test_tool_result_payload_joins_every_block_instead_of_only_the_first() -> None:
    # GitHub's get_file_contents returns a short status block followed by the file's
    # own content as a second block - stopping at the first would hide the file itself
    result: ToolResult = {
        "toolUseId": "t1",
        "status": "success",
        "content": [
            {"text": "successfully downloaded text file (SHA: abc123)"},
            {"text": "def hello():\n    return 1\n"},
        ],
    }

    payload = factory._tool_result_payload(result)  # pyright: ignore[reportPrivateUsage]

    assert (
        payload == "successfully downloaded text file (SHA: abc123)\n\ndef hello():\n    return 1\n"
    )


def test_tool_result_payload_is_none_with_no_text_blocks() -> None:
    result: ToolResult = {
        "toolUseId": "t1",
        "status": "success",
        "content": [{"image": {"format": "png", "source": {"bytes": b""}}}],
    }

    assert factory._tool_result_payload(result) is None  # pyright: ignore[reportPrivateUsage]
