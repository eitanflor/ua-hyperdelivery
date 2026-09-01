import json as json_module
from typing import Any

import pytest

from providers.storage.snowflake import SnowflakeCredentials, run_agent

_CREDS = SnowflakeCredentials(account="acct", pat="secret")


class _FakeResponse:
    def __init__(self, status_code: int, lines: list[str]) -> None:
        self.status_code = status_code
        self._lines = lines
        self.text = "\n".join(lines)

    def iter_lines(self) -> list[str]:
        return self._lines


class _FakeClient:
    def __init__(self, response: _FakeResponse) -> None:
        self._response = response
        self.calls: list[dict[str, Any]] = []

    def post(self, url: str, *, json: dict[str, Any], headers: dict[str, str]) -> _FakeResponse:
        self.calls.append({"url": url, "json": json, "headers": headers})
        return self._response


def _sse(*events: tuple[str, dict[str, Any]]) -> list[str]:
    lines = []
    for event_type, payload in events:
        lines.append(f"event: {event_type}")
        lines.append(f"data: {json_module.dumps(payload)}")
        lines.append("")
    return lines


def test_run_agent_concatenates_response_text_events() -> None:
    response = _FakeResponse(
        200,
        _sse(
            ("response.text.delta", {"text": "MATERIAL_"}),
            ("response.text.delta", {"text": "CODE, "}),
            ("response.text", {"text": "MATERIAL_CODE, "}),
            ("response.text.delta", {"text": "SUPPLIER_NAME"}),
            ("response.text", {"text": "SUPPLIER_NAME"}),
            ("response", {"content": [{"type": "text", "text": "MATERIAL_CODE, SUPPLIER_NAME"}]}),
            ("done", {}),
        ),
    )
    client = _FakeClient(response)

    result = run_agent(_CREDS, "list materials", "be helpful", client=client)

    assert result == "MATERIAL_CODE, SUPPLIER_NAME"


def test_run_agent_ignores_the_done_marker_even_though_it_is_not_json() -> None:
    lines = [*_sse(("response.text", {"text": "ok"})), "event: done", "data: [DONE]"]
    response = _FakeResponse(200, lines)
    client = _FakeClient(response)

    assert run_agent(_CREDS, "q", "s", client=client) == "ok"


def test_run_agent_sends_the_question_and_system_instructions() -> None:
    response = _FakeResponse(200, _sse(("response.text", {"text": "ok"})))
    client = _FakeClient(response)

    run_agent(_CREDS, "what tables exist?", "scoped to schema X", client=client)

    body = client.calls[0]["json"]
    assert body["messages"][0]["content"][0]["text"] == "what tables exist?"
    assert body["instructions"]["system"] == "scoped to schema X"
    assert body["tools"] == [
        {"tool_spec": {"type": "code_toolset_all", "name": "code_toolset_all"}}
    ]


def test_run_agent_raises_on_an_error_status() -> None:
    response = _FakeResponse(403, ["not authorized"])
    client = _FakeClient(response)

    with pytest.raises(RuntimeError, match="403"):
        run_agent(_CREDS, "list materials", "be helpful", client=client)


def test_run_agent_ignores_lines_that_are_not_sse_data() -> None:
    lines = ["", *_sse(("response.status", {"message": "sandbox_ready"}))]
    lines += _sse(("response.text", {"text": "ok"}))
    response = _FakeResponse(200, lines)
    client = _FakeClient(response)

    assert run_agent(_CREDS, "q", "s", client=client) == "ok"
