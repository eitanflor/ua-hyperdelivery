from orchestration.persist_approval import ApprovalPersister


class _FakeTable:
    def __init__(self):
        self.update_calls: list[dict] = []

    def update_item(self, **kwargs):
        self.update_calls.append(kwargs)


class _FakeDynamoResource:
    def __init__(self, table: _FakeTable):
        self._table = table

    def Table(self, name: str):
        return self._table


class _FakeSnsClient:
    def __init__(self):
        self.publish_calls: list[dict] = []

    def publish(self, **kwargs):
        self.publish_calls.append(kwargs)


class _FakeClients:
    def __init__(self, table: _FakeTable, sns: _FakeSnsClient):
        self._table = table
        self._sns = sns

    def resource(self, service_name: str, region_name: str):
        assert service_name == "dynamodb"
        return _FakeDynamoResource(self._table)

    def client(self, service_name: str, region_name: str):
        assert service_name == "sns"
        return self._sns


def test_persist_updates_dynamodb_with_token_and_pending_gsi():
    table = _FakeTable()
    sns = _FakeSnsClient()
    persister = ApprovalPersister(
        region="ap-southeast-2",
        projects_table="projects",
        notifications_topic_arn="arn:aws:sns:ap-southeast-2:123456789012:topic",
        clients=_FakeClients(table, sns),
    )

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


def test_persist_publishes_a_decision_needed_notification():
    table = _FakeTable()
    sns = _FakeSnsClient()
    persister = ApprovalPersister(
        region="ap-southeast-2",
        projects_table="projects",
        notifications_topic_arn="arn:aws:sns:ap-southeast-2:123456789012:topic",
        clients=_FakeClients(table, sns),
    )

    persister.persist("proj-1", "review_approval", "token-xyz")

    assert len(sns.publish_calls) == 1
    call = sns.publish_calls[0]
    assert call["TopicArn"] == "arn:aws:sns:ap-southeast-2:123456789012:topic"
    assert "review_approval" in call["Subject"]
    assert "proj-1" in call["Message"]
