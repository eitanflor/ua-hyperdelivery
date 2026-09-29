import json
from collections.abc import Iterator
from typing import TYPE_CHECKING, Any

import pytest
from botocore.exceptions import ClientError

from fakes import FakeBotoClients, complete_spec_content
from infrastructure.repositories.connections_repository import ConnectionsRepository
from infrastructure.repositories.project_repository import ProjectRepository
from orchestration import agent_invoker
from orchestration.agent_invoker import AgentInvoker

if TYPE_CHECKING:
    from mypy_boto3_dynamodb.service_resource import DynamoDBServiceResource


class _StreamingBody:
    def __init__(self, data: bytes) -> None:
        self._data = data

    def iter_lines(self) -> Iterator[bytes]:
        yield from self._data.splitlines()


class _FakeControlClient:
    def __init__(self, runtimes: list[dict[str, Any]]) -> None:
        self._runtimes = runtimes

    def list_agent_runtimes(self) -> dict[str, Any]:
        return {"agentRuntimes": self._runtimes}


class _FakeDataClient:
    def __init__(self, events: list[dict[str, Any]]) -> None:
        self._events = events
        self.last_call: dict[str, Any] = {}

    def invoke_agent_runtime(self, **kwargs: Any) -> dict[str, Any]:
        self.last_call = kwargs
        body = "".join(f"data: {json.dumps(event)}\n\n" for event in self._events)
        return {"response": _StreamingBody(body.encode())}


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
    # A real invocation streams a chunk/usage event ahead of the closing result - a fake
    # that only ever sent one event would miss a body parsed as a single JSON document
    # instead of an SSE stream.
    data_client = _FakeDataClient([{"chunk": "working on it"}, {"result": {"fsd": "..."}}])
    invoker = _invoker(_FakeControlClient(runtimes), data_client)

    outcome = invoker.invoke("distill", "p1", "do the thing")

    assert outcome == {"status": "drafted", "result": {"fsd": "..."}}
    assert data_client.last_call["agentRuntimeArn"] == "arn:distill"
    assert data_client.last_call["runtimeSessionId"] == "p1".ljust(33, "0")
    assert json.loads(data_client.last_call["payload"])["project_id"] == "p1"


def test_invoke_raises_when_agent_returns_error(runtimes: list[dict[str, Any]]) -> None:
    invoker = _invoker(_FakeControlClient(runtimes), _FakeDataClient([{"error": "boom"}]))

    with pytest.raises(RuntimeError, match="boom"):
        invoker.invoke("distill", "p1", "do the thing")


def test_invoke_raises_when_runtime_not_found(runtimes: list[dict[str, Any]]) -> None:
    invoker = _invoker(_FakeControlClient(runtimes), _FakeDataClient([]))

    with pytest.raises(ValueError, match="hyperdelivery_review"):
        invoker.invoke("review", "p1", "do the thing")


def test_invoke_returns_questions_when_distill_asks_instead_of_drafting(
    runtimes: list[dict[str, Any]],
) -> None:
    # config/agents/distill.yaml deliberately prefers ask_clarifying_questions over a
    # placeholder draft - the state machine loops back on this instead of failing.
    tool_call = {
        "id": "t1",
        "name": "ask_clarifying_questions",
        "status": "done",
        "result": {"questions": [{"id": "q1", "question": "Who approves?"}]},
    }
    invoker = _invoker(_FakeControlClient(runtimes), _FakeDataClient([{"tool_call": tool_call}]))

    outcome = invoker.invoke("distill", "p1", "do the thing")

    assert outcome == {
        "status": "questions",
        "questions": [{"id": "q1", "question": "Who approves?"}],
    }


def test_invoke_returns_chat_when_the_turn_has_no_tool_call_at_all(
    runtimes: list[dict[str, Any]],
) -> None:
    # A bare greeting: no draft, no clarifying-question tool call either - still a
    # legitimate outcome (create_app.py), not a failure.
    invoker = _invoker(_FakeControlClient(runtimes), _FakeDataClient([{"chunk": "hi"}]))

    outcome = invoker.invoke("distill", "p1", "do the thing")

    assert outcome == {"status": "chat", "message": "hi"}


