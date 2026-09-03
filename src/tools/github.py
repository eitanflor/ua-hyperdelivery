"""Per-agent GitHub tool policy: which MCP tools each station is allowed to call.

The generic client lives in `mcp_clients/github.py`; this module is the least-privilege
gate on top of it (see docs/architecture.md), same shape as `tools/atlassian.py`.
"""

import re

from strands.tools.mcp import MCPClient

from config.settings import get_settings
from mcp_clients.github import github_client

# Blueprint scaffolds a project repo from the golden path template, inspects an existing
# linked repo for brownfield impact analysis, and files one GitHub issue per unit of
# work - no merge, no delete, no org/account administration, no Copilot hand-off (that's
# Review's job - see review_github_mcp_client below). Deliberately excludes
# merge_pull_request/pull_request_review_write: merging is a human decision, not an
# agent one (see AGENTS.md, "do not remove or bypass a human approval gate").
_BLUEPRINT_GITHUB_TOOLS: list[str | re.Pattern[str]] = [
    # repos: create/scaffold, never delete or fork
    "create_repository",
    "search_repositories",
    "get_file_contents",
    "create_or_update_file",
    "push_files",
    "create_branch",
    "list_branches",
    # git: read an existing repo's structure for brownfield impact analysis
    "get_repository_tree",
    # repos: code search, also brownfield impact analysis
    "search_code",
    # issues: one issue per unit of work
    "issue_read",
    "issue_write",
    "list_issues",
    "search_issues",
    "add_issue_comment",
    # pull_requests: open and update, never merge or review
    "create_pull_request",
    "pull_request_read",
    "list_pull_requests",
    "update_pull_request",
    "search_pull_requests",
]

_BLUEPRINT_GITHUB_TOOLSETS = "repos,issues,pull_requests,git"


def blueprint_github_mcp_client() -> MCPClient | None:
    """Repo-scaffolding, brownfield-inspection and issue-filing client for Blueprint.

    None if unconfigured. Reaches GitHub's official remote MCP server (see
    mcp_clients/github.py) - returns None when GITHUB_PAT is not configured.
    """
    settings = get_settings()
    if not settings.github_pat:
        return None

    return github_client(
        settings.github_pat.get_secret_value(),
        _BLUEPRINT_GITHUB_TOOLSETS,
        _BLUEPRINT_GITHUB_TOOLS,
    )


# Review resolves each of its own blocker/major findings to a GitHub issue (an existing
# one from Blueprint's units of work, or a new one for a purely structural finding) and
# assigns it to GitHub Copilot's coding agent - no repo creation, no PR authoring of its
# own, no merge. Only ever used when explicitly asked, same discipline as Blueprint's
# GitHub tools - never a default side effect of producing a ReviewReport (AGENTS.md, "do
# not remove or bypass a human approval gate"). create_pull_request_with_copilot is a
# fallback path when assign_copilot_to_issue's coding-agent session fails to start.
_REVIEW_GITHUB_TOOLS: list[str | re.Pattern[str]] = [
    "issue_read",
    "issue_write",
    "list_issues",
    "search_issues",
    "assign_copilot_to_issue",
    "create_pull_request_with_copilot",
]

_REVIEW_GITHUB_TOOLSETS = "issues,copilot"


def review_github_mcp_client() -> MCPClient | None:
    """Copilot hand-off client for Review, or None when unconfigured.

    Reaches GitHub's official remote MCP server (see mcp_clients/github.py) - returns
    None when GITHUB_PAT is not configured.
    """
    settings = get_settings()
    if not settings.github_pat:
        return None

    return github_client(
        settings.github_pat.get_secret_value(),
        _REVIEW_GITHUB_TOOLSETS,
        _REVIEW_GITHUB_TOOLS,
    )
