from collections.abc import Callable
from typing import Any

import pytest

from mcp_clients import atlassian


def test_confluence_env_strips_trailing_slash_and_adds_wiki_suffix() -> None:
    env = atlassian.confluence_env("https://ua.atlassian.net/", "e@ua.com", "tok")

    assert env == {
        "CONFLUENCE_URL": "https://ua.atlassian.net/wiki",
        "CONFLUENCE_USERNAME": "e@ua.com",
        "CONFLUENCE_API_TOKEN": "tok",
        "UV_SYSTEM_CERTS": "1",
    }


def test_jira_env_strips_trailing_slash() -> None:
    env = atlassian.jira_env("https://ua.atlassian.net/", "e@ua.com", "tok")

    assert env == {
        "JIRA_URL": "https://ua.atlassian.net",
        "JIRA_USERNAME": "e@ua.com",
        "JIRA_API_TOKEN": "tok",
        "UV_SYSTEM_CERTS": "1",
    }


def test_confluence_client_returns_mcp_client() -> None:
    client = atlassian.confluence_client("https://ua.atlassian.net", "e@ua.com", "tok", [])

    assert isinstance(client, atlassian.MCPClient)


def test_jira_client_returns_mcp_client() -> None:
    client = atlassian.jira_client("https://ua.atlassian.net", "e@ua.com", "tok", [])

    assert isinstance(client, atlassian.MCPClient)


@pytest.mark.parametrize("build", [atlassian.confluence_client, atlassian.jira_client])
def test_both_clients_launch_the_mcp_atlassian_package(
    monkeypatch: pytest.MonkeyPatch, build: Callable[..., Any]
) -> None:
    # the returned client only holds a lazy launcher, so a wrong package name would not
    # fail until an agent first reached for Jira or Confluence
    launched: dict[str, Any] = {}
    real = atlassian.StdioServerParameters

    def spy(**kwargs: Any) -> Any:
        launched.update(kwargs)
        return real(**kwargs)

    monkeypatch.setattr(atlassian, "StdioServerParameters", spy)

    build("https://ua.atlassian.net", "e@ua.com", "tok", [])

    assert (launched["command"], launched["args"]) == ("uvx", ["mcp-atlassian"])
