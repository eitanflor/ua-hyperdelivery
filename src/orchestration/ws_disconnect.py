"""API Gateway WebSocket `$disconnect` route: forgets a closed connection."""

import logging
import os
from typing import Any

from infrastructure.repositories.connections_repository import ConnectionsRepository

logger = logging.getLogger("ws_disconnect")


def handler(event: dict[str, Any], _context: object) -> dict[str, Any]:
    """Forget a closed connection.

    Best-effort: a connection that was never recorded (e.g. `$connect` rejected it) is a
    no-op delete, not an error.
    """
    connection_id = event["requestContext"]["connectionId"]
    repo = ConnectionsRepository(
        table_name=os.environ["CONNECTIONS_TABLE"], region=os.environ["AWS_REGION"]
    )
    repo.disconnect(connection_id)
    logger.info("connection %s closed", connection_id)
    return {"statusCode": 200}
