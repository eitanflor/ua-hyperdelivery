"""Generic GitHub MCP client builder - not specific to any one agent.

Reaches GitHub's official *remote* MCP server (`api.githubcopilot.com`), not a locally
run process: plain streamable-HTTP with a PAT bearer token, so there is no Go binary or
Docker-in-Docker to manage inside the agent's own container. See docs/decisions.md.
Callers supply the token and an allowed-tools filter, same shape as `mcp_clients/atlassian.py`.
"""

import re
import ssl
from datetime import timedelta
from typing import cast

import httpx
import truststore
from mcp.client.streamable_http import streamable_http_client
from strands.tools.mcp import MCPClient, ToolFilters

from mcp_clients.bounded import BoundedMCPClient

_GITHUB_MCP_URL = "https://api.githubcopilot.com/mcp/"

# The Copilot hand-off does real setup server-side (assigning the coding agent, creating
# the branch) before it answers, and that can run past any timeout we pick - so this is a
# fair-chance budget for a direct answer, not a "must finish by" deadline: review.yaml
# tells the model a timeout here is inconclusive, not a failure, and to verify with
# list_pull_requests/issue_read instead of trusting the timeout either way. Kept above
# BoundedMCPClient's default 60s since this genuinely does more server-side work than a
# file read or an issue lookup, but well below the 240s this used to be - that just left
# the console watching a spinner for up to four minutes for an answer we no longer wait
# on trusting. See docs/decisions.md.
_SLOW_GITHUB_TOOLS = {
    "create_pull_request_with_copilot": timedelta(seconds=90),
    "assign_copilot_to_issue": timedelta(seconds=90),
}


def github_headers(pat: str, toolsets: str) -> dict[str, str]:
    """Build the request headers GitHub's remote MCP server reads.

    `X-MCP-Toolsets` restricts which tool groups the server even registers (server-side,
    coarse); callers still need `tool_filters` on top for exact per-tool least privilege.
    """
    return {"Authorization": f"Bearer {pat}", "X-MCP-Toolsets": toolsets}


def _filters(allowed_tools: list[str | re.Pattern[str]]) -> ToolFilters:
    """Cast at the strands boundary: `list` is invariant and its matcher union is wider."""
    return cast(ToolFilters, {"allowed": allowed_tools})


def _truststore_http_client(headers: dict[str, str]) -> httpx.AsyncClient:
    """OS trust store, not certifi.

    Under TLS-inspecting corporate proxies the remote MCP server's cert is re-signed by
    a root only the system store knows (same fix as `api/auth.py`'s JWKS client).

    `read=None` is deliberate: httpx defaults every unset timeout to 5s, which was
    silently killing the whole MCP session - not just one tool call - on anything slower
    than that (confirmed live: `assign_copilot_to_issue` died in 5.1s with a transport
    `ReadTimeout` no matter how high `_SLOW_GITHUB_TOOLS` was raised, since the connection
    was gone long before that number was ever reached). `BoundedMCPClient`'s per-tool
    timeout is meant to be the one place that decides how long to wait - this only needs
    to outlast it, not duplicate it. Connect/write/pool stay bounded so a genuine network
    failure still fails fast. See docs/decisions.md.
    """
    timeout = httpx.Timeout(connect=10.0, read=None, write=10.0, pool=10.0)
    return httpx.AsyncClient(
        headers=headers, verify=truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT), timeout=timeout
    )


def github_client(pat: str, toolsets: str, allowed_tools: list[str | re.Pattern[str]]) -> MCPClient:
    """Start a client against GitHub's remote MCP server exposing only `allowed_tools`."""
    headers = github_headers(pat, toolsets)
    return BoundedMCPClient(
        lambda: streamable_http_client(
            url=_GITHUB_MCP_URL, http_client=_truststore_http_client(headers)
        ),
        tool_filters=_filters(allowed_tools),
        slow_tools=_SLOW_GITHUB_TOOLS,
    )
