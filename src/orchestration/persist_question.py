"""Step Functions Task glue for Distill's elicitation wait.

Distill deliberately prefers `ask_clarifying_questions` over drafting a placeholder spec
(config/agents/distill.yaml) - `agent_invoker.py` surfaces that as a non-"drafted" outcome
instead of an error. This Lambda is the WAIT_FOR_TASK_TOKEN glue for that wait, mirroring
`persist_approval.py`'s pattern exactly but for a question instead of a gate decision: it
persists the task token and the pending question (plus the prompt that led to it, so the
console API can build Distill's next turn from the full exchange, not just the latest
question) onto the project's STATE item, then returns - the execution itself stays paused
until the console API calls send_task_success with the human's answer folded in.
"""

import json
import os
from typing import Any, cast

import boto3

from infrastructure.aws import BotoClientFactory
from infrastructure.repositories.keys import STATE_SK, pending_gsi1pk, project_pk

# Not a real Station - a distinct GSI partition so "who is Distill waiting on" is queryable
# the same way gate approvals are, without colliding with APPROVAL_STATIONS' own values.
_PENDING_QUESTION_STATION = "distill_question"


class QuestionPersister:
    """Records Distill's pending question and the task token, then announces the wait."""

    def __init__(
        self,
        region: str,
        projects_table: str,
        notifications_topic_arn: str,
        clients: BotoClientFactory | None = None,
    ) -> None:
        """Pass `clients` to inject a fake boto3 module instead of reaching real AWS."""
        self._notifications_topic_arn = notifications_topic_arn
        factory = clients if clients is not None else cast(BotoClientFactory, boto3)
        self._table = factory.resource("dynamodb", region_name=region).Table(projects_table)
        self._sns = factory.client("sns", region_name=region)

    def persist(
        self, project_id: str, distill_result: dict[str, Any], prior_message: str, task_token: str
    ) -> dict[str, Any]:
        """Park the execution's task token and Distill's question against the project."""
        pending_question = {**distill_result, "prior_message": prior_message}
        self._table.update_item(
            Key={"pk": project_pk(project_id), "sk": STATE_SK},
            UpdateExpression="SET task_token = :token, pending_question = :question, "
            "gsi1pk = :gsi1pk, gsi1sk = :gsi1sk",
            ExpressionAttributeValues={
                ":token": task_token,
                # ProjectRepository._artifact_item stores agent output as a JSON string
                # too - the boto3 Table resource rejects native float, and an
                # OpenQuestion-shaped dict is otherwise indistinguishable from one that
                # happens to gain a float field later.
                ":question": json.dumps(pending_question),
                ":gsi1pk": pending_gsi1pk(_PENDING_QUESTION_STATION),
                ":gsi1sk": project_id,
            },
        )
        self._sns.publish(
            TopicArn=self._notifications_topic_arn,
            Subject="Hyperdelivery: Distill needs an answer",
            Message=f"Project {project_id} is waiting for an answer before Distill can draft.",
        )
        return {"persisted": True}


def handler(event: dict[str, Any], _context: object) -> dict[str, Any]:
    """Step Functions LambdaInvoke entrypoint for Distill's elicitation wait.

    `event` is `{"project_id": ..., "distill_result": {"status": "questions"|"chat", ...},
    "message": "<the prompt Distill was given this turn>", "task_token": "$$.Task.Token"}`.
    """
    persister = QuestionPersister(
        region=os.environ["AWS_REGION"],
        projects_table=os.environ["PROJECTS_TABLE"],
        notifications_topic_arn=os.environ["NOTIFICATIONS_TOPIC_ARN"],
    )
    return persister.persist(
        event["project_id"], event["distill_result"], event["message"], event["task_token"]
    )
