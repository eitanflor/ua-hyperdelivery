"""DynamoDB persistence for project state and the decision audit trail."""

import json
from typing import TYPE_CHECKING, Any

import boto3
from botocore.exceptions import ClientError

from core.domain.project import (
    APPROVAL_STATIONS,
    Artifact,
    Decision,
    Project,
    Station,
    next_station,
    prior_station,
    utcnow,
)
from infrastructure.repositories.keys import (
    ALL_PROJECTS_GSI2PK,
    ALL_PROJECTS_INDEX,
    ARTIFACT_PREFIX,
    PENDING_BY_STATION_INDEX,
    STATE_SK,
    artifact_sk,
    artifact_version_prefix,
    artifact_version_sk,
    decision_sk,
    pending_gsi1pk,
    project_pk,
)

if TYPE_CHECKING:  # boto3-stubs is a dev-only dependency
    from mypy_boto3_dynamodb.service_resource import DynamoDBServiceResource


class ProjectAlreadyExistsError(ValueError):
    """Raised when a project creation would replace existing state."""


class ProjectRepository:
    """DynamoDB-backed project state + decision audit trail.

    Single-table schema: pk=PROJECT#<id>, sk='STATE' | 'DECISION#<iso-ts>' |
    'ARTIFACT#<agent>' (latest) | 'ARTIFACT_VERSION#<agent>#v<NNNN>' (history), plus
    gsi1-pending-by-station ("who owes a decision") and gsi2-all-projects-by-updated
    ("every project, most recent first"). Schema owned by infra/stacks/storage_stack.py -
    keep both in sync.
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
        try:
            self._table.put_item(
                Item=self._state_item(project),
                ConditionExpression="attribute_not_exists(pk)",
            )
        except ClientError as err:
            if err.response.get("Error", {}).get("Code") != "ConditionalCheckFailedException":
                raise
            msg = f"project {project_id!r} already exists"
            raise ProjectAlreadyExistsError(msg) from err
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

    def list_projects(self) -> list[Project]:
        """Return every project, most recently updated first.

        A Query against gsi2-all-projects-by-updated, not a table Scan - every STATE
        item carries a constant gsi2pk so this is a single-partition query DynamoDB can
        serve efficiently instead of reading (and filtering) every item in the table.
        """
        kwargs: dict[str, Any] = {
            "IndexName": ALL_PROJECTS_INDEX,
            "KeyConditionExpression": "gsi2pk = :pk",
            "ExpressionAttributeValues": {":pk": ALL_PROJECTS_GSI2PK},
            "ScanIndexForward": False,  # gsi2sk = updated_at ISO string - descending = newest first
        }
        items: list[dict[str, Any]] = []
        while True:
            resp = self._table.query(**kwargs)
            items.extend(resp.get("Items", []))
            last_key = resp.get("LastEvaluatedKey")
            if not last_key:
                break
            kwargs["ExclusiveStartKey"] = last_key
        return [self._project_from_item(item) for item in items]

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

        project.station = next_station(station) if approved else prior_station(station)
        project.updated_at = decision.decided_at
        project.task_token = None
        self._table.put_item(Item=self._state_item(project))
        return decision

    def clear_pending_question(self, project_id: str) -> None:
        """Release Distill's elicitation wait once the console API has resumed it."""
        self._table.update_item(
            Key={"pk": project_pk(project_id), "sk": STATE_SK},
            UpdateExpression="REMOVE task_token, pending_question, gsi1pk, gsi1sk",
        )

    def save_artifact(self, project_id: str, agent: str, content: dict[str, Any]) -> Artifact:
        """Persist an agent's structured output as a new version, and update the latest alias.

        Writes two items: an immutable `ARTIFACT_VERSION#<agent>#v<NNNN>` history record,
        and the overwritten `ARTIFACT#<agent>` alias `get_artifact`/`list_artifacts` read
        by default - see `list_artifact_versions` for the full history.
        """
        next_version = self._latest_artifact_version(project_id, agent) + 1
        artifact = Artifact(
            project_id=project_id,
            agent=agent,
            content=content,
            version=next_version,
            created_at=utcnow(),
        )
        self._table.put_item(
            Item=self._artifact_item(artifact, artifact_version_sk(agent, next_version))
        )
        self._table.put_item(Item=self._artifact_item(artifact, artifact_sk(agent)))
        return artifact

    def _latest_artifact_version(self, project_id: str, agent: str) -> int:
        """Return the highest existing version number for an agent's artifact, or 0.

        Version sort keys are zero-padded, so lexicographic order matches numeric order -
        a single-item, reverse-order query gets the latest without reading full history.
        """
        resp = self._table.query(
            KeyConditionExpression="pk = :pk AND begins_with(sk, :prefix)",
            ExpressionAttributeValues={
                ":pk": project_pk(project_id),
                ":prefix": artifact_version_prefix(agent),
            },
            ScanIndexForward=False,
            Limit=1,
        )
        items: list[dict[str, Any]] = resp.get("Items", [])
        return int(items[0]["version"]) if items else 0

    def get_artifact(self, project_id: str, agent: str) -> Artifact | None:
        """Return an agent's latest artifact, or None if it hasn't run yet."""
        resp = self._table.get_item(Key={"pk": project_pk(project_id), "sk": artifact_sk(agent)})
        item = resp.get("Item")
        return self._artifact_from_item(item) if item else None

    def list_artifacts(self, project_id: str) -> list[Artifact]:
        """Return every agent's latest artifact for a project, in no particular order."""
        resp = self._table.query(
            KeyConditionExpression="pk = :pk AND begins_with(sk, :prefix)",
            ExpressionAttributeValues={":pk": project_pk(project_id), ":prefix": ARTIFACT_PREFIX},
        )
        return [self._artifact_from_item(item) for item in resp.get("Items", [])]

    def list_artifact_versions(self, project_id: str, agent: str) -> list[Artifact]:
        """Return every version of one agent's artifact for a project, oldest first."""
        items = self._artifact_version_items(project_id, agent)
        return [self._artifact_from_item(item) for item in items]

    def _artifact_version_items(self, project_id: str, agent: str) -> list[dict[str, Any]]:
        kwargs: dict[str, Any] = {
            "KeyConditionExpression": "pk = :pk AND begins_with(sk, :prefix)",
            "ExpressionAttributeValues": {
                ":pk": project_pk(project_id),
                ":prefix": artifact_version_prefix(agent),
            },
        }
        items: list[dict[str, Any]] = []
        while True:
            resp = self._table.query(**kwargs)
            items.extend(resp.get("Items", []))
            last_key = resp.get("LastEvaluatedKey")
            if not last_key:
                break
            kwargs["ExclusiveStartKey"] = last_key
        return items

    def advance_after_artifact(self, project_id: str, agent: str) -> Project:
        """Moves a project past an agent station once its artifact has been produced.

        The local-dev substitute for what the Step Functions chain does in production
        (see orchestration.local_agent_client). Raises if the project isn't currently at
        that station, so a stale/duplicate "run" call can't double-advance it.
        """
        project = self.get_project(project_id)
        if project is None:
            msg = f"unknown project {project_id}"
            raise ValueError(msg)
        if project.station.value != agent:
            msg = f"project is not at {agent} (currently at {project.station.value})"
            raise ValueError(msg)

        project.station = next_station(project.station)
        project.updated_at = utcnow()
        self._table.put_item(Item=self._state_item(project))
        return project

    def delete_project(self, project_id: str) -> None:
        """Deletes a project's state, artifacts, and decision history.

        Everything under its `pk` (see the schema note on the class docstring). No-op if
        the project doesn't exist, matching DynamoDB's own delete_item semantics.
        """
        resp = self._table.query(
            KeyConditionExpression="pk = :pk",
            ExpressionAttributeValues={":pk": project_pk(project_id)},
        )
        for item in resp.get("Items", []):
            self._table.delete_item(Key={"pk": item["pk"], "sk": item["sk"]})

    def rename_project(self, project_id: str, name: str) -> Project:
        """Change a project's display name in place - station/history are untouched."""
        project = self.get_project(project_id)
        if project is None:
            msg = f"unknown project {project_id}"
            raise ValueError(msg)
        project.name = name
        project.updated_at = utcnow()
        self._table.put_item(Item=self._state_item(project))
        return project

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
            # Every STATE item carries this so gsi2-all-projects-by-updated can serve
            # list_projects as a single-partition Query instead of a table Scan.
            "gsi2pk": ALL_PROJECTS_GSI2PK,
            "gsi2sk": project.updated_at.isoformat(),
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
            pending_question=json.loads(item["pending_question"])
            if item.get("pending_question")
            else None,
            created_at=item["created_at"],
            updated_at=item["updated_at"],
        )

    @staticmethod
    def _artifact_item(artifact: Artifact, sk: str) -> dict[str, Any]:
        return {
            "pk": project_pk(artifact.project_id),
            "sk": sk,
            "agent": artifact.agent,
            "version": artifact.version,
            # DynamoDB's Table resource rejects native float (agent output models use
            # plain floats, e.g. CompletenessScore.score) - store as a JSON string instead.
            "content": json.dumps(artifact.content),
            "created_at": artifact.created_at.isoformat(),
        }

    @staticmethod
    def _artifact_from_item(item: dict[str, Any]) -> Artifact:
        return Artifact(
            project_id=item["pk"].removeprefix("PROJECT#"),
            agent=item["agent"],
            content=json.loads(item["content"]),
            version=int(item.get("version", 1)),
            created_at=item["created_at"],
        )
