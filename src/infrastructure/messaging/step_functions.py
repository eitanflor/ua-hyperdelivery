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

    def start_execution(self, project_id: str, message: str = "") -> None:
        """Kick off the line for a newly created project.

        `message` is the project's own brief (`CreateProjectRequest.message`) - without
        it, Distill's task in the state machine has nothing but the project id to draft
        from (see docs/decisions.md, "placeholder prompts").
        """
        self._client.start_execution(
            stateMachineArn=self._state_machine_arn,
            name=project_id,
            input=json.dumps({"project_id": project_id, "message": message}),
        )

    def send_task_success(self, task_token: str, output: dict[str, Any] | str) -> None:
        """Release a paused wait so the execution advances.

        `output` becomes the task's own result at whatever `result_path` the waiting
        state used - a bare `str` (Distill's elicitation wait, `result_path="$.message"`)
        must NOT be wrapped in a dict, or ASL's string formatting downstream stringifies
        the wrapper object itself (`{message=...}`) instead of the text inside it - see
        docs/decisions.md.
        """
        self._client.send_task_success(taskToken=task_token, output=json.dumps(output))

    def send_task_failure(self, task_token: str, error: str) -> None:
        """Fail a paused approval wait, which fails the whole execution."""
        self._client.send_task_failure(taskToken=task_token, error=error)
