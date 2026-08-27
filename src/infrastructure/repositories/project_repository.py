"""DynamoDB persistence for project state and the decision audit trail."""

from typing import TYPE_CHECKING, Any

import boto3

from core.domain.project import (
    APPROVAL_STATIONS,
    Decision,
    Project,
    Station,
    next_station,
    utcnow,
)
from infrastructure.repositories.keys import (
    PENDING_BY_STATION_INDEX,
    STATE_SK,
    decision_sk,
    pending_gsi1pk,
    project_pk,
)

if TYPE_CHECKING:  # boto3-stubs is a dev-only dependency
    from mypy_boto3_dynamodb.service_resource import DynamoDBServiceResource


class ProjectRepository:
    """DynamoDB-backed project state + decision audit trail.

    Single-table schema: pk=PROJECT#<id>, sk='STATE' or 'DECISION#<iso-ts>', plus GSI
    gsi1-pending-by-station for "who owes a decision" queries. Schema owned by
    infra/stacks/orchestration_stack.py - keep both in sync.
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

    def create_project(self, project_id: str, name: str) -> Project:
        """Write a new project at the first station and return it."""
        now = utcnow()
        project = Project(
            id=project_id, name=name, station=Station.DISTILL, created_at=now, updated_at=now
        )
        self._table.put_item(Item=self._state_item(project))
        return project

    def get_project(self, project_id: str) -> Project | None:
        """Return the current projection of a project, or None if it doesn't exist."""
        resp = self._table.get_item(Key={"pk": project_pk(project_id), "sk": STATE_SK})
        item = resp.get("Item")
        return self._project_from_item(item) if item else None

    def list_pending(self, station: Station) -> list[Project]:
        """Return every project waiting for a decision at `station`."""
        resp = self._table.query(
            IndexName=PENDING_BY_STATION_INDEX,
            KeyConditionExpression="gsi1pk = :pk",
            ExpressionAttributeValues={":pk": pending_gsi1pk(station.value)},
        )
        return [self._project_from_item(item) for item in resp.get("Items", [])]

    def record_decision(
        self,
        project_id: str,
        station: Station,
        approved: bool,
        signer: str,
        comment: str | None,
    ) -> Decision:
        """Append an immutable decision record and advance (or hold) the project."""
        project = self.get_project(project_id)
        if project is None:
            msg = f"unknown project {project_id}"
            raise ValueError(msg)

        decision = Decision(
            project_id=project_id,
            station=station,
            approved=approved,
            signer=signer,
            comment=comment,
            decided_at=utcnow(),
        )
        self._table.put_item(Item=self._decision_item(decision))

        project.station = next_station(station) if approved else station
        project.updated_at = decision.decided_at
        project.task_token = None
        self._table.put_item(Item=self._state_item(project))
        return decision

    @staticmethod
    def _state_item(project: Project) -> dict[str, Any]:
        item: dict[str, Any] = {
            "pk": project_pk(project.id),
            "sk": STATE_SK,
            "id": project.id,
            "name": project.name,
            "station": project.station.value,
            "created_at": project.created_at.isoformat(),
            "updated_at": project.updated_at.isoformat(),
        }
        if project.station in APPROVAL_STATIONS:
            item["gsi1pk"] = pending_gsi1pk(project.station.value)
            item["gsi1sk"] = project.id
        if project.task_token:
            item["task_token"] = project.task_token
        return item

    @staticmethod
    def _decision_item(decision: Decision) -> dict[str, Any]:
        return {
            "pk": project_pk(decision.project_id),
            "sk": decision_sk(decision.decided_at.isoformat()),
            "station": decision.station.value,
            "approved": decision.approved,
            "signer": decision.signer,
            "comment": decision.comment,
            "decided_at": decision.decided_at.isoformat(),
        }

    @staticmethod
    def _project_from_item(item: dict[str, Any]) -> Project:
        return Project(
            id=item["id"],
            name=item["name"],
            station=Station(item["station"]),
            task_token=item.get("task_token"),
            created_at=item["created_at"],
            updated_at=item["updated_at"],
        )
