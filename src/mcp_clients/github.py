"""Generic GitHub MCP client builder - not specific to any one agent.

Reaches GitHub's official *remote* MCP server (`api.githubcopilot.com`), not a locally
run process: plain streamable-HTTP with a PAT bearer token, so there is no Go binary or
Docker-in-Docker to manage inside the agent's own container. See docs/decisions.md.
Callers supply the token and an allowed-tools filter, same shape as `mcp_clients/atlassian.py`.
"""

import re
import ssl
from typing import cast

import httpx
import truststore
from mcp.client.streamable_http import streamable_http_client
from strands.tools.mcp import MCPClient, ToolFilters

from mcp_clients.bounded import BoundedMCPClient

_GITHUB_MCP_URL = "https://api.githubcopilot.com/mcp/"


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
    """
    return httpx.AsyncClient(headers=headers, verify=truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT))


def github_client(pat: str, toolsets: str, allowed_tools: list[str | re.Pattern[str]]) -> MCPClient:
    """Start a client against GitHub's remote MCP server exposing only `allowed_tools`."""
    headers = github_headers(pat, toolsets)
    return BoundedMCPClient(
        lambda: streamable_http_client(
            url=_GITHUB_MCP_URL, http_client=_truststore_http_client(headers)
        ),
        tool_filters=_filters(allowed_tools),
    )
