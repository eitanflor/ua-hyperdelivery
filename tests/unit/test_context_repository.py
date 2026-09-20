from typing import TYPE_CHECKING

import pytest

from infrastructure.repositories.context_repository import ContextRepository

if TYPE_CHECKING:
    from mypy_boto3_dynamodb.service_resource import DynamoDBServiceResource


@pytest.fixture
def repo(fake_dynamodb: "DynamoDBServiceResource") -> ContextRepository:
    return ContextRepository(
        table_name="hyperdelivery-dev-projects",
        region="us-east-1",
        dynamodb_resource=fake_dynamodb,
    )


def test_get_context_is_empty_before_anything_is_set(repo: ContextRepository) -> None:
    context = repo.get_context()

    assert context.context == ""
    assert context.updated_by is None
    assert context.updated_at is None


def test_set_context_stamps_the_author_and_time(repo: ContextRepository) -> None:
    updated = repo.set_context("Repo: org/repo. DB: Postgres.", "rahul@example.com")

    assert updated.context == "Repo: org/repo. DB: Postgres."
    assert updated.updated_by == "rahul@example.com"
    assert updated.updated_at is not None
    fetched = repo.get_context()
    assert fetched.context == "Repo: org/repo. DB: Postgres."
    assert fetched.updated_by == "rahul@example.com"
