from typing import Any

import pytest

from infrastructure.repositories.connections_repository import ConnectionsRepository
from orchestration import ws_connect


@pytest.fixture
def connections_store(monkeypatch: pytest.MonkeyPatch) -> dict[str, dict[str, Any]]:
    """An in-memory table backing `ConnectionsRepository`.

    Same seam `tests/unit/test_projects_api.py`'s `client` fixture uses for repositories.
    """
    store: dict[str, dict[str, Any]] = {}

    def fake_init(self: ConnectionsRepository, table_name: str, region: str) -> None:
        self.__dict__["_table"] = _FakeTable(store)

    monkeypatch.setattr(ConnectionsRepository, "__init__", fake_init)
    monkeypatch.setenv("CONNECTIONS_TABLE", "hyperdelivery-ws-connections")
    monkeypatch.setenv("AWS_REGION", "us-east-1")
    return store


class _FakeTable:
    def __init__(self, store: dict[str, dict[str, Any]]) -> None:
        self._store = store

    def put_item(self, Item: dict[str, Any]) -> None:
        self._store[Item["connection_id"]] = Item

    def delete_item(self, Key: dict[str, str], ReturnValues: str | None = None) -> dict[str, Any]:
        item = self._store.pop(Key["connection_id"], None)
        return {"Attributes": item} if ReturnValues == "ALL_OLD" and item else {}


def _ticket(project_id: str) -> str:
    repo = ConnectionsRepository("hyperdelivery-ws-connections", "us-east-1")
    return repo.issue_ticket(project_id)


def test_connect_records_the_project_id(connections_store: dict[str, dict[str, Any]]) -> None:
    ticket = _ticket("project-1")
    event = {
        "requestContext": {"connectionId": "conn-1"},
        "queryStringParameters": {"project_id": "project-1", "ticket": ticket},
    }

    resp = ws_connect.handler(event, None)

    assert resp["statusCode"] == 200
    assert connections_store["conn-1"]["project_id"] == "project-1"


def test_connect_rejects_a_connection_with_no_project_id(
    connections_store: dict[str, dict[str, Any]],
) -> None:
    event = {"requestContext": {"connectionId": "conn-1"}, "queryStringParameters": None}

    resp = ws_connect.handler(event, None)

    assert resp["statusCode"] == 400
    assert "conn-1" not in connections_store


def test_connect_rejects_a_replayed_ticket(
    connections_store: dict[str, dict[str, Any]],
) -> None:
    ticket = _ticket("project-1")
    event = {
        "requestContext": {"connectionId": "conn-1"},
        "queryStringParameters": {"project_id": "project-1", "ticket": ticket},
    }

    assert ws_connect.handler(event, None)["statusCode"] == 200
    event["requestContext"]["connectionId"] = "conn-2"

    assert ws_connect.handler(event, None)["statusCode"] == 401
    assert "conn-2" not in connections_store
