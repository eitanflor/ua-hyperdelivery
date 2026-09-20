"""Tests for the global `/context` endpoint - system-wide, not per-project."""

from typing import Any, cast

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.auth import CurrentUser, get_current_user
from api.main import create_app
from fakes import FakeTable
from infrastructure.repositories.context_repository import ContextRepository
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
    monkeypatch.setattr(ContextRepository, "__init__", fake_init)
    app = create_app()
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(oid="test-user")
    return TestClient(app)


def test_get_context_is_empty_before_anything_is_set(client: TestClient) -> None:
    resp = client.get("/context")

    assert resp.status_code == 200
    assert resp.json() == {"context": "", "updated_by": None, "updated_at": None}


def test_set_context_stamps_the_authenticated_user(client: TestClient) -> None:
    cast(FastAPI, client.app).dependency_overrides[get_current_user] = lambda: CurrentUser(
        oid="u1", email="rahul@example.com"
    )

    resp = client.patch("/context", json={"context": "Repo: org/repo. DB: Postgres."})

    assert resp.status_code == 200
    body = resp.json()
    assert body["context"] == "Repo: org/repo. DB: Postgres."
    assert body["updated_by"] == "rahul@example.com"
    assert body["updated_at"] is not None
    refetched = client.get("/context").json()
    assert refetched["context"] == "Repo: org/repo. DB: Postgres."


def test_context_requires_sign_in(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_init(
        self: ProjectRepository,
        table_name: str,
        region: str,
        dynamodb_resource: object = None,
    ) -> None:
        self.__dict__["_table"] = FakeTable()

    monkeypatch.setattr(ProjectRepository, "__init__", fake_init)
    monkeypatch.setattr(ContextRepository, "__init__", fake_init)
    app = create_app()

    resp = TestClient(app).get("/context")

    assert resp.status_code == 401
