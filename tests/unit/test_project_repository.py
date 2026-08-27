import pytest

from core.domain.project import Station
from infrastructure.repositories.project_repository import ProjectRepository


class _FakeTable:
    """In-memory stand-in for a boto3 DynamoDB Table resource - mirrors the subset of the
    API this repository uses (put_item/get_item/query with a single GSI)."""

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


class _FakeResource:
    def __init__(self, table: _FakeTable):
        self._table = table

    def Table(self, name: str):
        return self._table


@pytest.fixture
def repo() -> ProjectRepository:
    return ProjectRepository(
        table_name="hyperdelivery-projects",
        region="ap-southeast-2",
        dynamodb_resource=_FakeResource(_FakeTable()),
    )


def test_create_project_starts_at_distill(repo: ProjectRepository):
    project = repo.create_project("p1", "My Project")

    assert project.station == Station.DISTILL
    assert repo.get_project("p1") == project


def test_get_project_returns_none_when_missing(repo: ProjectRepository):
    assert repo.get_project("missing") is None


def test_list_pending_finds_projects_awaiting_approval(repo: ProjectRepository):
    repo.create_project("p1", "Project One")
    # force into an approval station to exercise the GSI write/query path
    project = repo.get_project("p1")
    project.station = Station.BLUEPRINT_APPROVAL
    repo._table.put_item(Item=repo._state_item(project))

    pending = repo.list_pending(Station.BLUEPRINT_APPROVAL)

    assert [p.id for p in pending] == ["p1"]


def test_record_decision_approved_advances_to_next_station(repo: ProjectRepository):
    repo.create_project("p1", "Project One")
    project = repo.get_project("p1")
    project.station = Station.BLUEPRINT_APPROVAL
    repo._table.put_item(Item=repo._state_item(project))

    repo.record_decision(
        project_id="p1",
        station=Station.BLUEPRINT_APPROVAL,
        approved=True,
        signer="rahul",
        comment=None,
    )

    assert repo.get_project("p1").station == Station.BLUEPRINT


def test_record_decision_rejected_stays_at_same_station(repo: ProjectRepository):
    repo.create_project("p1", "Project One")
    project = repo.get_project("p1")
    project.station = Station.REVIEW_APPROVAL
    repo._table.put_item(Item=repo._state_item(project))

    repo.record_decision(
        project_id="p1",
        station=Station.REVIEW_APPROVAL,
        approved=False,
        signer="rahul",
        comment="needs more work",
    )

    assert repo.get_project("p1").station == Station.REVIEW_APPROVAL


def test_record_decision_raises_for_unknown_project(repo: ProjectRepository):
    with pytest.raises(ValueError, match="unknown project"):
        repo.record_decision(
            project_id="ghost",
            station=Station.REVIEW_APPROVAL,
            approved=True,
            signer="rahul",
            comment=None,
        )
