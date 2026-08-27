import pytest

from tools import atlassian


class _StubSettings:
    def __init__(
        self,
        base_url: str | None = "https://ua.atlassian.net",
        email: str | None = "e@ua.com",
        api_token: str | None = "tok",
    ) -> None:
        self.atlassian_base_url = base_url
        self.atlassian_email = email
        self.atlassian_api_token = api_token


def test_confluence_mcp_client_returns_none_when_not_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(atlassian, "get_settings", lambda: _StubSettings(api_token=None))

    assert atlassian.confluence_mcp_client() is None


def test_confluence_mcp_client_returns_client_when_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(atlassian, "get_settings", lambda: _StubSettings())

    client = atlassian.confluence_mcp_client()

    assert isinstance(client, atlassian.MCPClient)


def test_jira_mcp_client_returns_none_when_not_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(atlassian, "get_settings", lambda: _StubSettings(api_token=None))

    assert atlassian.jira_mcp_client() is None


def test_jira_mcp_client_returns_client_when_configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(atlassian, "get_settings", lambda: _StubSettings())

    client = atlassian.jira_mcp_client()

    assert isinstance(client, atlassian.MCPClient)


def test_jira_read_mcp_client_returns_none_when_not_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(atlassian, "get_settings", lambda: _StubSettings(api_token=None))

    assert atlassian.jira_read_mcp_client() is None


def test_jira_read_mcp_client_returns_client_when_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(atlassian, "get_settings", lambda: _StubSettings())

    client = atlassian.jira_read_mcp_client()

    assert isinstance(client, atlassian.MCPClient)
