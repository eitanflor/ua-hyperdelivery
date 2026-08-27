import json
from collections.abc import Iterator
from typing import Any, Never, cast

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.auth import CurrentUser, get_current_user
from api.main import create_app
from core.domain.project import Station
from fakes import FakeStateMachineClient, FakeTable, loaded
from infrastructure.repositories.project_repository import ProjectRepository


def _state(client: TestClient) -> Any:
    """TestClient types `.app` as a bare ASGI callable, which hides `.state`."""
    return cast(FastAPI, client.app).state


class _FakeLocalAgentClient:
    def __init__(
        self,
        result: dict[str, Any] | None = None,
        results: list[dict[str, Any]] | None = None,
        chunks: list[str] | None = None,
    ) -> None:
        self.result = result if result is not None else {"title": "FSD"}
        self._results = list(results) if results is not None else None
        self._chunks = chunks if chunks is not None else []
        self.calls: list[tuple[str, str]] = []

    def _next_result(self) -> dict[str, Any]:
        if self._results is not None:
            return self._results.pop(0) if self._results else self.result
        return self.result

    def invoke(self, agent: str, prompt: str) -> dict[str, Any]:
        self.calls.append((agent, prompt))
        return self._next_result()

    def stream(self, agent: str, prompt: str) -> Iterator[dict[str, Any]]:
        self.calls.append((agent, prompt))
        for chunk in self._chunks:
            yield {"chunk": chunk}
        yield {"result": self._next_result()}


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    # avoid create_app() reaching for real AWS credentials/table during app construction
    def fake_init(
        self: ProjectRepository,
        table_name: str,
        region: str,
        dynamodb_resource: object = None,
    ) -> None:
        self.__dict__["_table"] = FakeTable()

    monkeypatch.setattr(ProjectRepository, "__init__", fake_init)
    app = create_app()
    app.state.state_machine_client = FakeStateMachineClient()
    # sign-in is exercised separately in test_auth.py - everything else assumes an
    # already-authenticated caller, matching how the endpoint tests were written before
    # auth existed.
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(oid="test-user")
    return TestClient(app)


def test_create_and_get_project(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()

    assert created["station"] == Station.DISTILL.value

    fetched = client.get(f"/projects/{created['id']}").json()
    assert fetched == created


def test_requests_without_a_sign_in_token_are_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    # unlike `client`, this app has no get_current_user override - it exercises the
    # real dependency, so a request with no Authorization header should 401 rather
    # than reach the route handler at all.
    def fake_init(
        self: ProjectRepository,
        table_name: str,
        region: str,
        dynamodb_resource: object = None,
    ) -> None:
        self.__dict__["_table"] = FakeTable()

    monkeypatch.setattr(ProjectRepository, "__init__", fake_init)
    app = create_app()
    resp = TestClient(app).post("/projects", json={"name": "My Project"})
    assert resp.status_code == 401


def test_create_project_generates_a_name_from_a_message_when_no_name_given(
    client: TestClient,
) -> None:
    class _FakeProjectNamer:
        def generate(self, message: str) -> str:
            self.received = message
            return "Feedback Portal"

    fake_namer = _FakeProjectNamer()
    _state(client).project_namer = fake_namer

    resp = client.post("/projects", json={"message": "We want a feedback portal."})

    assert resp.status_code == 201
    assert resp.json()["name"] == "Feedback Portal"
    assert fake_namer.received == "We want a feedback portal."


def test_create_project_400s_when_neither_name_nor_message_given(client: TestClient) -> None:
    resp = client.post("/projects", json={})

    assert resp.status_code == 400


def test_get_project_404(client: TestClient) -> None:
    resp = client.get("/projects/does-not-exist")
    assert resp.status_code == 404


def test_delete_project_removes_it(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "distill", {"title": "FSD"})

    resp = client.delete(f"/projects/{created['id']}")

    assert resp.status_code == 204
    assert client.get(f"/projects/{created['id']}").status_code == 404
    assert client.get(f"/projects/{created['id']}/artifacts").json() == []


def test_delete_project_404s_for_an_unknown_project(client: TestClient) -> None:
    resp = client.delete("/projects/does-not-exist")
    assert resp.status_code == 404


def test_rename_project_updates_the_name(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "Old Name"}).json()

    resp = client.patch(f"/projects/{created['id']}", json={"name": "New Name"})

    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"
    assert client.get(f"/projects/{created['id']}").json()["name"] == "New Name"


def test_rename_project_404s_for_an_unknown_project(client: TestClient) -> None:
    resp = client.patch("/projects/does-not-exist", json={"name": "New Name"})
    assert resp.status_code == 404


def test_rename_project_400s_for_a_blank_name(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "Old Name"}).json()

    resp = client.patch(f"/projects/{created['id']}", json={"name": "   "})

    assert resp.status_code == 400


