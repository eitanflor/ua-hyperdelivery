import json

import pytest

from orchestration.agent_invoker import AgentInvoker


class _StreamingBody:
    def __init__(self, data: bytes):
        self._data = data

    def read(self) -> bytes:
        return self._data


class _FakeControlClient:
    def __init__(self, runtimes: list[dict]):
        self._runtimes = runtimes

    def list_agent_runtimes(self):
        return {"agentRuntimes": self._runtimes}


class _FakeDataClient:
    def __init__(self, response_body: dict):
        self._response_body = response_body
        self.last_call: dict | None = None

    def invoke_agent_runtime(self, **kwargs):
        self.last_call = kwargs
        return {"response": _StreamingBody(json.dumps(self._response_body).encode())}


class _FakeClients:
    def __init__(self, control, data):
        self._control = control
        self._data = data

    def client(self, service_name: str, region_name: str):
        return {"bedrock-agentcore-control": self._control, "bedrock-agentcore": self._data}[
            service_name
        ]


@pytest.fixture
def runtimes() -> list[dict]:
    return [
        {"agentRuntimeName": "hyperdelivery_distill", "agentRuntimeArn": "arn:distill"},
        {"agentRuntimeName": "hyperdelivery_blueprint", "agentRuntimeArn": "arn:blueprint"},
    ]


def test_invoke_resolves_runtime_by_name_and_returns_result(runtimes):
    data_client = _FakeDataClient({"result": {"fsd": "..."}})
    invoker = AgentInvoker(
        region="us-east-1",
        runtime_prefix="hyperdelivery_",
        clients=_FakeClients(_FakeControlClient(runtimes), data_client),
    )

    result = invoker.invoke("distill", "p1", "do the thing")

    assert result == {"fsd": "..."}
    assert data_client.last_call["agentRuntimeArn"] == "arn:distill"
    assert data_client.last_call["runtimeSessionId"] == "p1".ljust(33, "0")


def test_invoke_raises_when_agent_returns_error(runtimes):
    data_client = _FakeDataClient({"error": "boom"})
    invoker = AgentInvoker(
        region="us-east-1",
        runtime_prefix="hyperdelivery_",
        clients=_FakeClients(_FakeControlClient(runtimes), data_client),
    )

    with pytest.raises(RuntimeError, match="boom"):
        invoker.invoke("distill", "p1", "do the thing")


def test_invoke_raises_when_runtime_not_found(runtimes):
    invoker = AgentInvoker(
        region="us-east-1",
        runtime_prefix="hyperdelivery_",
        clients=_FakeClients(_FakeControlClient(runtimes), _FakeDataClient({})),
    )

    with pytest.raises(ValueError, match="hyperdelivery_review"):
        invoker.invoke("review", "p1", "do the thing")
