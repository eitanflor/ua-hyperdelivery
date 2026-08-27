import pytest
from fastapi.testclient import TestClient

from api.main import create_app
from core.domain.project import Station
from infrastructure.repositories.project_repository import ProjectRepository


class _FakeTable:
    """In-memory stand-in for a boto3 DynamoDB Table resource, matching the subset of the
    API ProjectRepository uses (put_item/get_item/query with a single GSI)."""

    def __init__(self):
        self.items: dict[tuple[str, str], dict] = {}

    def put_item(self, Item: dict):
        self.items[(Item["pk"], Item["sk"])] = Item

    def get_item(self, Key: dict):
        item = self.items.get((Key["pk"], Key["sk"]))
        return {"Item": item} if item else {}

    def query(self, IndexName: str, KeyConditionExpression: str, ExpressionAttributeValues: dict):
        target = ExpressionAttributeValues[":pk"]
        matches = [item for item in self.items.values() if item.get("gsi1pk") == target]
        return {"Items": matches}


class _FakeStateMachineClient:
    def __init__(self):
        self.calls: list[tuple[str, tuple]] = []

    def start_execution(self, project_id: str) -> None:
        self.calls.append(("start_execution", (project_id,)))

    def send_task_success(self, task_token: str, output: dict) -> None:
        self.calls.append(("send_task_success", (task_token, output)))

    def send_task_failure(self, task_token: str, error: str) -> None:
        self.calls.append(("send_task_failure", (task_token, error)))


@pytest.fixture
def client(monkeypatch) -> TestClient:
    # avoid create_app() reaching for real AWS credentials/table during app construction
    monkeypatch.setattr(
        ProjectRepository,
        "__init__",
        lambda self, table_name, region, dynamodb_resource=None: self.__dict__.update(
            {"_table": _FakeTable()}
        ),
    )
    app = create_app()
    app.state.state_machine_client = _FakeStateMachineClient()
    return TestClient(app)


def test_create_and_get_project(client: TestClient):
    created = client.post("/projects", json={"name": "My Project"}).json()

    assert created["station"] == Station.DISTILL.value

    fetched = client.get(f"/projects/{created['id']}").json()
    assert fetched == created


def test_get_project_404(client: TestClient):
    resp = client.get("/projects/does-not-exist")
    assert resp.status_code == 404


def test_decision_rejected_for_project_not_awaiting_approval(client: TestClient):
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(
        f"/projects/{created['id']}/decisions",
        json={"approved": True, "signer": "rahul"},
    )

    assert resp.status_code == 409


def test_decision_advances_station_and_appears_in_pending_list(client: TestClient):
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = client.app.state.project_repository
    project = repo.get_project(created["id"])
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


def test_create_project_starts_a_state_machine_execution(client: TestClient):
    created = client.post("/projects", json={"name": "My Project"}).json()

    sfn: _FakeStateMachineClient = client.app.state.state_machine_client
    assert sfn.calls == [("start_execution", (created["id"],))]


def test_approved_decision_resumes_execution_via_task_token(client: TestClient):
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = client.app.state.project_repository
    project = repo.get_project(created["id"])
    project.station = Station.BLUEPRINT_APPROVAL
    project.task_token = "token-123"
    repo._table.put_item(Item=repo._state_item(project))

    client.post(
        f"/projects/{created['id']}/decisions",
        json={"approved": True, "signer": "rahul"},
    )

    sfn: _FakeStateMachineClient = client.app.state.state_machine_client
    assert ("send_task_success", ("token-123", {"approved": True})) in sfn.calls


def test_rejected_decision_fails_execution_via_task_token(client: TestClient):
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = client.app.state.project_repository
    project = repo.get_project(created["id"])
    project.station = Station.BLUEPRINT_APPROVAL
    project.task_token = "token-123"
    repo._table.put_item(Item=repo._state_item(project))

    client.post(
        f"/projects/{created['id']}/decisions",
        json={"approved": False, "signer": "rahul"},
    )

    sfn: _FakeStateMachineClient = client.app.state.state_machine_client
    assert ("send_task_failure", ("token-123", "Rejected")) in sfn.calls
