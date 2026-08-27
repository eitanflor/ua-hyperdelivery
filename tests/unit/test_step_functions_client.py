from infrastructure.messaging.step_functions import StateMachineClient


class _FakeSfnClient:
    def __init__(self):
        self.calls: list[tuple[str, dict]] = []

    def start_execution(self, **kwargs):
        self.calls.append(("start_execution", kwargs))

    def send_task_success(self, **kwargs):
        self.calls.append(("send_task_success", kwargs))

    def send_task_failure(self, **kwargs):
        self.calls.append(("send_task_failure", kwargs))


def _client() -> tuple[StateMachineClient, _FakeSfnClient]:
    fake = _FakeSfnClient()
    return StateMachineClient(
        state_machine_arn="arn:aws:states:ap-southeast-2:123:stateMachine:hd",
        region="ap-southeast-2",
        sfn_client=fake,
    ), fake


def test_start_execution_uses_project_id_as_execution_name():
    client, fake = _client()

    client.start_execution("p1")

    name, kwargs = fake.calls[0]
    assert name == "start_execution"
    assert kwargs["stateMachineArn"] == "arn:aws:states:ap-southeast-2:123:stateMachine:hd"
    assert kwargs["name"] == "p1"
    assert kwargs["input"] == '{"project_id": "p1"}'


def test_send_task_success_serializes_output():
    client, fake = _client()

    client.send_task_success("token123", {"approved": True})

    name, kwargs = fake.calls[0]
    assert name == "send_task_success"
    assert kwargs == {"taskToken": "token123", "output": '{"approved": true}'}


def test_send_task_failure_passes_error():
    client, fake = _client()

    client.send_task_failure("token123", error="Rejected")

    name, kwargs = fake.calls[0]
    assert name == "send_task_failure"
    assert kwargs == {"taskToken": "token123", "error": "Rejected"}
