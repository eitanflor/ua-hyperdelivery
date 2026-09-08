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


def complete_spec_content(requirement_ids: list[str] | None = None) -> dict[str, Any]:
    """A StructuredSpec that scores 1.0 against the deterministic G1 gate.

    Artifacts now have to satisfy their real contract to advance the line, so a test that
    only cares about station movement still needs a spec with every traceability edge in
    place - build it here rather than in each test.
    """
    ids = requirement_ids if requirement_ids is not None else ["R1"]
    return {
        "title": "FSD",
        "objective": "Ship the requested workflow",
        "scope": "Backend and console flow",
        "actors": ["Requester", "Reviewer"],
        "requirements": [{"id": rid, "description": f"do {rid}"} for rid in ids],
        "business_rules": [],
        "data_requirements": [],
        "data_connectors": [],
        "snowflake_connectors": [],
        "workflows": [],
        "non_functional_requirements": [],
        "open_questions": [],
        "gate_criteria": [{"id": "G1", "description": "is testable"}],
        "rules": [{"id": "M1", "criterion_id": "G1", "rule": "value must be set"}],
        "rule_correlations": [],
        "evidence": [{"requirement_id": rid, "evidence": "page 1"} for rid in ids],
        "acceptance_criteria": [
            {"id": f"A{i}", "requirement_id": rid, "description": "works"}
            for i, rid in enumerate(ids, start=1)
        ],
        "business_value": [
            {"requirement_id": rid, "use_case": "an analyst", "roi": "saves an hour a week"}
            for rid in ids
        ],
        "intents": [{"requirement_id": rid, "intent": "functional"} for rid in ids],
        "completeness": {"score": 1.0, "gaps": []},
    }


class FakeTable:
    """In-memory stand-in for a boto3 DynamoDB Table resource.

    Covers put_item/get_item/delete_item/query (any single GSI by name convention
    `<index>pk`/`<index>sk`, or a plain pk/begins_with query for the "everything under
    this project" lookups) plus update_item, which is recorded rather than applied - the
    approval Lambda only ever asserts on the call it made.
    """

    def __init__(self) -> None:
        self.items: dict[tuple[str, str], dict[str, Any]] = {}
        self.update_calls: list[dict[str, Any]] = []

    def put_item(self, Item: dict[str, Any]) -> None:
        self.items[(Item["pk"], Item["sk"])] = Item

    def get_item(self, Key: dict[str, Any]) -> dict[str, Any]:
        item = self.items.get((Key["pk"], Key["sk"]))
        return {"Item": item} if item else {}

    def delete_item(self, Key: dict[str, Any]) -> None:
        self.items.pop((Key["pk"], Key["sk"]), None)

    def query(
        self,
        KeyConditionExpression: str,
        ExpressionAttributeValues: dict[str, Any],
        IndexName: str | None = None,
        ScanIndexForward: bool = True,
        Limit: int | None = None,
    ) -> dict[str, Any]:
        if IndexName is not None:
            # e.g. "gsi2pk = :pk" -> pk attribute "gsi2pk", sk attribute "gsi2sk".
            pk_attr = KeyConditionExpression.split(" = ", maxsplit=1)[0].strip()
            sk_attr = pk_attr.replace("pk", "sk")
            target = ExpressionAttributeValues[":pk"]
            matches = [item for item in self.items.values() if item.get(pk_attr) == target]
            matches.sort(key=lambda item: item.get(sk_attr, ""), reverse=not ScanIndexForward)
            return {"Items": matches[:Limit]}
        pk = ExpressionAttributeValues[":pk"]
        if "begins_with" in KeyConditionExpression:
            prefix = ExpressionAttributeValues[":prefix"]
            matches = [
                item
                for (item_pk, item_sk), item in self.items.items()
                if item_pk == pk and item_sk.startswith(prefix)
            ]
        else:
            matches = [item for (item_pk, _), item in self.items.items() if item_pk == pk]
        # real DynamoDB Query guarantees sk order; some repository methods rely on it.
        matches.sort(key=lambda item: item.get("sk", ""), reverse=not ScanIndexForward)
        return {"Items": matches[:Limit]}

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
