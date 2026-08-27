"""Tests for the shared AgentCore Runtime composition root.

All four agents route their HTTP contract through `create_app`, so its error handling is
the single place a bad prompt or a failed model call is turned into a response.
"""

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
    """Stands in for a strands Agent: records the prompt, returns a canned result."""

    def __init__(self, result: _Result | None = None, error: Exception | None = None) -> None:
        self._result = result
        self._error = error
        self.calls: list[str] = []

    def __call__(self, prompt: str, structured_output_model: type[BaseModel]) -> _Result:
        self.calls.append(prompt)
        if self._error is not None:
            raise self._error
        assert self._result is not None
        return self._result


@pytest.fixture
def stub_agent(monkeypatch: pytest.MonkeyPatch) -> _StubAgent:
    agent = _StubAgent(_Result(_Output(value="ok")))

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


def test_returns_the_validated_structured_output(invoke: Any, stub_agent: _StubAgent) -> None:
    assert invoke({"prompt": "do the thing"}, None) == {"result": {"value": "ok"}}
    assert stub_agent.calls == ["do the thing"]


@pytest.mark.parametrize("payload", [{}, {"prompt": ""}, {"prompt": "   "}, {"prompt": 7}])
def test_rejects_a_missing_or_blank_prompt(
    invoke: Any, stub_agent: _StubAgent, payload: dict[str, Any]
) -> None:
    assert invoke(payload, None) == {"error": "'prompt' must be a non-empty string"}
    assert stub_agent.calls == []


def test_reports_an_error_when_the_agent_raises(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    monkeypatch.setattr(stub_agent, "_error", RuntimeError("bedrock exploded"))

    assert invoke({"prompt": "do the thing"}, None) == {"error": "agent invocation failed"}


def test_reports_an_error_when_no_structured_output_is_produced(
    monkeypatch: pytest.MonkeyPatch, invoke: Any, stub_agent: _StubAgent
) -> None:
    monkeypatch.setattr(stub_agent, "_result", _Result(None))

    assert invoke({"prompt": "do the thing"}, None) == {
        "error": "agent did not produce structured output"
    }


def test_session_id_from_context_reaches_the_log_filter(invoke: Any) -> None:
    class _Context:
        session_id = "session-abc"

    invoke({"prompt": "do the thing"}, _Context())

    assert factory.session_id_var.get() == "session-abc"
