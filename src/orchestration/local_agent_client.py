"""Local-dev-only substitute for the Step Functions/AgentCore Runtime orchestration path.

That real path (agent_invoker.py, a Lambda calling AgentCore Runtime) requires both the
state machine and the AgentCore runtimes to be deployed - both blocked on IAM (see
docs/decisions.md). This client instead talks straight to an agent's local dev HTTP
server (`make dev-distill` etc., ports per the Makefile) so the console UI has something
real to demo against without any AWS deploy. Never used in production - the console API
only wires this in when `state_machine_arn` is unset.
"""

import json
from collections.abc import Callable, Iterator
from typing import Any, Protocol

import requests

_AGENT_PORTS = {"distill": 8080, "blueprint": 8081, "review": 8082, "showroom": 8083}
# Must stay comfortably above providers.storage.snowflake's own 240s timeout, since a
# Distill call that uses snowflake_query blocks this whole hop until that one returns -
# 120s here caused real ReadTimeoutErrors on a ~117s Snowflake Cortex Agent call.
_READ_TIMEOUT_SECONDS = 300


class _Response(Protocol):
    """The subset of `requests.Response` this client actually calls.

    Lets tests inject a plain fake instead of a real HTTP response.
    """

    def raise_for_status(self) -> None: ...
    def iter_lines(self, decode_unicode: bool = True) -> Iterator[str]: ...
    def close(self) -> None: ...


class _Session(Protocol):
    """The subset of the `requests` module (or a session) this client actually calls."""

    def post(
        self, url: str, json: dict[str, Any], timeout: int, stream: bool = False
    ) -> _Response: ...


class LocalAgentClient:
    """Talks to one agent's local dev HTTP server (see module docstring)."""

    def __init__(self, base_url: str = "http://localhost", session: _Session | None = None) -> None:
        """Pass `session` to inject a fake instead of the real `requests` module."""
        self._base_url = base_url
        self._session = session or requests

    def stream(
        self,
        agent: str,
        prompt: str,
        on_response: Callable[[Any], None] | None = None,
    ) -> Iterator[dict[str, Any]]:
        """Yields the agent's events as they arrive over its `/invocations` SSE response.

        See agent_runtime.factory: `{"chunk": str}` for each piece of streamed text,
        `{"draft": str}` for each slice of the artifact's JSON as it is written,
        `{"tool_call": {"id", "name", "status", "result"}}` for each tool call, at most
        one `{"usage": {...}}` with the turn's token counts, followed by exactly one of
        `{"result": dict}` or `{"error": str}`.

        Pass `on_response` to receive the raw response as soon as it opens - the only
        way to interrupt the blocking read below from another thread (e.g. when the
        console API's own caller disconnects) is to call `.close()` on it; see
        `api.routers.projects.advance_project_stream`, the only real caller.
        """
        port = _AGENT_PORTS[agent]
        resp = self._session.post(
            f"{self._base_url}:{port}/invocations",
            json={"prompt": prompt},
            timeout=_READ_TIMEOUT_SECONDS,
            stream=True,
        )
        resp.raise_for_status()
        if on_response is not None:
            on_response(resp)
        for line in resp.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data: "):
                continue
            yield json.loads(line[len("data: ") :])

    def invoke(self, agent: str, prompt: str) -> dict[str, Any] | None:
        """Drains `stream()` and returns just the final result.

        For callers that don't need the incremental chunks. Returns `None` if the
        stream ended cleanly without producing a result - a valid outcome for an agent
        wired with `force_structured_output=False` (see agent_runtime.factory), meaning
        the model chose not to draft anything this turn.
        """
        for event in self.stream(agent, prompt):
            if "error" in event:
                msg = f"{agent} agent invocation failed: {event['error']}"
                raise RuntimeError(msg)
            if "result" in event:
                return event["result"]
        return None
