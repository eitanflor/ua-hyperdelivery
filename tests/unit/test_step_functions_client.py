from typing import TYPE_CHECKING, Any, cast

from infrastructure.messaging.step_functions import StateMachineClient

if TYPE_CHECKING:
    from mypy_boto3_stepfunctions.client import SFNClient


class _FakeSfnClient:
    def __init__(self) -> None:
        self.calls: list[tuple[str, dict[str, Any]]] = []

    def start_execution(self, **kwargs: Any) -> None:
        self.calls.append(("start_execution", kwargs))

    def send_task_success(self, **kwargs: Any) -> None:
        self.calls.append(("send_task_success", kwargs))

    def send_task_failure(self, **kwargs: Any) -> None:
        self.calls.append(("send_task_failure", kwargs))


def _client() -> tuple[StateMachineClient, _FakeSfnClient]:
    fake = _FakeSfnClient()
    return StateMachineClient(
        state_machine_arn="arn:aws:states:us-east-1:123:stateMachine:hd",
        region="us-east-1",
        sfn_client=cast("SFNClient", fake),
    ), fake


def test_start_execution_uses_project_id_as_execution_name() -> None:
    client, fake = _client()

    client.start_execution("p1")

    name, kwargs = fake.calls[0]
    assert name == "start_execution"
    assert kwargs["stateMachineArn"] == "arn:aws:states:us-east-1:123:stateMachine:hd"
    assert kwargs["name"] == "p1"
    assert kwargs["input"] == '{"project_id": "p1"}'


def test_send_task_success_serializes_output() -> None:
    client, fake = _client()

    client.send_task_success("token123", {"approved": True})

    name, kwargs = fake.calls[0]
    assert name == "send_task_success"
    assert kwargs == {"taskToken": "token123", "output": '{"approved": true}'}


def test_send_task_failure_passes_error() -> None:
    client, fake = _client()

    client.send_task_failure("token123", error="Rejected")

    name, kwargs = fake.calls[0]
    assert name == "send_task_failure"
    assert kwargs == {"taskToken": "token123", "error": "Rejected"}
