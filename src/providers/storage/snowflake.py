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
from collections.abc import AsyncGenerator, AsyncIterator
from contextlib import AbstractAsyncContextManager
from typing import Any, NamedTuple, Protocol

import httpx
import truststore

_AGENT_RUN_PATH = "/api/v2/cortex/agent:run"
_ORCHESTRATION_MODEL = "claude-sonnet-5"  # Cortex has no Sonnet 5.5 (SHOW CORTEX BASE MODELS)
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


class _AsyncResponse(Protocol):
    """The subset of `httpx.Response` this client actually calls.

    Lets tests inject a plain fake instead of a real HTTP response.
    """

    status_code: int

    async def aread(self) -> bytes: ...

    def aiter_lines(self) -> AsyncIterator[str]: ...


class _AsyncClient(Protocol):
    """The subset of `httpx.AsyncClient` this client actually calls."""

    def stream(
        self, method: str, url: str, *, json: dict[str, Any], headers: dict[str, str]
    ) -> AbstractAsyncContextManager[_AsyncResponse]: ...

    async def aclose(self) -> None: ...


async def stream_agent(
    creds: SnowflakeCredentials,
    question: str,
    system_instructions: str,
    client: _AsyncClient | None = None,
) -> AsyncGenerator[str, None]:
    """Yield each assembled text block from Snowflake's Cortex Coding Agent.

    Reads only `response.text` events: each is the fully assembled text for one reasoning
    block, unlike the `response.text.delta` pieces that precede it. Taking both would
    duplicate every word. Pass `client` to inject a fake in tests.
    """
    http = client or httpx.AsyncClient(
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

    try:
        async with http.stream("POST", url, json=body, headers=headers) as response:
            if response.status_code >= _STATUS_ERROR_THRESHOLD:
                detail = (await response.aread()).decode()[:_MAX_LOGGED_ERROR_CHARS]
                msg = f"Snowflake Cortex Agent returned HTTP {response.status_code}: {detail}"
                raise RuntimeError(msg)

            event_type = ""
            async for line in response.aiter_lines():
                if line.startswith("event: "):
                    event_type = line[len("event: ") :]
                elif line.startswith("data: ") and event_type == _TEXT_EVENT:
                    event = json.loads(line[len("data: ") :])
                    yield event.get("text", "")
    finally:
        if client is None:
            await http.aclose()


async def run_agent(
    creds: SnowflakeCredentials,
    question: str,
    system_instructions: str,
    client: _AsyncClient | None = None,
) -> str:
    """Ask Snowflake's Cortex Coding Agent and return its complete text answer."""
    return "".join(
        [block async for block in stream_agent(creds, question, system_instructions, client)]
    )
