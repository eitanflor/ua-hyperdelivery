"""Generic `mcp-atlassian` (stdio) client builders - not specific to any one agent.

Callers supply credentials and an allowed-tools filter, so the same builder serves a
read-only Confluence consumer and a Jira issue-lifecycle consumer. The per-agent policy
that decides which filter applies lives in `tools/atlassian.py`.
"""

import re
from typing import cast

from mcp import StdioServerParameters, stdio_client
from strands.tools.mcp import MCPClient, ToolFilters

from mcp_clients.bounded import BoundedMCPClient


def confluence_env(base_url: str, email: str, api_token: str) -> dict[str, str]:
    """Build the environment the `mcp-atlassian` server needs to reach Confluence."""
    return {
        "CONFLUENCE_URL": f"{base_url.rstrip('/')}/wiki",
        "CONFLUENCE_USERNAME": email,
        "CONFLUENCE_API_TOKEN": api_token,
        # trust the OS CA store so `uvx` can fetch the server through TLS-inspecting proxies
        "UV_SYSTEM_CERTS": "1",
    }


def jira_env(base_url: str, email: str, api_token: str) -> dict[str, str]:
    """Build the environment the `mcp-atlassian` server needs to reach Jira."""
    return {
        "JIRA_URL": base_url.rstrip("/"),
        "JIRA_USERNAME": email,
        "JIRA_API_TOKEN": api_token,
        "UV_SYSTEM_CERTS": "1",
    }


def _filters(allowed_tools: list[str | re.Pattern[str]]) -> ToolFilters:
    """Cast at the strands boundary: `list` is invariant and its matcher union is wider."""
    return cast(ToolFilters, {"allowed": allowed_tools})


def confluence_client(
    base_url: str, email: str, api_token: str, allowed_tools: list[str | re.Pattern[str]]
) -> MCPClient:
    """Start an `mcp-atlassian` Confluence client exposing only `allowed_tools`."""
    params = StdioServerParameters(
        command="uvx", args=["mcp-atlassian"], env=confluence_env(base_url, email, api_token)
    )
    return BoundedMCPClient(lambda: stdio_client(params), tool_filters=_filters(allowed_tools))


def jira_client(
    base_url: str, email: str, api_token: str, allowed_tools: list[str | re.Pattern[str]]
) -> MCPClient:
    """Start an `mcp-atlassian` Jira client exposing only `allowed_tools`."""
    params = StdioServerParameters(
        command="uvx", args=["mcp-atlassian"], env=jira_env(base_url, email, api_token)
    )
    return BoundedMCPClient(lambda: stdio_client(params), tool_filters=_filters(allowed_tools))
