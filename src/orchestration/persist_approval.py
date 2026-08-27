"""Step Functions Task glue for the human-approval wait stations.

DynamoDB service integrations only support the REQUEST_RESPONSE pattern (Step Functions
has no `dynamodb:updateItem.waitForTaskToken` - confirmed against the installed CDK's
`DynamoUpdateItem._renderTask`, which never appends a `.waitForTaskToken` suffix). Lambda
is the standard vehicle for combining WAIT_FOR_TASK_TOKEN with a DynamoDB write: this
handler persists the token + pending-approval GSI attributes, publishes the "who owes a
decision" notification, then returns - the execution itself stays paused (independently
of this Lambda) until the console API calls send_task_success/send_task_failure with that
token. Step Functions' own EventBridge integration only emits execution-level events
(start/success/failure), not per-state entry, so it can't drive this notification - this
Lambda runs at exactly the moment the wait begins, making it the right place instead.
"""

import os
from typing import Any

import boto3


class ApprovalPersister:
    def __init__(
        self,
        region: str,
        projects_table: str,
        notifications_topic_arn: str,
        clients: Any = None,
    ):
        self._region = region
        self._notifications_topic_arn = notifications_topic_arn
        self._table = (clients or boto3).resource("dynamodb", region_name=region).Table(
            projects_table
        )
        self._sns = (clients or boto3).client("sns", region_name=region)

    def persist(self, project_id: str, station: str, task_token: str) -> dict:
        self._table.update_item(
            Key={"pk": f"PROJECT#{project_id}", "sk": "STATE"},
            UpdateExpression="SET station = :station, task_token = :token, "
            "gsi1pk = :gsi1pk, gsi1sk = :gsi1sk",
            ExpressionAttributeValues={
                ":station": station,
                ":token": task_token,
                ":gsi1pk": f"STATION#{station}#PENDING",
                ":gsi1sk": project_id,
            },
        )

        self._sns.publish(
            TopicArn=self._notifications_topic_arn,
            Subject=f"Hyperdelivery: decision needed ({station})",
            Message=f"Project {project_id} is waiting for a decision at {station}.",
        )
        return {"persisted": True}


def handler(event: dict, context: Any) -> dict:
    """event: {"project_id": ..., "station": "blueprint_approval"|"review_approval",
    "task_token": "$$.Task.Token"}."""
    persister = ApprovalPersister(
        region=os.environ["AWS_REGION"],
        projects_table=os.environ["PROJECTS_TABLE"],
        notifications_topic_arn=os.environ["NOTIFICATIONS_TOPIC_ARN"],
    )
    return persister.persist(event["project_id"], event["station"], event["task_token"])
