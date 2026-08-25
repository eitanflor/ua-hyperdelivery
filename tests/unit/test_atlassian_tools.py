from tools import atlassian


class _StubSettings:
    def __init__(self, base_url="https://ua.atlassian.net", email="e@ua.com", api_token="tok"):
        self.atlassian_base_url = base_url
        self.atlassian_email = email
        self.atlassian_api_token = api_token


def test_confluence_env_strips_trailing_slash_and_adds_wiki_suffix():
    env = atlassian._confluence_env("https://ua.atlassian.net/", "e@ua.com", "tok")

    assert env == {
        "CONFLUENCE_URL": "https://ua.atlassian.net/wiki",
        "CONFLUENCE_USERNAME": "e@ua.com",
        "CONFLUENCE_API_TOKEN": "tok",
        "UV_SYSTEM_CERTS": "1",
    }


def test_jira_env_strips_trailing_slash():
    env = atlassian._jira_env("https://ua.atlassian.net/", "e@ua.com", "tok")

    assert env == {
        "JIRA_URL": "https://ua.atlassian.net",
        "JIRA_USERNAME": "e@ua.com",
        "JIRA_API_TOKEN": "tok",
        "UV_SYSTEM_CERTS": "1",
    }


def test_confluence_mcp_client_returns_none_when_not_configured(monkeypatch):
    monkeypatch.setattr(atlassian, "get_settings", lambda: _StubSettings(api_token=None))

    assert atlassian.confluence_mcp_client() is None


def test_confluence_mcp_client_returns_client_when_configured(monkeypatch):
    monkeypatch.setattr(atlassian, "get_settings", lambda: _StubSettings())

    client = atlassian.confluence_mcp_client()

    assert isinstance(client, atlassian.MCPClient)


def test_jira_mcp_client_returns_none_when_not_configured(monkeypatch):
    monkeypatch.setattr(atlassian, "get_settings", lambda: _StubSettings(api_token=None))

    assert atlassian.jira_mcp_client() is None


def test_jira_mcp_client_returns_client_when_configured(monkeypatch):
    monkeypatch.setattr(atlassian, "get_settings", lambda: _StubSettings())

    client = atlassian.jira_mcp_client()

    assert isinstance(client, atlassian.MCPClient)