def test_invoke_broadcasts_every_event_except_the_final_result(
    runtimes: list[dict[str, Any]],
) -> None:
    # The final `result` event carries the whole drafted artifact - the console UI
    # already fetches that separately once `done` arrives, so it must not go out twice.
    running_tool = {"id": "t1", "name": "get_context", "status": "running"}
    finished_tool = {**running_tool, "status": "done", "result": {"context": "UA"}}
    events = [
        {"chunk": "working"},
        {"tool_call": running_tool},
        {"tool_call": finished_tool},
        {"draft": '{"a"'},
        {"result": {"a": 1}},
    ]
    invoker = _invoker(_FakeControlClient(runtimes), _FakeDataClient(events))
    broadcast_calls: list[dict[str, Any]] = []

    invoker.invoke("distill", "p1", "do the thing", broadcast=broadcast_calls.append)

    assert broadcast_calls == [
        {"chunk": "working"},
        {"tool_call": running_tool},
        {"tool_call": finished_tool},
        {"draft": '{"a"'},
        {"done": True},
    ]


def test_invoke_broadcasts_the_error_before_raising(runtimes: list[dict[str, Any]]) -> None:
    invoker = _invoker(_FakeControlClient(runtimes), _FakeDataClient([{"error": "boom"}]))
    broadcast_calls: list[dict[str, Any]] = []

    with pytest.raises(RuntimeError, match="boom"):
        invoker.invoke("distill", "p1", "do the thing", broadcast=broadcast_calls.append)

    assert broadcast_calls == [{"error": "boom"}]


def test_invoke_with_no_broadcast_behaves_exactly_as_before(
    runtimes: list[dict[str, Any]],
) -> None:
    # broadcast is an optional side effect - omitting it must not change the outcome.
    invoker = _invoker(
        _FakeControlClient(runtimes), _FakeDataClient([{"chunk": "hi"}, {"result": {"a": 1}}])
    )

    outcome = invoker.invoke("distill", "p1", "do the thing")

    assert outcome == {"status": "drafted", "result": {"a": 1}}


def test_score_result_overwrites_self_reported_completeness(
    fake_dynamodb: "DynamoDBServiceResource",
) -> None:
    repo = ProjectRepository(
        table_name="projects",
        region="us-east-1",
        dynamodb_resource=fake_dynamodb,
    )
    repo.save_artifact("p1", "distill", complete_spec_content())
    result = {
        "title": "Incomplete blueprint",
        "completeness": {"score": 1.0, "gaps": []},
    }

    scored = agent_invoker._score_result(repo, "p1", "blueprint", result)

    assert scored["completeness"]["score"] == 0.0
    assert scored["completeness"]["gaps"]


class _FakeManagementClient:
    def __init__(self, gone_connections: set[str] | None = None) -> None:
        self.posted: list[tuple[str, bytes]] = []
        self._gone = gone_connections or set()

    def post_to_connection(self, ConnectionId: str, Data: bytes) -> None:
        if ConnectionId in self._gone:
            error_response: Any = {
                "Error": {"Code": "GoneException", "Message": "gone"},
                "ResponseMetadata": {"HTTPStatusCode": 410},
            }
            raise ClientError(error_response, "PostToConnection")
        self.posted.append((ConnectionId, Data))


def _client_factory(management: _FakeManagementClient) -> Any:
    """A typed stand-in for `boto3.client(...)` that always hands back `management`."""

    def client(service_name: str, endpoint_url: str | None = None) -> _FakeManagementClient:
        return management

    return client


