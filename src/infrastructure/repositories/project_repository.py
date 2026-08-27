from typing import Any

import boto3

from core.domain.project import (
    APPROVAL_STATIONS,
    Decision,
    Project,
    Station,
    next_station,
    utcnow,
)


class ProjectRepository:
    """DynamoDB-backed project state + decision audit trail.

    Single-table schema: pk=PROJECT#<id>, sk='STATE' or 'DECISION#<iso-ts>', plus GSI
    gsi1-pending-by-station for "who owes a decision" queries. Schema owned by
    infra/stacks/orchestration_stack.py - keep both in sync.
    """

    def __init__(self, table_name: str, region: str, dynamodb_resource: Any = None):
        resource = dynamodb_resource or boto3.resource("dynamodb", region_name=region)
        self._table = resource.Table(table_name)

    def create_project(self, project_id: str, name: str) -> Project:
        now = utcnow()
        project = Project(
            id=project_id, name=name, station=Station.DISTILL, created_at=now, updated_at=now
        )
        self._table.put_item(Item=self._state_item(project))
        return project

    def get_project(self, project_id: str) -> Project | None:
        resp = self._table.get_item(Key={"pk": f"PROJECT#{project_id}", "sk": "STATE"})
        item = resp.get("Item")
        return self._project_from_item(item) if item else None

    def list_pending(self, station: Station) -> list[Project]:
        resp = self._table.query(
            IndexName="gsi1-pending-by-station",
            KeyConditionExpression="gsi1pk = :pk",
            ExpressionAttributeValues={":pk": f"STATION#{station.value}#PENDING"},
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
        project = self.get_project(project_id)
        if project is None:
            raise ValueError(f"unknown project {project_id}")

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
    def _state_item(project: Project) -> dict:
        item: dict[str, Any] = {
            "pk": f"PROJECT#{project.id}",
            "sk": "STATE",
            "id": project.id,
            "name": project.name,
            "station": project.station.value,
            "created_at": project.created_at.isoformat(),
            "updated_at": project.updated_at.isoformat(),
        }
        if project.station in APPROVAL_STATIONS:
            item["gsi1pk"] = f"STATION#{project.station.value}#PENDING"
            item["gsi1sk"] = project.id
        if project.task_token:
            item["task_token"] = project.task_token
        return item

    @staticmethod
    def _decision_item(decision: Decision) -> dict:
        return {
            "pk": f"PROJECT#{decision.project_id}",
            "sk": f"DECISION#{decision.decided_at.isoformat()}",
            "station": decision.station.value,
            "approved": decision.approved,
            "signer": decision.signer,
            "comment": decision.comment,
            "decided_at": decision.decided_at.isoformat(),
        }

    @staticmethod
    def _project_from_item(item: dict) -> Project:
        return Project(
            id=item["id"],
            name=item["name"],
            station=Station(item["station"]),
            task_token=item.get("task_token"),
            created_at=item["created_at"],
            updated_at=item["updated_at"],
        )
