import pytest

from tools import github


class _SecretStub:
    def __init__(self, value: str) -> None:
        self._value = value

    def get_secret_value(self) -> str:
        return self._value


class _StubSettings:
    def __init__(self, pat: str | None = "tok") -> None:
        self.github_pat = _SecretStub(pat) if pat is not None else None


def test_blueprint_github_mcp_client_returns_none_when_not_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(github, "get_settings", lambda: _StubSettings(pat=None))

    assert github.blueprint_github_mcp_client() is None


def test_blueprint_github_mcp_client_returns_client_when_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(github, "get_settings", lambda: _StubSettings())

    client = github.blueprint_github_mcp_client()

    assert isinstance(client, github.MCPClient)


def test_review_github_mcp_client_returns_none_when_not_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(github, "get_settings", lambda: _StubSettings(pat=None))

    assert github.review_github_mcp_client() is None


def test_review_github_mcp_client_returns_client_when_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(github, "get_settings", lambda: _StubSettings())

    client = github.review_github_mcp_client()

    assert isinstance(client, github.MCPClient)
