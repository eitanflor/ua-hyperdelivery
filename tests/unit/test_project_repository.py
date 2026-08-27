from typing import TYPE_CHECKING

import pytest

from core.domain.project import Station
from fakes import loaded
from infrastructure.repositories.project_repository import ProjectRepository

if TYPE_CHECKING:
    from mypy_boto3_dynamodb.service_resource import DynamoDBServiceResource


@pytest.fixture
def repo(fake_dynamodb: "DynamoDBServiceResource") -> ProjectRepository:
    return ProjectRepository(
        table_name="hyperdelivery-projects",
        region="ap-southeast-2",
        dynamodb_resource=fake_dynamodb,
    )


def test_create_project_starts_at_distill(repo: ProjectRepository) -> None:
    project = repo.create_project("p1", "My Project")

    assert project.station == Station.DISTILL
    assert repo.get_project("p1") == project


def test_get_project_returns_none_when_missing(repo: ProjectRepository) -> None:
    assert repo.get_project("missing") is None


def test_list_pending_finds_projects_awaiting_approval(repo: ProjectRepository) -> None:
    repo.create_project("p1", "Project One")
    # force into an approval station to exercise the GSI write/query path
    project = loaded(repo.get_project("p1"))
    project.station = Station.BLUEPRINT_APPROVAL
    repo._table.put_item(Item=repo._state_item(project))

    pending = repo.list_pending(Station.BLUEPRINT_APPROVAL)

    assert [p.id for p in pending] == ["p1"]


def test_record_decision_approved_advances_to_next_station(repo: ProjectRepository) -> None:
    repo.create_project("p1", "Project One")
    project = loaded(repo.get_project("p1"))
    project.station = Station.BLUEPRINT_APPROVAL
    repo._table.put_item(Item=repo._state_item(project))

    repo.record_decision(
        project_id="p1",
        station=Station.BLUEPRINT_APPROVAL,
        approved=True,
        signer="rahul",
        comment=None,
    )

    assert loaded(repo.get_project("p1")).station == Station.BLUEPRINT


def test_record_decision_rejected_stays_at_same_station(repo: ProjectRepository) -> None:
    repo.create_project("p1", "Project One")
    project = loaded(repo.get_project("p1"))
    project.station = Station.REVIEW_APPROVAL
    repo._table.put_item(Item=repo._state_item(project))

    repo.record_decision(
        project_id="p1",
        station=Station.REVIEW_APPROVAL,
        approved=False,
        signer="rahul",
        comment="needs more work",
    )

    assert loaded(repo.get_project("p1")).station == Station.REVIEW_APPROVAL


def test_record_decision_raises_for_unknown_project(repo: ProjectRepository) -> None:
    with pytest.raises(ValueError, match="unknown project"):
        repo.record_decision(
            project_id="ghost",
            station=Station.REVIEW_APPROVAL,
            approved=True,
            signer="rahul",
            comment=None,
        )
