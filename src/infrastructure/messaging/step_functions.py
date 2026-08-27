"""Thin boto3 wrapper for starting/resuming the project state machine.

Kept separate from ProjectRepository (pure DynamoDB) since this talks to a different
AWS service - mirrors the DI pattern used there (inject a fake client in tests instead
of hitting real AWS).
"""

import json
from typing import Any

import boto3


class StateMachineClient:
    def __init__(self, state_machine_arn: str, region: str, sfn_client: Any = None):
        self._state_machine_arn = state_machine_arn
        self._client = sfn_client or boto3.client("stepfunctions", region_name=region)

    def start_execution(self, project_id: str) -> None:
        self._client.start_execution(
            stateMachineArn=self._state_machine_arn,
            name=project_id,
            input=json.dumps({"project_id": project_id}),
        )

    def send_task_success(self, task_token: str, output: dict) -> None:
        self._client.send_task_success(taskToken=task_token, output=json.dumps(output))

    def send_task_failure(self, task_token: str, error: str) -> None:
        self._client.send_task_failure(taskToken=task_token, error=error)
