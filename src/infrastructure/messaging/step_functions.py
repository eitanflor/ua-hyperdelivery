"""Thin boto3 wrapper for starting/resuming the project state machine.

Kept separate from ProjectRepository (pure DynamoDB) since this talks to a different
AWS service - mirrors the DI pattern used there (inject a fake client in tests instead
of hitting real AWS).
"""

import json
from typing import TYPE_CHECKING, Any

import boto3

if TYPE_CHECKING:  # boto3-stubs is a dev-only dependency
    from mypy_boto3_stepfunctions.client import SFNClient


class StateMachineClient:
    """Starts project executions and resumes the ones parked on a task token."""

    def __init__(
        self, state_machine_arn: str, region: str, sfn_client: "SFNClient | None" = None
    ) -> None:
        """Pass `sfn_client` to inject a fake instead of reaching real Step Functions."""
        self._state_machine_arn = state_machine_arn
        self._client = sfn_client or boto3.client("stepfunctions", region_name=region)

    def start_execution(self, project_id: str) -> None:
        """Kick off the line for a newly created project."""
        self._client.start_execution(
            stateMachineArn=self._state_machine_arn,
            name=project_id,
            input=json.dumps({"project_id": project_id}),
        )

    def send_task_success(self, task_token: str, output: dict[str, Any]) -> None:
        """Release a paused approval wait so the execution advances."""
        self._client.send_task_success(taskToken=task_token, output=json.dumps(output))

    def send_task_failure(self, task_token: str, error: str) -> None:
        """Fail a paused approval wait, which fails the whole execution."""
        self._client.send_task_failure(taskToken=task_token, error=error)
