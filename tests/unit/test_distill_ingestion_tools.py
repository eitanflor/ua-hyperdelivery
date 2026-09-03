import pytest

from tools import distill_ingestion


class _Settings:
    def __init__(
        self,
        github_token: str | None = None,
        github_verify_tls: bool = True,
        github_ca_bundle: str | None = None,
        requests_ca_bundle: str | None = None,
    ) -> None:
        self.github_token = github_token
        self.github_verify_tls = github_verify_tls
        self.github_ca_bundle = github_ca_bundle
        self.requests_ca_bundle = requests_ca_bundle


def test_get_local_document_text_delegates_to_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        distill_ingestion,
        "parse_local_document",
        lambda path: f"parsed::{path}",
    )

    assert distill_ingestion.get_local_document_text("/workspace/input.txt") == (
        "parsed::/workspace/input.txt"
    )


def test_github_get_readme_builds_verify_from_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        distill_ingestion,
        "get_settings",
        lambda: _Settings(
            github_token="abc",
            github_verify_tls=True,
            github_ca_bundle="/etc/ssl/corp.pem",
            requests_ca_bundle=None,
        ),
    )
    calls: dict[str, object] = {}

    def fake_fetch_readme(
        owner_repo: str,
        *,
        token: str | None,
        verify_tls: bool | str,
        timeout_seconds: float = 15.0,
    ) -> str:
        calls["owner_repo"] = owner_repo
        calls["token"] = token
        calls["verify_tls"] = verify_tls
        calls["timeout_seconds"] = timeout_seconds
        return "README"

    monkeypatch.setattr(distill_ingestion, "fetch_readme", fake_fetch_readme)

    result = distill_ingestion.github_get_readme("org/repo")

    assert result == "README"
    assert calls == {
        "owner_repo": "org/repo",
        "token": "abc",
        "verify_tls": "/etc/ssl/corp.pem",
        "timeout_seconds": 15.0,
    }
