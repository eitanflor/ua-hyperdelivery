"""Generic Snowflake Cortex Agent client - not specific to any one agent.

Delegates data discovery and fetching to Snowflake's own hosted Coding Agent
(`/api/v2/cortex/agent:run`, `code_toolset_all`) instead of hand-built SQL, so this repo
carries no per-query SQL-building or result-polling logic - Snowflake's own agent decides
what `SHOW`/`DESCRIBE`/`SELECT` to run. Callers supply the account/PAT and a plain-
language question; reusable by any Strands agent project that needs Snowflake data. The
per-agent least-privilege wrapper (the system prompt scoping it to one database/schema,
read-only) lives in tools/snowflake.py.
"""

import json
import ssl
from collections.abc import Iterable
from typing import Any, NamedTuple, Protocol

import httpx
import truststore

_AGENT_RUN_PATH = "/api/v2/cortex/agent:run"
_ORCHESTRATION_MODEL = "claude-sonnet-4-5"
_STATUS_ERROR_THRESHOLD = 400
_MAX_LOGGED_ERROR_CHARS = 500
_TEXT_EVENT = "response.text"
# A live sandbox-provisioning + multi-tool-call run took ~117s for a single-table listing;
# harder questions chain more tool calls, so this leaves real headroom rather than just
# clearing httpx's 5s default. LocalAgentClient's own timeout must stay comfortably above
# this one, since it's proxying this call plus its own FastAPI/Strands overhead.
_TIMEOUT_SECONDS = 240.0


class SnowflakeCredentials(NamedTuple):
    """Bundled to keep `run_agent`'s signature under ruff's positional-arg limit."""

    account: str
    pat: str


class _Response(Protocol):
    """The subset of `httpx.Response` this client actually calls.

    Lets tests inject a plain fake instead of a real HTTP response.
    """

    status_code: int
    text: str

    def iter_lines(self) -> Iterable[str]: ...


class _Client(Protocol):
    """The subset of `httpx.Client` this client actually calls."""

    def post(self, url: str, *, json: dict[str, Any], headers: dict[str, str]) -> _Response: ...


def run_agent(
    creds: SnowflakeCredentials,
    question: str,
    system_instructions: str,
    client: _Client | None = None,
) -> str:
    """Ask Snowflake's Cortex Coding Agent a plain-language question and return its answer.

    Reads the agent's SSE response and concatenates each `response.text` event's text (the
    fully-assembled text for one reasoning block, not the `response.text.delta` pieces it
    was streamed from - taking both would duplicate every word). Sandbox provisioning plus
    tool calls can take well over the default 5s httpx timeout, hence the generous one
    below. Pass `client` to inject a fake in tests.
    """
    http = client or httpx.Client(
        verify=truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT), timeout=_TIMEOUT_SECONDS
    )
    url = f"https://{creds.account}.snowflakecomputing.com{_AGENT_RUN_PATH}"
    headers = {
        "Authorization": f"Bearer {creds.pat}",
        "Content-Type": "application/json",
    }
    body: dict[str, Any] = {
        "messages": [{"role": "user", "content": [{"type": "text", "text": question}]}],
        "models": {"orchestration": _ORCHESTRATION_MODEL},
        "instructions": {"system": system_instructions},
        "tools": [{"tool_spec": {"type": "code_toolset_all", "name": "code_toolset_all"}}],
        "tool_resources": {"code_toolset_all": {"permission_policy": {"type": "always_allow"}}},
    }

    response = http.post(url, json=body, headers=headers)
    if response.status_code >= _STATUS_ERROR_THRESHOLD:
        detail = response.text[:_MAX_LOGGED_ERROR_CHARS]
        msg = f"Snowflake Cortex Agent returned HTTP {response.status_code}: {detail}"
        raise RuntimeError(msg)

    result = ""
    event_type = ""
    for line in response.iter_lines():
        if line.startswith("event: "):
            event_type = line[len("event: ") :]
        elif line.startswith("data: ") and event_type == _TEXT_EVENT:
            event = json.loads(line[len("data: ") :])
            result += event.get("text", "")
    return result
