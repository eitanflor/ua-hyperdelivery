"""Shared in-memory test doubles for the AWS seams the production code injects.

Each fake mirrors only the subset of the boto3 API the code actually calls, so if a call
site starts using something new it fails loudly here instead of passing silently against
an over-permissive mock.
"""

from typing import Any

from core.domain.project import Project


def loaded(project: Project | None) -> Project:
    """Assert a project was found, narrowing away the Optional.

    Gives a clear failure at the lookup rather than an AttributeError three lines later.
    """
    assert project is not None
    return project


class FakeTable:
    """In-memory stand-in for a boto3 DynamoDB Table resource.

    Covers put_item/get_item/query (single GSI) plus update_item, which is recorded rather
    than applied - the approval Lambda only ever asserts on the call it made.
    """

    def __init__(self) -> None:
        self.items: dict[tuple[str, str], dict[str, Any]] = {}
        self.update_calls: list[dict[str, Any]] = []

    def put_item(self, Item: dict[str, Any]) -> None:
        self.items[(Item["pk"], Item["sk"])] = Item

    def get_item(self, Key: dict[str, Any]) -> dict[str, Any]:
        item = self.items.get((Key["pk"], Key["sk"]))
        return {"Item": item} if item else {}

    def query(
        self,
        IndexName: str,
        KeyConditionExpression: str,
        ExpressionAttributeValues: dict[str, Any],
    ) -> dict[str, Any]:
        target = ExpressionAttributeValues[":pk"]
        return {"Items": [item for item in self.items.values() if item.get("gsi1pk") == target]}

    def update_item(self, **kwargs: Any) -> None:
        self.update_calls.append(kwargs)


class FakeDynamoResource:
    """Stands in for a boto3 DynamoDB service resource, always handing back one table."""

    def __init__(self, table: FakeTable) -> None:
        self._table = table

    def Table(self, name: str) -> FakeTable:
        return self._table


class FakeSnsClient:
    """Records publishes instead of sending them."""

    def __init__(self) -> None:
        self.publish_calls: list[dict[str, Any]] = []

    def publish(self, **kwargs: Any) -> None:
        self.publish_calls.append(kwargs)


class FakeStateMachineClient:
    """Records Step Functions calls so tests can assert the execution was driven."""

    def __init__(self) -> None:
        self.calls: list[tuple[str, tuple[Any, ...]]] = []

    def start_execution(self, project_id: str) -> None:
        self.calls.append(("start_execution", (project_id,)))

    def send_task_success(self, task_token: str, output: dict[str, Any]) -> None:
        self.calls.append(("send_task_success", (task_token, output)))

    def send_task_failure(self, task_token: str, error: str) -> None:
        self.calls.append(("send_task_failure", (task_token, error)))


class FakeBotoClients:
    """Stands in for the `boto3` module, handing back preconfigured objects by service name.

    Satisfies `infrastructure.aws.BotoClientFactory`. An unregistered service name raises,
    which is the point: it catches a call site reaching for AWS we didn't expect.
    """

    def __init__(
        self,
        clients: dict[str, Any] | None = None,
        resources: dict[str, Any] | None = None,
    ) -> None:
        self._clients = clients or {}
        self._resources = resources or {}

    def client(self, service_name: str, region_name: str | None = None) -> Any:
        return self._clients[service_name]

    def resource(self, service_name: str, region_name: str | None = None) -> Any:
        return self._resources[service_name]
