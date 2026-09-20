"""API Gateway WebSocket `$connect` route: records which project a connection watches."""

import logging
import os
from typing import Any, cast

from infrastructure.repositories.connections_repository import ConnectionsRepository

logger = logging.getLogger("ws_connect")


def handler(event: dict[str, Any], _context: object) -> dict[str, Any]:
    """Authenticate and store which project this connection is watching.

    The console UI first obtains a short-lived, one-time ticket from the authenticated
    project API, then sends that ticket with the project ID during the handshake.
    """
    connection_id = str(event["requestContext"]["connectionId"])
    query = cast(dict[str, Any], event.get("queryStringParameters") or {})
    project_id = query.get("project_id")
    ticket = query.get("ticket")
    if not isinstance(project_id, str) or not isinstance(ticket, str):
        logger.warning("connection %s rejected: missing project_id or ticket", connection_id)
        return {"statusCode": 400, "body": "project_id and ticket are required"}

    repo = ConnectionsRepository(
        table_name=os.environ["CONNECTIONS_TABLE"], region=os.environ["AWS_REGION"]
    )
    if not repo.consume_ticket(project_id, ticket):
        logger.warning("connection %s rejected: invalid stream ticket", connection_id)
        return {"statusCode": 401, "body": "invalid or expired stream ticket"}
    repo.connect(connection_id, project_id)
    logger.info("connection %s watching project %s", connection_id, project_id)
    return {"statusCode": 200}
