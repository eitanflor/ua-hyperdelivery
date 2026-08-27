from fakes import FakeBotoClients, FakeDynamoResource, FakeSnsClient, FakeTable
from orchestration.persist_approval import ApprovalPersister


def _persister(table: FakeTable, sns: FakeSnsClient) -> ApprovalPersister:
    return ApprovalPersister(
        region="ap-southeast-2",
        projects_table="projects",
        notifications_topic_arn="arn:aws:sns:ap-southeast-2:123456789012:topic",
        clients=FakeBotoClients(
            clients={"sns": sns}, resources={"dynamodb": FakeDynamoResource(table)}
        ),
    )


def test_persist_updates_dynamodb_with_token_and_pending_gsi() -> None:
    table = FakeTable()
    sns = FakeSnsClient()
    persister = _persister(table, sns)

    result = persister.persist("proj-1", "blueprint_approval", "token-abc")

    assert result == {"persisted": True}
    assert len(table.update_calls) == 1
    call = table.update_calls[0]
    assert call["Key"] == {"pk": "PROJECT#proj-1", "sk": "STATE"}
    assert call["ExpressionAttributeValues"] == {
        ":station": "blueprint_approval",
        ":token": "token-abc",
        ":gsi1pk": "STATION#blueprint_approval#PENDING",
        ":gsi1sk": "proj-1",
    }


def test_persist_publishes_a_decision_needed_notification() -> None:
    table = FakeTable()
    sns = FakeSnsClient()
    persister = _persister(table, sns)

    persister.persist("proj-1", "review_approval", "token-xyz")

    assert len(sns.publish_calls) == 1
    call = sns.publish_calls[0]
    assert call["TopicArn"] == "arn:aws:sns:ap-southeast-2:123456789012:topic"
    assert "review_approval" in call["Subject"]
    assert "proj-1" in call["Message"]
