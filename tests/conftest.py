"""Shared pytest fixtures.

`tests/` is on the pytest `pythonpath`, so shared doubles live in `tests/fakes.py` and are
imported directly rather than smuggled through fixtures.
"""

from collections.abc import Iterator
from typing import TYPE_CHECKING, cast

import pytest

from config.settings import get_settings
from fakes import FakeDynamoResource, FakeTable

if TYPE_CHECKING:
    from mypy_boto3_dynamodb.service_resource import DynamoDBServiceResource


@pytest.fixture(autouse=True)
def _reset_settings_cache() -> Iterator[None]:
    """Drop the `get_settings` lru_cache around every test.

    Without this, the first test to read settings pins them for the whole session and any
    later test that patches the environment silently gets the stale object.
    """
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def fake_table() -> FakeTable:
    """An empty in-memory projects table."""
    return FakeTable()


@pytest.fixture
def fake_dynamodb(fake_table: FakeTable) -> "DynamoDBServiceResource":
    """A DynamoDB service resource backed by `fake_table`.

    Cast once here so individual tests don't each need to explain that a structural double
    stands in for boto3's concrete stub type.
    """
    return cast("DynamoDBServiceResource", FakeDynamoResource(fake_table))
