"""GitHub content fetchers, reusable by agent tools."""

from __future__ import annotations

import requests

_HTTP_NOT_FOUND = 404


class GithubAccessError(ValueError):
    """Raised when a repository or README cannot be accessed."""


def verify_tls_setting(
    *, verify_flag: bool, ca_bundle: str | None, fallback_ca_bundle: str | None
) -> bool | str:
    """Build the Requests `verify` value from explicit settings."""
    if not verify_flag:
        return False
    if ca_bundle:
        return ca_bundle
    if fallback_ca_bundle:
        return fallback_ca_bundle
    return True


def github_headers(token: str | None) -> dict[str, str]:
    """Return headers for GitHub API calls."""
    headers = {"Accept": "application/vnd.github.raw+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def fetch_readme(
    owner_repo: str,
    *,
    token: str | None,
    verify_tls: bool | str,
    timeout_seconds: float = 15.0,
) -> str:
    """Fetch a repository README from GitHub as plain text."""
    headers = github_headers(token)
    repo_url = f"https://api.github.com/repos/{owner_repo}"
    repo_resp = requests.get(repo_url, headers=headers, timeout=timeout_seconds, verify=verify_tls)

    if repo_resp.status_code == _HTTP_NOT_FOUND:
        msg = (
            f"Repository '{owner_repo}' is not accessible. For private repos, set "
            "GITHUB_TOKEN with repo access and authorize SSO for your org if required."
        )
        raise GithubAccessError(msg)
    repo_resp.raise_for_status()

    readme_url = f"https://api.github.com/repos/{owner_repo}/readme"
    readme_resp = requests.get(
        readme_url,
        headers=headers,
        timeout=timeout_seconds,
        verify=verify_tls,
    )
    if readme_resp.status_code == _HTTP_NOT_FOUND:
        msg = f"README not found for '{owner_repo}' at repository root via /readme endpoint."
        raise GithubAccessError(msg)
    readme_resp.raise_for_status()
    return readme_resp.text
