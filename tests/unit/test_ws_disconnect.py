import pytest

from infrastructure.repositories.connections_repository import (
    CONNECTION_ID_INDEX,
    ConnectionsRepository,
)
from orchestration import ws_disconnect


class _FakeTable:
    def __init__(self, store: dict[tuple[str, str], dict[str, str]]) -> None:
        self._store = store

    def query(
        self, IndexName: str, ExpressionAttributeValues: dict[str, str], **_: object
    ) -> dict[str, list[dict[str, str]]]:
        assert IndexName == CONNECTION_ID_INDEX
        connection_id = ExpressionAttributeValues[":cid"]
        matches = [item for item in self._store.values() if item["connection_id"] == connection_id]
        return {"Items": matches}

    def delete_item(self, Key: dict[str, str]) -> None:
        self._store.pop((Key["project_id"], Key["connection_id"]), None)


@pytest.fixture
def connections_store(monkeypatch: pytest.MonkeyPatch) -> dict[tuple[str, str], dict[str, str]]:
    store: dict[tuple[str, str], dict[str, str]] = {
        ("project-1", "conn-1"): {"project_id": "project-1", "connection_id": "conn-1"}
    }

    def fake_init(self: ConnectionsRepository, table_name: str, region: str) -> None:
        self.__dict__["_table"] = _FakeTable(store)

    monkeypatch.setattr(ConnectionsRepository, "__init__", fake_init)
    monkeypatch.setenv("CONNECTIONS_TABLE", "hyperdelivery-ws-connections")
    monkeypatch.setenv("AWS_REGION", "us-east-1")
    return store


def test_disconnect_forgets_the_connection(
    connections_store: dict[tuple[str, str], dict[str, str]],
) -> None:
    event = {"requestContext": {"connectionId": "conn-1"}}

    resp = ws_disconnect.handler(event, None)

    assert resp["statusCode"] == 200
    assert ("project-1", "conn-1") not in connections_store


def test_disconnect_is_a_noop_for_an_unknown_connection(
    connections_store: dict[tuple[str, str], dict[str, str]],
) -> None:
    event = {"requestContext": {"connectionId": "never-connected"}}

    resp = ws_disconnect.handler(event, None)

    assert resp["statusCode"] == 200
