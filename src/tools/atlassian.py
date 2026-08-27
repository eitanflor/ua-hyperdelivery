"""Per-agent Atlassian tool policy: which MCP tools each station is allowed to call.

The generic clients live in `mcp_clients/atlassian.py`; this module is the least-privilege
gate on top of them (see docs/architecture.md).
"""

import re

from strands.tools.mcp import MCPClient

from config.settings import get_settings
from mcp_clients.atlassian import confluence_client, jira_client

# Distill only reads Confluence content - no create/update/delete/move/upload tools.
_READ_ONLY_CONFLUENCE_TOOLS = re.compile(r"^confluence_(get|search|list|check|download)")

# Issue lifecycle only - no sprint/board/service-desk/version/link/watcher/worklog admin tools.
_JIRA_ISSUE_TOOLS: list[str | re.Pattern[str]] = [
    "jira_search",
    "jira_get_issue",
    "jira_get_transitions",
    "jira_transition_issue",
    "jira_add_comment",
    "jira_create_issue",
    "jira_update_issue",
]


def confluence_mcp_client() -> MCPClient | None:
    """Read-only Confluence client for Distill, or None when unconfigured.

    Reached via the community `mcp-atlassian` MCP server (stdio, API-token auth), so it's
    fronted the same way Jira/GitHub/Snowflake connectors will be. Returns None when
    ATLASSIAN_BASE_URL/EMAIL/API_TOKEN are not configured.
    """
    settings = get_settings()
    if not (
        settings.atlassian_base_url and settings.atlassian_email and settings.atlassian_api_token
    ):
        return None

    return confluence_client(
        settings.atlassian_base_url,
        settings.atlassian_email,
        settings.atlassian_api_token,
        [_READ_ONLY_CONFLUENCE_TOOLS],
    )


def jira_mcp_client() -> MCPClient | None:
    """Jira issue-lifecycle client for Blueprint, or None when unconfigured.

    Covers find, create, comment and transition so the coding agent can update tickets
    after finishing work. A separate scoped instance from Confluence's read-only client,
    per the least-privilege split in docs/architecture.md. Returns None when
    ATLASSIAN_BASE_URL/EMAIL/API_TOKEN are not configured.
    """
    settings = get_settings()
    if not (
        settings.atlassian_base_url and settings.atlassian_email and settings.atlassian_api_token
    ):
        return None

    return jira_client(
        settings.atlassian_base_url,
        settings.atlassian_email,
        settings.atlassian_api_token,
        _JIRA_ISSUE_TOOLS,
    )