def test_decision_rejected_for_project_not_awaiting_approval(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(
        f"/projects/{created['id']}/decisions",
        json={"approved": True, "signer": "rahul"},
    )

    assert resp.status_code == 409


def test_decision_advances_station_and_appears_in_pending_list(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    project = loaded(repo.get_project(created["id"]))
    project.station = Station.BLUEPRINT_APPROVAL
    repo._table.put_item(Item=repo._state_item(project))

    pending = client.get(f"/projects/pending/{Station.BLUEPRINT_APPROVAL.value}").json()
    assert [p["id"] for p in pending] == [created["id"]]

    resp = client.post(
        f"/projects/{created['id']}/decisions",
        json={"approved": True, "signer": "rahul"},
    )

    assert resp.status_code == 200
    assert resp.json()["station"] == Station.BLUEPRINT.value


def test_create_project_starts_a_state_machine_execution(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()

    sfn: FakeStateMachineClient = _state(client).state_machine_client
    assert sfn.calls == [("start_execution", (created["id"],))]


def test_approved_decision_resumes_execution_via_task_token(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    project = loaded(repo.get_project(created["id"]))
    project.station = Station.BLUEPRINT_APPROVAL
    project.task_token = "token-123"
    repo._table.put_item(Item=repo._state_item(project))

    client.post(
        f"/projects/{created['id']}/decisions",
        json={"approved": True, "signer": "rahul"},
    )

    sfn: FakeStateMachineClient = _state(client).state_machine_client
    assert ("send_task_success", ("token-123", {"approved": True})) in sfn.calls


def test_rejected_decision_fails_execution_via_task_token(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    project = loaded(repo.get_project(created["id"]))
    project.station = Station.BLUEPRINT_APPROVAL
    project.task_token = "token-123"
    repo._table.put_item(Item=repo._state_item(project))

    client.post(
        f"/projects/{created['id']}/decisions",
        json={"approved": False, "signer": "rahul"},
    )

    sfn: FakeStateMachineClient = _state(client).state_machine_client
    assert ("send_task_failure", ("token-123", "Rejected")) in sfn.calls


def test_get_artifact_404_when_missing(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.get(f"/projects/{created['id']}/artifacts/distill")

    assert resp.status_code == 404


def test_get_artifact_returns_saved_content(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "distill", {"title": "FSD"})

    resp = client.get(f"/projects/{created['id']}/artifacts/distill")

    assert resp.status_code == 200
    body = resp.json()
    assert body["agent"] == "distill"
    assert body["content"] == {"title": "FSD"}


def test_list_artifacts_returns_all_agents_for_project(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "distill", {"title": "FSD"})
    repo.save_artifact(created["id"], "blueprint", {"title": "TDD"})

    resp = client.get(f"/projects/{created['id']}/artifacts")

    assert resp.status_code == 200
    assert {a["agent"] for a in resp.json()} == {"distill", "blueprint"}


def test_advance_invokes_the_local_agent_and_moves_to_the_next_station(client: TestClient) -> None:
    _state(client).state_machine_client = None
    fake_agent = _FakeLocalAgentClient({"title": "FSD"})
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(
        f"/projects/{created['id']}/advance",
        json={"prompt": "Users must be able to reset their password via email."},
    )

    assert resp.status_code == 200
    assert resp.json()["station"] == Station.BLUEPRINT_APPROVAL.value
    assert fake_agent.calls == [
        ("distill", "Users must be able to reset their password via email.")
    ]
    artifact = client.get(f"/projects/{created['id']}/artifacts/distill").json()
    assert artifact["content"] == {"title": "FSD"}


def test_advance_falls_back_to_a_placeholder_prompt_when_none_given(client: TestClient) -> None:
    _state(client).state_machine_client = None
    fake_agent = _FakeLocalAgentClient({"title": "FSD"})
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(f"/projects/{created['id']}/advance")

    assert resp.status_code == 200
    assert fake_agent.calls == [("distill", f"Project {created['id']}")]


def test_advance_stays_at_the_same_station_when_gaps_are_flagged(client: TestClient) -> None:
    _state(client).state_machine_client = None
    fake_agent = _FakeLocalAgentClient(
        {"title": "FSD", "completeness": {"score": 0.4, "gaps": ["no success metric given"]}}
    )
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(f"/projects/{created['id']}/advance", json={"prompt": "a vague idea"})

    assert resp.status_code == 200
    assert resp.json()["station"] == Station.DISTILL.value
    artifact = client.get(f"/projects/{created['id']}/artifacts/distill").json()
    assert artifact["content"]["completeness"]["gaps"] == ["no success metric given"]


def test_advance_supports_multiple_turns_until_gaps_are_resolved(client: TestClient) -> None:
    _state(client).state_machine_client = None
    fake_agent = _FakeLocalAgentClient(
        results=[
            {"title": "FSD", "completeness": {"score": 0.4, "gaps": ["no success metric"]}},
            {"title": "FSD", "completeness": {"score": 1.0, "gaps": []}},
        ]
    )
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()

    first = client.post(f"/projects/{created['id']}/advance", json={"prompt": "a vague idea"})
    assert first.json()["station"] == Station.DISTILL.value

    second = client.post(
        f"/projects/{created['id']}/advance",
        json={"prompt": "success measure: 90% triaged within 24h"},
    )
    assert second.json()["station"] == Station.BLUEPRINT_APPROVAL.value
    assert len(fake_agent.calls) == 2


def test_advance_409s_when_a_state_machine_is_configured(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(f"/projects/{created['id']}/advance")

    assert resp.status_code == 409


def test_advance_409s_when_not_at_an_agent_station(client: TestClient) -> None:
    _state(client).state_machine_client = None
    _state(client).local_agent_client = _FakeLocalAgentClient()
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    project = loaded(repo.get_project(created["id"]))
    project.station = Station.BLUEPRINT_APPROVAL
    repo._table.put_item(Item=repo._state_item(project))

    resp = client.post(f"/projects/{created['id']}/advance")

    assert resp.status_code == 409


def _parse_sse(text: str) -> list[dict[str, Any]]:
    lines = text.split("\n\n")
    return [json.loads(line[len("data: ") :]) for line in lines if line.startswith("data: ")]


def test_advance_stream_yields_chunks_then_a_done_event(client: TestClient) -> None:
    _state(client).state_machine_client = None
    fake_agent = _FakeLocalAgentClient({"title": "FSD"}, chunks=["Analyzing", "..."])
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(
        f"/projects/{created['id']}/advance/stream",
        json={"prompt": "Users must be able to reset their password via email."},
    )

    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    assert events[:2] == [{"chunk": "Analyzing"}, {"chunk": "..."}]
    assert events[-1]["done"] is True
    assert events[-1]["project"]["station"] == Station.BLUEPRINT_APPROVAL.value
    artifact = client.get(f"/projects/{created['id']}/artifacts/distill").json()
    assert artifact["content"] == {"title": "FSD"}


def test_advance_stream_stays_at_the_same_station_when_gaps_are_flagged(client: TestClient) -> None:
    _state(client).state_machine_client = None
    fake_agent = _FakeLocalAgentClient(
        {"title": "FSD", "completeness": {"score": 0.4, "gaps": ["no success metric given"]}}
    )
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(f"/projects/{created['id']}/advance/stream", json={"prompt": "a vague idea"})

    events = _parse_sse(resp.text)
    assert events[-1]["project"]["station"] == Station.DISTILL.value


def test_advance_stream_surfaces_agent_errors_as_an_sse_event(client: TestClient) -> None:
    _state(client).state_machine_client = None

    class _FailingAgentClient:
        def stream(self, agent: str, prompt: str) -> Iterator[dict[str, Any]]:
            yield {"chunk": "Analyzing"}
            yield {"error": "agent invocation failed"}

    _state(client).local_agent_client = _FailingAgentClient()
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(f"/projects/{created['id']}/advance/stream")

    events = _parse_sse(resp.text)
    assert events == [{"chunk": "Analyzing"}, {"error": "agent invocation failed"}]


def test_advance_stream_surfaces_persistence_errors_as_an_sse_event(client: TestClient) -> None:
    # a real bug this caught live: an exception saving the artifact/advancing the
    # station (e.g. the AWS session expiring) happened *after* the agent stream
    # itself succeeded, outside the original try/except - it crashed the generator
    # uncaught, which just breaks the HTTP connection instead of a clean SSE error.
    _state(client).state_machine_client = None
    _state(client).local_agent_client = _FakeLocalAgentClient({"title": "FSD"})
    created = client.post("/projects", json={"name": "My Project"}).json()

    def _boom(*args: object, **kwargs: object) -> Never:
        raise RuntimeError("token expired")

    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact = _boom

    resp = client.post(f"/projects/{created['id']}/advance/stream")

    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    assert events[-1] == {"error": "token expired"}


def test_advance_stream_409s_when_a_state_machine_is_configured(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(f"/projects/{created['id']}/advance/stream")

    assert resp.status_code == 409


def test_advance_stream_409s_when_not_at_an_agent_station(client: TestClient) -> None:
    _state(client).state_machine_client = None
    _state(client).local_agent_client = _FakeLocalAgentClient()
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    project = loaded(repo.get_project(created["id"]))
    project.station = Station.BLUEPRINT_APPROVAL
    repo._table.put_item(Item=repo._state_item(project))

    resp = client.post(f"/projects/{created['id']}/advance/stream")

    assert resp.status_code == 409
