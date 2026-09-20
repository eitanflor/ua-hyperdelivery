"""DynamoDB persistence for the one global standing context every agent reads."""

from typing import TYPE_CHECKING, Any

import boto3

from core.domain.context import GlobalContext
from core.domain.project import utcnow
from infrastructure.repositories.keys import CONTEXT_SK, GLOBAL_PK

if TYPE_CHECKING:  # boto3-stubs is a dev-only dependency
    from mypy_boto3_dynamodb.service_resource import DynamoDBServiceResource


class ContextRepository:
    """DynamoDB-backed global context: one 'GLOBAL'/'CONTEXT' item, not one per project.

    Same table as `ProjectRepository` (see docs/decisions.md - one table stays right for
    this system), just a different partition namespace.
    """

    def __init__(
        self,
        table_name: str,
        region: str,
        dynamodb_resource: "DynamoDBServiceResource | None" = None,
    ) -> None:
        """Pass `dynamodb_resource` to inject a fake instead of reaching real DynamoDB."""
        resource = dynamodb_resource or boto3.resource("dynamodb", region_name=region)
        self._table = resource.Table(table_name)

    def get_context(self) -> GlobalContext:
        """Return the standing context, or an empty one if nothing has been set yet."""
        resp = self._table.get_item(Key={"pk": GLOBAL_PK, "sk": CONTEXT_SK})
        item: dict[str, Any] | None = resp.get("Item")
        if item is None:
            return GlobalContext()
        return GlobalContext(
            context=item.get("context", ""),
            updated_by=item.get("updated_by"),
            updated_at=item.get("updated_at"),
        )

    def set_context(self, context: str, updated_by: str) -> GlobalContext:
        """Replace the standing context and stamp who changed it."""
        updated = GlobalContext(context=context, updated_by=updated_by, updated_at=utcnow())
        item: dict[str, Any] = {"pk": GLOBAL_PK, "sk": CONTEXT_SK, "context": updated.context}
        if updated.updated_by:
            item["updated_by"] = updated.updated_by
        if updated.updated_at:
            item["updated_at"] = updated.updated_at.isoformat()
        self._table.put_item(Item=item)
        return updated