def _patch_connections(
    monkeypatch: pytest.MonkeyPatch, watchers: dict[str, list[str]]
) -> list[str]:
    def fake_init(self: ConnectionsRepository, table_name: str, region: str) -> None:
        pass

    def fake_connections_for_project(self: ConnectionsRepository, project_id: str) -> list[str]:
        return list(watchers.get(project_id, []))

    disconnected: list[str] = []

    def fake_disconnect(self: ConnectionsRepository, connection_id: str) -> None:
        disconnected.append(connection_id)

    monkeypatch.setattr(ConnectionsRepository, "__init__", fake_init)
    monkeypatch.setattr(
        ConnectionsRepository, "connections_for_project", fake_connections_for_project
    )
    monkeypatch.setattr(ConnectionsRepository, "disconnect", fake_disconnect)
    monkeypatch.setenv("CONNECTIONS_TABLE", "hyperdelivery-ws-connections")
    monkeypatch.setenv("AWS_REGION", "us-east-1")
    return disconnected


def test_broadcaster_returns_none_when_no_websocket_endpoint_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("WEBSOCKET_ENDPOINT", raising=False)

    assert agent_invoker._broadcaster("p1") is None


def test_broadcaster_returns_none_when_nobody_is_watching(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("WEBSOCKET_ENDPOINT", "https://ws.example.com/live")
    _patch_connections(monkeypatch, watchers={})

    assert agent_invoker._broadcaster("p1") is None


def test_broadcaster_does_not_retry_a_connection_that_registers_after_the_lookup(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # The lookup is looked up exactly once, up front - a connection that only shows up
    # afterward (e.g. a slow $connect) is never picked up mid-invocation. This is what
    # closes the bug where a long-running invocation whose own connection later goes
    # stale (410) would otherwise "adopt" a brand-new connection meant for an unrelated,
    # later turn on the same project.
    monkeypatch.setenv("WEBSOCKET_ENDPOINT", "https://ws.example.com/live")
    watchers: dict[str, list[str]] = {}
    _patch_connections(monkeypatch, watchers=watchers)

    broadcast = agent_invoker._broadcaster("p1")
    assert broadcast is None

    watchers["p1"] = ["conn-1"]  # a connection registers after the lookup already ran
    # nothing left to call broadcast on - _broadcaster already returned None for this
    # invocation, and does not get a second chance to notice conn-1.


def test_broadcaster_posts_the_event_to_every_watching_connection(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("WEBSOCKET_ENDPOINT", "https://ws.example.com/live")
    _patch_connections(monkeypatch, watchers={"p1": ["conn-1", "conn-2"]})
    management = _FakeManagementClient()
    monkeypatch.setattr(agent_invoker.boto3, "client", _client_factory(management))

    broadcast = agent_invoker._broadcaster("p1")
    assert broadcast is not None
    broadcast({"chunk": "hi"})

    assert [c for c, _ in management.posted] == ["conn-1", "conn-2"]
    assert json.loads(management.posted[0][1]) == {"chunk": "hi"}


def test_broadcaster_drops_a_gone_connection_without_raising(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("WEBSOCKET_ENDPOINT", "https://ws.example.com/live")
    disconnected = _patch_connections(monkeypatch, watchers={"p1": ["conn-1", "conn-2"]})
    management = _FakeManagementClient(gone_connections={"conn-1"})
    monkeypatch.setattr(agent_invoker.boto3, "client", _client_factory(management))

    broadcast = agent_invoker._broadcaster("p1")
    assert broadcast is not None
    broadcast({"chunk": "hi"})
    broadcast({"chunk": "again"})  # the dropped connection must not be retried

    assert disconnected == ["conn-1"]
    assert [c for c, _ in management.posted] == ["conn-2", "conn-2"]


def test_invoke_hands_every_event_to_on_event_including_the_result(
    runtimes: list[dict[str, Any]],
) -> None:
    # unlike broadcast, the turn record wants the whole stream - the handler decides what to keep
    events = [{"chunk": "hi"}, {"usage": {"total_tokens": 3}}, {"result": {"a": 1}}]
    invoker = _invoker(_FakeControlClient(runtimes), _FakeDataClient(events))
    seen: list[dict[str, Any]] = []

    invoker.invoke("distill", "p1", "do the thing", on_event=seen.append)

    assert seen == events
