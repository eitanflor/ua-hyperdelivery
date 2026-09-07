"""MCP tool calls give up instead of hanging forever - and slow tools get longer to."""

from collections.abc import Callable
from datetime import timedelta
from typing import cast

import pytest
from strands.tools.mcp import MCPClient, MCPTransport
from strands.tools.mcp.mcp_agent_tool import MCPAgentTool
from strands.types.collections import PaginatedList

from mcp_clients.bounded import MCP_TOOL_TIMEOUT, BoundedMCPClient


class _FakeTool:
    """Stands in for `MCPAgentTool`: same `tool_name`/`timeout` shape, no real MCP session."""

    def __init__(self, tool_name: str) -> None:
        self._tool_name = tool_name
        self.timeout: timedelta | None = None

    @property
    def tool_name(self) -> str:
        return self._tool_name


def _unused_transport() -> MCPTransport:
    msg = "not used - list_tools_sync is monkey patched"
    raise AssertionError(msg)


def _client(slow_tools: dict[str, timedelta] | None = None) -> BoundedMCPClient:
    return BoundedMCPClient(_unused_transport, slow_tools=slow_tools)


def _stub_list_tools_sync(
    tools: list[_FakeTool],
) -> Callable[..., PaginatedList[MCPAgentTool]]:
    def _stub(_self: MCPClient, *_args: object, **_kwargs: object) -> PaginatedList[MCPAgentTool]:
        return PaginatedList(cast("list[MCPAgentTool]", tools))

    return _stub


def test_tools_get_the_default_timeout_with_no_overrides(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    tools = [_FakeTool("get_file_contents"), _FakeTool("list_issues")]
    monkeypatch.setattr(MCPClient, "list_tools_sync", _stub_list_tools_sync(tools))

    result = _client().list_tools_sync()

    assert [t.timeout for t in result] == [MCP_TOOL_TIMEOUT, MCP_TOOL_TIMEOUT]


def test_a_named_slow_tool_gets_its_own_timeout_and_others_keep_the_default(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    tools = [_FakeTool("create_pull_request_with_copilot"), _FakeTool("list_issues")]
    monkeypatch.setattr(MCPClient, "list_tools_sync", _stub_list_tools_sync(tools))
    slow = {"create_pull_request_with_copilot": timedelta(seconds=240)}

    result = _client(slow_tools=slow).list_tools_sync()

    assert result[0].timeout == timedelta(seconds=240)
    assert result[1].timeout == MCP_TOOL_TIMEOUT
