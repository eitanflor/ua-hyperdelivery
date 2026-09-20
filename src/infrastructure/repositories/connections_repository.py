"""DynamoDB persistence for authenticated console WebSocket connections.

Project-first keys support strongly consistent watcher reads. A connection-id GSI
supports disconnect cleanup, and TTL removes abandoned connections.
"""

import secrets
from typing import TYPE_CHECKING, Any

import boto3

from core.domain.project import utcnow

if TYPE_CHECKING:  # boto3-stubs is a dev-only dependency
    from mypy_boto3_dynamodb.service_resource import DynamoDBServiceResource

CONNECTION_ID_INDEX = "ws-connections-by-connection"
_CONNECTION_TTL_SECONDS = 60 * 60 * 2  # generous upper bound on a single browser session
_STREAM_TICKET_TTL_SECONDS = 60
_CONNECTION_RECORD = "connection"
_TICKET_RECORD = "ticket"
_TICKET_PREFIX = "TICKET#"


class ConnectionsRepository:
    """Tracks which WebSocket connection IDs are watching which project."""

    def __init__(
        self,
        table_name: str,
        region: str,
        dynamodb_resource: "DynamoDBServiceResource | None" = None,
    ) -> None:
        """Pass `dynamodb_resource` to inject a fake instead of reaching real DynamoDB."""
        resource = dynamodb_resource or boto3.resource("dynamodb", region_name=region)
        self._table = resource.Table(table_name)

    def connect(self, connection_id: str, project_id: str) -> None:
        """Record a newly-opened connection - called from the `$connect` route."""
        expires_at = int(utcnow().timestamp()) + _CONNECTION_TTL_SECONDS
        self._table.put_item(
            Item={
                "project_id": project_id,
                "connection_id": connection_id,
                "record_type": _CONNECTION_RECORD,
                "expires_at": expires_at,
            }
        )

    def issue_ticket(self, project_id: str) -> str:
        """Create a short-lived credential that can open one project stream."""
        ticket = secrets.token_urlsafe(32)
        expires_at = int(utcnow().timestamp()) + _STREAM_TICKET_TTL_SECONDS
        self._table.put_item(
            Item={
                "project_id": project_id,
                "connection_id": f"{_TICKET_PREFIX}{ticket}",
                "record_type": _TICKET_RECORD,
                "expires_at": expires_at,
            }
        )
        return ticket

    def consume_ticket(self, project_id: str, ticket: str) -> bool:
        """Atomically consume a valid stream ticket so it cannot be replayed."""
        response = self._table.delete_item(
            Key={"project_id": project_id, "connection_id": f"{_TICKET_PREFIX}{ticket}"},
            ReturnValues="ALL_OLD",
        )
        item: dict[str, Any] | None = response.get("Attributes")
        return bool(
            item
            and item.get("record_type") == _TICKET_RECORD
            and item.get("expires_at", 0) >= int(utcnow().timestamp())
        )

    def disconnect(self, connection_id: str) -> None:
        """Forget a connection.

        Called from the `$disconnect` route, or after a stale connection is found to be
        gone (`GoneException`) while broadcasting. A no-op if it's already gone (e.g.
        `$connect` itself rejected it, so it was never recorded).
        """
        resp = self._table.query(
            IndexName=CONNECTION_ID_INDEX,
            KeyConditionExpression="connection_id = :cid",
            ExpressionAttributeValues={":cid": connection_id},
        )
        items: list[dict[str, Any]] = resp.get("Items", [])
        if not items:
            return
        self._table.delete_item(
            Key={"project_id": items[0]["project_id"], "connection_id": connection_id}
        )

    def connections_for_project(self, project_id: str) -> list[str]:
        """Return current watchers using a strongly consistent base-table query."""
        connection_ids: list[str] = []
        query: dict[str, Any] = {
            "KeyConditionExpression": "project_id = :pid",
            "ExpressionAttributeValues": {":pid": project_id},
            "ConsistentRead": True,
        }
        while True:
            response = self._table.query(**query)
            items: list[dict[str, Any]] = response.get("Items", [])
            connection_ids.extend(
                item["connection_id"]
                for item in items
                if item.get("record_type", _CONNECTION_RECORD) == _CONNECTION_RECORD
            )
            last_key = response.get("LastEvaluatedKey")
            if not last_key:
                return connection_ids
            query["ExclusiveStartKey"] = last_key
