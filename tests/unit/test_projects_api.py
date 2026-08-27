from typing import Any, cast

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.main import create_app
from core.domain.project import Station
from fakes import FakeStateMachineClient, FakeTable, loaded
from infrastructure.repositories.project_repository import ProjectRepository


def _state(client: TestClient) -> Any:
    """TestClient types `.app` as a bare ASGI callable, which hides `.state`."""
    return cast(FastAPI, client.app).state


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
    return TestClient(app)


def test_create_and_get_project(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()

    assert created["station"] == Station.DISTILL.value

    fetched = client.get(f"/projects/{created['id']}").json()
    assert fetched == created


def test_get_project_404(client: TestClient) -> None:
    resp = client.get("/projects/does-not-exist")
    assert resp.status_code == 404


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
