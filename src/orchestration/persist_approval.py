"""Step Functions Task glue for the human-approval wait stations.

DynamoDB service integrations only support the REQUEST_RESPONSE pattern (Step Functions
has no `dynamodb:updateItem.waitForTaskToken` - confirmed against the installed CDK's
`DynamoUpdateItem._renderTask`, which never appends a `.waitForTaskToken` suffix). Lambda
is the standard vehicle for combining WAIT_FOR_TASK_TOKEN with a DynamoDB write: this
handler just persists the token + pending-approval GSI attributes and returns immediately
- the execution itself stays paused (independently of this Lambda) until the console API
calls send_task_success/send_task_failure with that token.
"""

import os
from typing import Any

import boto3


def handler(event: dict, context: Any) -> dict:
    """event: {"project_id": ..., "station": "blueprint_approval"|"review_approval",
    "task_token": "$$.Task.Token"}."""
    table = boto3.resource("dynamodb", region_name=os.environ["AWS_REGION"]).Table(
        os.environ["PROJECTS_TABLE"]
    )
    station = event["station"]
    table.update_item(
        Key={"pk": f"PROJECT#{event['project_id']}", "sk": "STATE"},
        UpdateExpression="SET station = :station, task_token = :token, "
        "gsi1pk = :gsi1pk, gsi1sk = :gsi1sk",
        ExpressionAttributeValues={
            ":station": station,
            ":token": event["task_token"],
            ":gsi1pk": f"STATION#{station}#PENDING",
            ":gsi1sk": event["project_id"],
        },
    )
    return {"persisted": True}
