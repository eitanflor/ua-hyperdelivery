"""Tests for the shared AgentCore Runtime composition root.

All four agents route their HTTP contract through `create_app`, so its error handling is
the single place a bad prompt or a failed model call is turned into a response. The
entrypoint is a streaming async generator (see factory.py's docstring) - these tests
drain it into a list of events rather than asserting on a single return value.
"""

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


class _StubAgent:
    """Stands in for a strands Agent: records the prompt, streams canned events."""

    def __init__(
        self,
        events: list[dict[str, Any]] | None = None,
        error: Exception | None = None,
    ) -> None:
        self._events = events if events is not None else [{"result": _Result(_Output(value="ok"))}]
        self._error = error
        self.calls: list[str] = []

    async def stream_async(
        self, prompt: str, structured_output_model: type[BaseModel]
    ) -> AsyncIterator[dict[str, Any]]:
        self.calls.append(prompt)
        if self._error is not None:
            raise self._error
        for event in self._events:
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
    # to tool calls with no free "data" text at all.
    monkeypatch.setattr(
        stub_agent,
        "_events",
        [
            {"current_tool_use": {"name": "score_completeness"}},
            {"current_tool_use": {"name": "score_completeness"}},
            {"current_tool_use": {"name": "StructuredSpec"}},
            {"result": _Result(_Output(value="ok"))},
        ],
    )

    events = await _drain(invoke({"prompt": "do the thing"}, None))

    assert events == [
        {"chunk": "Using score_completeness...\n"},
        {"chunk": "Using StructuredSpec...\n"},
        {"result": {"value": "ok"}},
    ]


async def test_session_id_from_context_reaches_the_log_filter(invoke: Any) -> None:
    class _Context:
        session_id = "session-abc"

    await _drain(invoke({"prompt": "do the thing"}, _Context()))

    assert factory.session_id_var.get() == "session-abc"
