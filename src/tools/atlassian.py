import re

from mcp import StdioServerParameters, stdio_client
from strands.tools.mcp import MCPClient

from config.settings import get_settings

# Distill only reads Confluence content - no create/update/delete/move/upload tools.
_READ_ONLY_CONFLUENCE_TOOLS = re.compile(r"^confluence_(get|search|list|check|download)")

# Issue lifecycle only - no sprint/board/service-desk/version/link/watcher/worklog admin tools.
_JIRA_ISSUE_TOOLS = [
    "jira_search",
    "jira_get_issue",
    "jira_get_transitions",
    "jira_transition_issue",
    "jira_add_comment",
    "jira_create_issue",
    "jira_update_issue",
]


def _confluence_env(base_url: str, email: str, api_token: str) -> dict[str, str]:
    return {
        "CONFLUENCE_URL": f"{base_url.rstrip('/')}/wiki",
        "CONFLUENCE_USERNAME": email,
        "CONFLUENCE_API_TOKEN": api_token,
        # trust the OS CA store so `uvx` can fetch the server through TLS-inspecting proxies
        "UV_SYSTEM_CERTS": "1",
    }


def _jira_env(base_url: str, email: str, api_token: str) -> dict[str, str]:
    return {
        "JIRA_URL": base_url.rstrip("/"),
        "JIRA_USERNAME": email,
        "JIRA_API_TOKEN": api_token,
        "UV_SYSTEM_CERTS": "1",
    }


def confluence_mcp_client() -> MCPClient | None:
    """Confluence reached via the community `mcp-atlassian` MCP server (stdio, API-token
    auth), so it's fronted the same way Jira/GitHub/Snowflake connectors will be. Returns
    None when HYPERDELIVERY_ATLASSIAN_BASE_URL/EMAIL/API_TOKEN are not configured."""
    settings = get_settings()
    if not (
        settings.atlassian_base_url and settings.atlassian_email and settings.atlassian_api_token
    ):
        return None

    env = _confluence_env(
        settings.atlassian_base_url, settings.atlassian_email, settings.atlassian_api_token
    )
    params = StdioServerParameters(command="uvx", args=["mcp-atlassian"], env=env)
    return MCPClient(
        lambda: stdio_client(params), tool_filters={"allowed": [_READ_ONLY_CONFLUENCE_TOOLS]}
    )


def jira_mcp_client() -> MCPClient | None:
    """Jira issue lifecycle (find, create, comment, transition) for the coding agent to
    update tickets after finishing work - a separate scoped instance from Confluence's
    read-only client, per the least-privilege split (see /memories/repo/mcp-architecture.md).
    Returns None when HYPERDELIVERY_ATLASSIAN_BASE_URL/EMAIL/API_TOKEN are not configured."""
    settings = get_settings()
    if not (
        settings.atlassian_base_url and settings.atlassian_email and settings.atlassian_api_token
    ):
        return None

    env = _jira_env(
        settings.atlassian_base_url, settings.atlassian_email, settings.atlassian_api_token
    )
    params = StdioServerParameters(command="uvx", args=["mcp-atlassian"], env=env)
    return MCPClient(lambda: stdio_client(params), tool_filters={"allowed": _JIRA_ISSUE_TOOLS})
