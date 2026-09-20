import json

from fakes import FakeBotoClients, FakeDynamoResource, FakeSnsClient, FakeTable
from orchestration.persist_question import QuestionPersister


def _persister(table: FakeTable, sns: FakeSnsClient) -> QuestionPersister:
    return QuestionPersister(
        region="us-east-1",
        projects_table="projects",
        notifications_topic_arn="arn:aws:sns:us-east-1:123456789012:topic",
        clients=FakeBotoClients(
            clients={"sns": sns}, resources={"dynamodb": FakeDynamoResource(table)}
        ),
    )


def test_persist_updates_dynamodb_with_token_and_pending_question() -> None:
    table = FakeTable()
    sns = FakeSnsClient()
    persister = _persister(table, sns)
    distill_result = {"status": "questions", "questions": [{"id": "q1", "question": "Who?"}]}

    result = persister.persist("proj-1", distill_result, "the original brief", "token-abc")

    assert result == {"persisted": True}
    assert len(table.update_calls) == 1
    call = table.update_calls[0]
    assert call["Key"] == {"pk": "PROJECT#proj-1", "sk": "STATE"}
    values = call["ExpressionAttributeValues"]
    assert values[":token"] == "token-abc"
    assert values[":gsi1pk"] == "STATION#distill_question#PENDING"
    assert values[":gsi1sk"] == "proj-1"
    assert json.loads(values[":question"]) == {
        "status": "questions",
        "questions": [{"id": "q1", "question": "Who?"}],
        "prior_message": "the original brief",
    }


def test_persist_publishes_a_needs_answer_notification() -> None:
    table = FakeTable()
    sns = FakeSnsClient()
    persister = _persister(table, sns)

    persister.persist("proj-1", {"status": "chat", "message": "hi"}, "brief", "token-xyz")

    assert len(sns.publish_calls) == 1
    call = sns.publish_calls[0]
    assert call["TopicArn"] == "arn:aws:sns:us-east-1:123456789012:topic"
    assert "proj-1" in call["Message"]
