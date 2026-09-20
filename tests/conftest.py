"""Shared pytest fixtures.

`tests/` is on the pytest `pythonpath`, so shared doubles live in `tests/fakes.py` and are
imported directly rather than smuggled through fixtures.
"""

from collections.abc import Iterator
from typing import TYPE_CHECKING, cast

import pytest

from config.settings import Settings, get_settings
from fakes import FakeDynamoResource, FakeTable

if TYPE_CHECKING:
    from mypy_boto3_dynamodb.service_resource import DynamoDBServiceResource


@pytest.fixture(autouse=True)
def _reset_settings_cache(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Drop the `get_settings` lru_cache around every test, and never read the real `.env`.

    Without the cache-clear, the first test to read settings pins them for the whole
    session. Blanking `env_file` isn't enough on its own: pydantic-settings reads real
    OS environment variables too, and takes them over the env file - so a developer's
    own local-only settings (e.g. `PREVIEW_CHECKOUT_PATH` for the laptop-demo preview,
    exported into the shell by `make dev-all`'s `include .env; export`) still leak into
    any test that doesn't explicitly stub `get_settings`, even with the file disabled.
    See docs/decisions.md - tests must have no network and no real AWS regardless of
    what's in the environment or machine running them.
    """
    monkeypatch.setitem(Settings.model_config, "env_file", None)
    monkeypatch.delenv("PREVIEW_CHECKOUT_PATH", raising=False)
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
