import pytest

from providers.github.files import FileContent
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


def test_review_github_tools_include_code_and_pr_status_grounding() -> None:
    assert set(github._REVIEW_GITHUB_TOOLS) >= {
        "get_file_contents",
        "get_repository_tree",
        "search_code",
        "pull_request_read",
    }
    assert "git" in github._REVIEW_GITHUB_TOOLSETS.split(",")


def test_github_file_contents_batch_tool_returns_none_when_not_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(github, "get_settings", lambda: _StubSettings(pat=None))

    assert github.github_file_contents_batch_tool() is None


def test_github_file_contents_batch_tool_returns_the_tool_when_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(github, "get_settings", lambda: _StubSettings())

    assert github.github_file_contents_batch_tool() is github.get_file_contents_batch


def test_get_file_contents_batch_raises_when_not_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(github, "get_settings", lambda: _StubSettings(pat=None))

    with pytest.raises(ValueError, match="GITHUB_PAT"):
        github.get_file_contents_batch(owner="o", repo="r", paths=["a.py"])


def test_get_file_contents_batch_fetches_every_path_in_one_call(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(github, "get_settings", lambda: _StubSettings())
    captured: dict[str, object] = {}

    def _fake_fetch_files(
        token: str, repository: str, paths: list[str], ref: str | None = None
    ) -> list[FileContent]:
        captured.update(token=token, repository=repository, paths=paths, ref=ref)
        return [
            FileContent(path="a.py", content="print(1)", error=None),
            FileContent(path="missing.py", content=None, error="HTTP 404"),
        ]

    monkeypatch.setattr(github, "fetch_files", _fake_fetch_files)

    result = github.get_file_contents_batch(owner="o", repo="r", paths=["a.py", "missing.py"])

    assert captured == {
        "token": "tok",
        "repository": "o/r",
        "paths": ["a.py", "missing.py"],
        "ref": None,
    }
    assert result == {
        "files": [
            {"path": "a.py", "content": "print(1)", "error": None},
            {"path": "missing.py", "content": None, "error": "HTTP 404"},
        ]
    }
