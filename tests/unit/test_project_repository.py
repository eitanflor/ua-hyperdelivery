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
        table_name="hyperdelivery-dev-projects",
        region="us-east-1",
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


def test_list_projects_returns_every_project_most_recently_updated_first(
    repo: ProjectRepository,
) -> None:
    repo.create_project("p1", "Project One")
    repo.create_project("p2", "Project Two")
    repo.rename_project("p1", "Project One Renamed")  # bumps p1's updated_at past p2's

    assert [p.id for p in repo.list_projects()] == ["p1", "p2"]


def test_list_projects_excludes_artifacts_and_decisions(repo: ProjectRepository) -> None:
    repo.create_project("p1", "Project One")
    repo.save_artifact("p1", "distill", {"title": "FSD"})
    repo.record_decision(
        project_id="p1",
        station=Station.DISTILL,
        approved=True,
        signer="rahul",
        comment=None,
    )

    assert [p.id for p in repo.list_projects()] == ["p1"]


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


def test_record_decision_rejected_returns_to_the_reviewing_agent(repo: ProjectRepository) -> None:
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

    assert loaded(repo.get_project("p1")).station == Station.BLUEPRINT


def test_record_decision_raises_for_unknown_project(repo: ProjectRepository) -> None:
    with pytest.raises(ValueError, match="unknown project"):
        repo.record_decision(
            project_id="ghost",
            station=Station.REVIEW_APPROVAL,
            approved=True,
            signer="rahul",
            comment=None,
        )


def test_advance_after_artifact_moves_to_the_next_station(repo: ProjectRepository) -> None:
    repo.create_project("p1", "Project One")

    updated = repo.advance_after_artifact("p1", "distill")

    assert updated.station == Station.BLUEPRINT_APPROVAL
    assert loaded(repo.get_project("p1")).station == Station.BLUEPRINT_APPROVAL


def test_advance_after_artifact_raises_when_not_at_that_station(repo: ProjectRepository) -> None:
    repo.create_project("p1", "Project One")

    with pytest.raises(ValueError, match="not at blueprint"):
        repo.advance_after_artifact("p1", "blueprint")


def test_advance_after_artifact_raises_for_unknown_project(repo: ProjectRepository) -> None:
    with pytest.raises(ValueError, match="unknown project"):
        repo.advance_after_artifact("ghost", "distill")


def test_save_and_get_artifact_round_trips_content(repo: ProjectRepository) -> None:
    repo.create_project("p1", "Project One")

    saved = repo.save_artifact("p1", "distill", {"title": "FSD", "score": 0.8})

    fetched = repo.get_artifact("p1", "distill")
    assert fetched is not None
    assert fetched.content == {"title": "FSD", "score": 0.8}
    assert fetched.created_at == saved.created_at


def test_get_artifact_returns_none_when_missing(repo: ProjectRepository) -> None:
    assert repo.get_artifact("p1", "distill") is None


def test_list_artifacts_returns_only_this_projects_artifacts(repo: ProjectRepository) -> None:
    repo.create_project("p1", "Project One")
    repo.create_project("p2", "Project Two")
    repo.save_artifact("p1", "distill", {"title": "FSD"})
    repo.save_artifact("p1", "blueprint", {"title": "TDD"})
    repo.save_artifact("p2", "distill", {"title": "Other project's FSD"})

    artifacts = repo.list_artifacts("p1")

    assert {a.agent for a in artifacts} == {"distill", "blueprint"}
    assert all(a.project_id == "p1" for a in artifacts)


def test_save_artifact_increments_version_on_rerun(repo: ProjectRepository) -> None:
    repo.create_project("p1", "Project One")

    first = repo.save_artifact("p1", "distill", {"title": "FSD v1"})
    second = repo.save_artifact("p1", "distill", {"title": "FSD v2"})

    assert (first.version, second.version) == (1, 2)
    latest = repo.get_artifact("p1", "distill")
    assert latest is not None
    assert (latest.version, latest.content) == (2, {"title": "FSD v2"})


def test_list_artifact_versions_returns_full_history_oldest_first(
    repo: ProjectRepository,
) -> None:
    repo.create_project("p1", "Project One")
    repo.save_artifact("p1", "distill", {"title": "FSD v1"})
    repo.save_artifact("p1", "distill", {"title": "FSD v2"})

    versions = repo.list_artifact_versions("p1", "distill")

    assert [(v.version, v.content["title"]) for v in versions] == [
        (1, "FSD v1"),
        (2, "FSD v2"),
    ]


def test_list_artifacts_excludes_historical_versions(repo: ProjectRepository) -> None:
    repo.create_project("p1", "Project One")
    repo.save_artifact("p1", "distill", {"title": "FSD v1"})
    repo.save_artifact("p1", "distill", {"title": "FSD v2"})

    assert [a.agent for a in repo.list_artifacts("p1")] == ["distill"]


def test_delete_project_removes_state_artifacts_and_decisions(repo: ProjectRepository) -> None:
    repo.create_project("p1", "Project One")
    repo.save_artifact("p1", "distill", {"title": "FSD"})
    repo.record_decision(
        project_id="p1", station=Station.BLUEPRINT_APPROVAL, approved=True, signer="a", comment=None
    )

    repo.delete_project("p1")

    assert repo.get_project("p1") is None
    assert repo.list_artifacts("p1") == []


def test_delete_project_does_not_affect_other_projects(repo: ProjectRepository) -> None:
    repo.create_project("p1", "Project One")
    repo.create_project("p2", "Project Two")

    repo.delete_project("p1")

    assert repo.get_project("p1") is None
    assert repo.get_project("p2") is not None


def test_delete_project_is_a_no_op_for_an_unknown_project(repo: ProjectRepository) -> None:
    repo.delete_project("ghost")  # should not raise


def test_rename_project_updates_the_name(repo: ProjectRepository) -> None:
    repo.create_project("p1", "Old Name")

    updated = repo.rename_project("p1", "New Name")

    assert updated.name == "New Name"
    assert loaded(repo.get_project("p1")).name == "New Name"


def test_rename_project_raises_for_an_unknown_project(repo: ProjectRepository) -> None:
    with pytest.raises(ValueError, match="unknown project"):
        repo.rename_project("ghost", "New Name")
