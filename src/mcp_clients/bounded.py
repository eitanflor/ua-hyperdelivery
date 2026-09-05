"""An MCP client whose tool calls give up instead of hanging forever.

Strands builds every `MCPAgentTool` with `timeout=None` (`mcp_client.py`, where
`MCPAgentTool(tool, self)` is constructed), and the `ClientSession` it opens inherits no
read timeout either. With both unset, `mcp.shared.session` calls `anyio.fail_after(None)`
and waits indefinitely for a response that may never come.

That is not a slow-tool problem, it is a wedged-station problem: tool calls in a turn run
concurrently, so one unanswered request blocks the whole turn, and the agent instance is
shared across every invocation the container ever handles - a second call while one is
stuck raises `ConcurrencyException`. One dropped response takes the station down for every
project until the container restarts.

Upstream exposes no parameter for this, so the narrowest seam is stamping the timeout onto
the tools on their way out. See docs/decisions.md.
"""

from datetime import timedelta

from strands.tools.mcp import MCPClient, ToolFilters
from strands.tools.mcp.mcp_agent_tool import MCPAgentTool
from strands.types.collections import PaginatedList

# Generous next to any single remote call this makes (a file read, an issue lookup) and
# far under the console's own 300s read timeout, so the station reports a failed tool
# rather than the console reporting a dead connection.
MCP_TOOL_TIMEOUT = timedelta(seconds=60)


class BoundedMCPClient(MCPClient):
    """`MCPClient` whose tools fail after `MCP_TOOL_TIMEOUT` instead of blocking forever."""

    def list_tools_sync(
        self,
        pagination_token: str | None = None,
        prefix: str | None = None,
        tool_filters: ToolFilters | None = None,
    ) -> PaginatedList[MCPAgentTool]:
        """Adapt the server's tools as usual, then bound each one's wait."""
        tools = super().list_tools_sync(pagination_token, prefix, tool_filters)
        for tool in tools:
            tool.timeout = MCP_TOOL_TIMEOUT
        return tools
