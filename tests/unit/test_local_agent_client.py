import json
from collections.abc import Iterator
from typing import Any

import pytest

from orchestration.local_agent_client import LocalAgentClient


def _sse(*events: dict[str, Any]) -> list[str]:
    return [f"data: {json.dumps(e)}" for e in events]


class _FakeResponse:
    def __init__(self, lines: list[str], status_code: int = 200) -> None:
        self._lines = lines
        self.status_code = status_code

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")

    def iter_lines(self, decode_unicode: bool = True) -> Iterator[str]:
        return iter(self._lines)


class _FakeSession:
    def __init__(self, lines: list[str]) -> None:
        self._lines = lines
        self.last_call: dict[str, Any] | None = None

    def post(
        self, url: str, json: dict[str, Any], timeout: int, stream: bool = False
    ) -> _FakeResponse:
        self.last_call = {"url": url, "json": json, "timeout": timeout, "stream": stream}
        return _FakeResponse(self._lines)


def test_invoke_posts_to_the_agents_local_port_and_returns_result() -> None:
    session = _FakeSession(_sse({"result": {"title": "FSD"}}))
    client = LocalAgentClient(session=session)

    result = client.invoke("distill", "Project p1")

    assert result == {"title": "FSD"}
    assert session.last_call is not None
    assert session.last_call["url"] == "http://localhost:8080/invocations"
    assert session.last_call["json"] == {"prompt": "Project p1"}
    assert session.last_call["stream"] is True


def test_invoke_uses_the_correct_port_per_agent() -> None:
    session = _FakeSession(_sse({"result": {}}))
    client = LocalAgentClient(session=session)

    client.invoke("showroom", "Project p1")

    assert session.last_call is not None
    assert session.last_call["url"] == "http://localhost:8083/invocations"


def test_invoke_raises_when_agent_returns_error() -> None:
    session = _FakeSession(_sse({"error": "boom"}))
    client = LocalAgentClient(session=session)

    with pytest.raises(RuntimeError, match="boom"):
        client.invoke("distill", "Project p1")


def test_invoke_skips_chunk_events_and_returns_the_final_result() -> None:
    session = _FakeSession(
        _sse({"chunk": "Analyzing"}, {"chunk": "the request..."}, {"result": {"title": "FSD"}})
    )
    client = LocalAgentClient(session=session)

    assert client.invoke("distill", "Project p1") == {"title": "FSD"}


def test_stream_yields_chunks_then_the_final_result() -> None:
    session = _FakeSession(
        _sse({"chunk": "Analyzing"}, {"chunk": "..."}, {"result": {"title": "FSD"}})
    )
    client = LocalAgentClient(session=session)

    assert list(client.stream("distill", "Project p1")) == [
        {"chunk": "Analyzing"},
        {"chunk": "..."},
        {"result": {"title": "FSD"}},
    ]
