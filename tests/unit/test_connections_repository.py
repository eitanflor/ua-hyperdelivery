from datetime import timedelta
from typing import Any

import pytest

from core.domain.project import utcnow
from infrastructure.repositories import connections_repository as connections_module
from infrastructure.repositories.connections_repository import (
    CONNECTION_ID_INDEX,
    ConnectionsRepository,
)


class _FakeConnectionsTable:
    """Minimal in-memory stand-in - just what `ConnectionsRepository` actually calls."""

    def __init__(self) -> None:
        self.items: dict[tuple[str, str], dict[str, Any]] = {}
        self.page_size: int | None = None

    def put_item(self, Item: dict[str, Any]) -> None:
        self.items[(Item["project_id"], Item["connection_id"])] = Item

    def delete_item(self, Key: dict[str, Any], ReturnValues: str | None = None) -> dict[str, Any]:
        item = self.items.pop((Key["project_id"], Key["connection_id"]), None)
        return {"Attributes": item} if ReturnValues == "ALL_OLD" and item else {}

    def query(
        self,
        KeyConditionExpression: str,
        ExpressionAttributeValues: dict[str, Any],
        IndexName: str | None = None,
        ConsistentRead: bool = False,
        ExclusiveStartKey: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if IndexName == CONNECTION_ID_INDEX:
            connection_id = ExpressionAttributeValues[":cid"]
            matches = [
                item for item in self.items.values() if item["connection_id"] == connection_id
            ]
            return {"Items": matches}
        assert IndexName is None
        project_id = ExpressionAttributeValues[":pid"]
        matches = [item for item in self.items.values() if item["project_id"] == project_id]
        start = int((ExclusiveStartKey or {}).get("offset", 0))
        end = start + self.page_size if self.page_size else len(matches)
        response: dict[str, Any] = {"Items": matches[start:end]}
        if end < len(matches):
            response["LastEvaluatedKey"] = {"offset": end}
        return response


class _FakeDynamoResource:
    def __init__(self, table: _FakeConnectionsTable) -> None:
        self._table = table

    def Table(self, name: str) -> _FakeConnectionsTable:
        return self._table


def _repo() -> tuple[ConnectionsRepository, _FakeConnectionsTable]:
    table = _FakeConnectionsTable()
    repo = ConnectionsRepository(
        table_name="hyperdelivery-ws-connections",
        region="us-east-1",
        dynamodb_resource=_FakeDynamoResource(table),  # type: ignore[arg-type]
    )
    return repo, table


def test_connect_records_which_project_a_connection_watches() -> None:
    repo, table = _repo()

    repo.connect("conn-1", "project-1")

    assert table.items[("project-1", "conn-1")]["project_id"] == "project-1"
    assert "expires_at" in table.items[("project-1", "conn-1")]


def test_disconnect_forgets_the_connection() -> None:
    repo, table = _repo()
    repo.connect("conn-1", "project-1")

    repo.disconnect("conn-1")

    assert ("project-1", "conn-1") not in table.items


def test_disconnect_is_a_noop_for_an_unknown_connection() -> None:
    repo, _ = _repo()

    repo.disconnect("never-connected")  # must not raise


def test_ticket_can_only_be_consumed_once() -> None:
    repo, _ = _repo()
    ticket = repo.issue_ticket("project-1")

    assert repo.consume_ticket("project-1", ticket) is True
    assert repo.consume_ticket("project-1", ticket) is False


def test_expired_ticket_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    repo, _ = _repo()
    ticket = repo.issue_ticket("project-1")
    future = utcnow() + timedelta(minutes=2)
    monkeypatch.setattr(connections_module, "utcnow", lambda: future)

    assert repo.consume_ticket("project-1", ticket) is False


def test_connections_for_project_returns_only_matching_connections() -> None:
    repo, _ = _repo()
    repo.connect("conn-1", "project-1")
    repo.connect("conn-2", "project-1")
    repo.connect("conn-3", "project-2")
    repo.issue_ticket("project-1")

    watchers = repo.connections_for_project("project-1")

    assert set(watchers) == {"conn-1", "conn-2"}


def test_connections_for_project_returns_empty_when_nobody_is_watching() -> None:
    repo, _ = _repo()

    assert repo.connections_for_project("project-1") == []


def test_connections_for_project_reads_every_page() -> None:
    repo, table = _repo()
    table.page_size = 2
    repo.connect("conn-1", "project-1")
    repo.issue_ticket("project-1")
    repo.connect("conn-2", "project-1")
    repo.connect("conn-3", "project-1")

    assert repo.connections_for_project("project-1") == ["conn-1", "conn-2", "conn-3"]
