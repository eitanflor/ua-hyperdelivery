import pytest
import requests

from providers.github.readme import GithubAccessError, fetch_readme, verify_tls_setting


class _Response:
    def __init__(self, status_code: int, text: str = "") -> None:
        self.status_code = status_code
        self.text = text

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise requests.HTTPError(f"status={self.status_code}")


def test_verify_tls_setting_uses_false_when_disabled() -> None:
    verify = verify_tls_setting(
        verify_flag=False,
        ca_bundle="/corp/custom.pem",
        fallback_ca_bundle="/corp/fallback.pem",
    )

    assert verify is False


def test_verify_tls_setting_prefers_explicit_bundle() -> None:
    verify = verify_tls_setting(
        verify_flag=True,
        ca_bundle="/corp/custom.pem",
        fallback_ca_bundle="/corp/fallback.pem",
    )

    assert verify == "/corp/custom.pem"


def test_fetch_readme_returns_text(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[str] = []

    def fake_get(url: str, **kwargs: object) -> _Response:
        calls.append(url)
        if url.endswith("/readme"):
            return _Response(200, "# demo")
        return _Response(200, "")

    monkeypatch.setattr("providers.github.readme.requests.get", fake_get)

    text = fetch_readme("org/repo", token="token", verify_tls=True)

    assert text == "# demo"
    assert calls == [
        "https://api.github.com/repos/org/repo",
        "https://api.github.com/repos/org/repo/readme",
    ]


def test_fetch_readme_raises_for_inaccessible_repo(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_get(url: str, **kwargs: object) -> _Response:
        return _Response(404, "")

    monkeypatch.setattr("providers.github.readme.requests.get", fake_get)

    with pytest.raises(GithubAccessError, match="not accessible"):
        fetch_readme("org/private-repo", token="token", verify_tls=True)


def test_fetch_readme_raises_when_readme_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_get(url: str, **kwargs: object) -> _Response:
        if url.endswith("/readme"):
            return _Response(404, "")
        return _Response(200, "")

    monkeypatch.setattr("providers.github.readme.requests.get", fake_get)

    with pytest.raises(GithubAccessError, match="README not found"):
        fetch_readme("org/repo", token=None, verify_tls=True)
