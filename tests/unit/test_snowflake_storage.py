import json as json_module
from collections.abc import AsyncIterator
from contextlib import AbstractAsyncContextManager
from types import TracebackType
from typing import Any

import pytest

from providers.storage.snowflake import SnowflakeCredentials, run_agent, stream_agent

_CREDS = SnowflakeCredentials(account="acct", pat="secret")


class _FakeResponse:
    def __init__(self, status_code: int, lines: list[str]) -> None:
        self.status_code = status_code
        self._lines = lines
        self.text = "\n".join(lines)

    async def aread(self) -> bytes:
        return self.text.encode()

    async def aiter_lines(self) -> AsyncIterator[str]:
        for line in self._lines:
            yield line


class _FakeStream(AbstractAsyncContextManager[_FakeResponse]):
    def __init__(self, response: _FakeResponse) -> None:
        self._response = response

    async def __aenter__(self) -> _FakeResponse:
        return self._response

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> bool | None:
        return None


class _FakeClient:
    def __init__(self, response: _FakeResponse) -> None:
        self._response = response
        self.calls: list[dict[str, Any]] = []

    def stream(
        self, method: str, url: str, *, json: dict[str, Any], headers: dict[str, str]
    ) -> _FakeStream:
        self.calls.append({"method": method, "url": url, "json": json, "headers": headers})
        return _FakeStream(self._response)

    async def aclose(self) -> None:
        return None


def _sse(*events: tuple[str, dict[str, Any]]) -> list[str]:
    lines: list[str] = []
    for event_type, payload in events:
        lines.append(f"event: {event_type}")
        lines.append(f"data: {json_module.dumps(payload)}")
        lines.append("")
    return lines


async def test_run_agent_concatenates_response_text_events() -> None:
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

    result = await run_agent(_CREDS, "list materials", "be helpful", client=client)

    assert result == "MATERIAL_CODE, SUPPLIER_NAME"


async def test_stream_agent_yields_each_assembled_response_text_event() -> None:
    response = _FakeResponse(
        200,
        _sse(
            ("response.text.delta", {"text": "MAT"}),
            ("response.text", {"text": "MATERIAL_CODE, "}),
            ("response.text.delta", {"text": "SUP"}),
            ("response.text", {"text": "SUPPLIER_NAME"}),
        ),
    )

    blocks = [
        block
        async for block in stream_agent(
            _CREDS, "list materials", "be helpful", _FakeClient(response)
        )
    ]

    assert blocks == ["MATERIAL_CODE, ", "SUPPLIER_NAME"]


async def test_run_agent_ignores_the_done_marker_even_though_it_is_not_json() -> None:
    lines = [*_sse(("response.text", {"text": "ok"})), "event: done", "data: [DONE]"]
    response = _FakeResponse(200, lines)
    client = _FakeClient(response)

    assert await run_agent(_CREDS, "q", "s", client=client) == "ok"


async def test_run_agent_sends_the_question_and_system_instructions() -> None:
    response = _FakeResponse(200, _sse(("response.text", {"text": "ok"})))
    client = _FakeClient(response)

    await run_agent(_CREDS, "what tables exist?", "scoped to schema X", client=client)

    body = client.calls[0]["json"]
    assert body["messages"][0]["content"][0]["text"] == "what tables exist?"
    assert body["instructions"]["system"] == "scoped to schema X"
    assert body["tools"] == [
        {"tool_spec": {"type": "code_toolset_all", "name": "code_toolset_all"}}
    ]


async def test_run_agent_raises_on_an_error_status() -> None:
    response = _FakeResponse(403, ["not authorized"])
    client = _FakeClient(response)

    with pytest.raises(RuntimeError, match="403"):
        await run_agent(_CREDS, "list materials", "be helpful", client=client)


async def test_run_agent_ignores_lines_that_are_not_sse_data() -> None:
    lines = ["", *_sse(("response.status", {"message": "sandbox_ready"}))]
    lines += _sse(("response.text", {"text": "ok"}))
    response = _FakeResponse(200, lines)
    client = _FakeClient(response)

    assert await run_agent(_CREDS, "q", "s", client=client) == "ok"
