"""Tests for the shared AgentCore Runtime composition root.

All four agents route their HTTP contract through `create_app`, so its error handling is
the single place a bad prompt or a failed model call is turned into a response. The
entrypoint is a streaming async generator (see factory.py's docstring) - these tests
drain it into a list of events rather than asserting on a single return value.
"""

import json
from collections.abc import AsyncGenerator, AsyncIterator
from typing import Any

import pytest
from pydantic import BaseModel

from agent_runtime import factory
from core.constants import AgentName
from core.domain.agent_config import AgentConfig


class _Output(BaseModel):
    value: str


class _Result:
    def __init__(self, structured_output: _Output | None) -> None:
        self.structured_output = structured_output


class _FakeAfterToolCallEvent:
    """Duck-types strands' real `AfterToolCallEvent` - factory.py only reads these two."""

    def __init__(self, tool_use: dict[str, Any], result: dict[str, Any]) -> None:
        self.tool_use = tool_use
        self.result = result


def _after_tool_call(
    tool_use_id: str, name: str, payload: dict[str, Any]
) -> _FakeAfterToolCallEvent:
    """A finished tool call, shaped like the real `ToolResult` `_tool_result_payload` parses."""
    return _FakeAfterToolCallEvent(
        tool_use={"toolUseId": tool_use_id, "name": name},
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

    async def stream_async(
        self, prompt: str, structured_output_model: type[BaseModel]
    ) -> AsyncIterator[dict[str, Any]]:
        self.calls.append(prompt)
        if self._error is not None:
            raise self._error
        for event in self._events:
            if isinstance(event, _FakeAfterToolCallEvent):
                for callback in self.hooks.callbacks:
                    callback(event)
                continue
            yield event


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


async def _drain(events: AsyncGenerator[dict[str, Any], None]) -> list[dict[str, Any]]:
    return [event async for event in events]


async def test_returns_the_validated_structured_output(invoke: Any, stub_agent: _StubAgent) -> None:
    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [{"result": {"value": "ok"}}]
    assert stub_agent.calls == ["do the thing"]


async def test_resets_the_shared_agent_s_message_history_before_each_invocation(
    invoke: Any, stub_agent: _StubAgent
) -> None:
    # `agent` is one shared instance across every invocation this container ever
    # handles - a prior call's (or a different project's) history must not leak in.
    stub_agent.messages = ["leftover from an unrelated project"]

    await _drain(invoke({"prompt": "do the thing"}, None))

    assert stub_agent.messages == []


@pytest.mark.parametrize("payload", [{}, {"prompt": ""}, {"prompt": "   "}, {"prompt": 7}])
async def test_rejects_a_missing_or_blank_prompt(
    invoke: Any, stub_agent: _StubAgent, payload: dict[str, Any]
) -> None:
    events = await _drain(invoke(payload, None))

    assert events == [{"error": "'prompt' must be a non-empty string"}]
    assert stub_agent.calls == []


async def test_reports_an_error_when_the_agent_raises(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    monkeypatch.setattr(stub_agent, "_error", RuntimeError("bedrock exploded"))

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [{"error": "agent invocation failed"}]


async def test_reports_an_error_when_no_structured_output_is_produced(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    monkeypatch.setattr(stub_agent, "_events", [{"result": _Result(None)}])

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [{"error": "agent did not produce structured output"}]


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


async def test_session_id_from_context_reaches_the_log_filter(invoke: Any) -> None:
    class _Context:
        session_id = "session-abc"

    await _drain(invoke({"prompt": "do the thing"}, _Context()))

    assert factory.session_id_var.get() == "session-abc"
