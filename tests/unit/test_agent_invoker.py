import json
from typing import Any

import pytest

from fakes import FakeBotoClients
from orchestration.agent_invoker import AgentInvoker


class _StreamingBody:
    def __init__(self, data: bytes) -> None:
        self._data = data

    def read(self) -> bytes:
        return self._data


class _FakeControlClient:
    def __init__(self, runtimes: list[dict[str, Any]]) -> None:
        self._runtimes = runtimes

    def list_agent_runtimes(self) -> dict[str, Any]:
        return {"agentRuntimes": self._runtimes}


class _FakeDataClient:
    def __init__(self, response_body: dict[str, Any]) -> None:
        self._response_body = response_body
        self.last_call: dict[str, Any] = {}

    def invoke_agent_runtime(self, **kwargs: Any) -> dict[str, Any]:
        self.last_call = kwargs
        return {"response": _StreamingBody(json.dumps(self._response_body).encode())}


def _invoker(control: _FakeControlClient, data: _FakeDataClient) -> AgentInvoker:
    return AgentInvoker(
        region="us-east-1",
        runtime_prefix="hyperdelivery_",
        clients=FakeBotoClients(
            clients={"bedrock-agentcore-control": control, "bedrock-agentcore": data}
        ),
    )


@pytest.fixture
def runtimes() -> list[dict[str, Any]]:
    return [
        {"agentRuntimeName": "hyperdelivery_distill", "agentRuntimeArn": "arn:distill"},
        {"agentRuntimeName": "hyperdelivery_blueprint", "agentRuntimeArn": "arn:blueprint"},
    ]


def test_invoke_resolves_runtime_by_name_and_returns_result(
    runtimes: list[dict[str, Any]],
) -> None:
    data_client = _FakeDataClient({"result": {"fsd": "..."}})
    invoker = _invoker(_FakeControlClient(runtimes), data_client)

    result = invoker.invoke("distill", "p1", "do the thing")

    assert result == {"fsd": "..."}
    assert data_client.last_call["agentRuntimeArn"] == "arn:distill"
    assert data_client.last_call["runtimeSessionId"] == "p1".ljust(33, "0")


def test_invoke_raises_when_agent_returns_error(runtimes: list[dict[str, Any]]) -> None:
    invoker = _invoker(_FakeControlClient(runtimes), _FakeDataClient({"error": "boom"}))

    with pytest.raises(RuntimeError, match="boom"):
        invoker.invoke("distill", "p1", "do the thing")


def test_invoke_raises_when_runtime_not_found(runtimes: list[dict[str, Any]]) -> None:
    invoker = _invoker(_FakeControlClient(runtimes), _FakeDataClient({}))

    with pytest.raises(ValueError, match="hyperdelivery_review"):
        invoker.invoke("review", "p1", "do the thing")
