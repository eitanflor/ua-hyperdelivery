"""Read-only GitHub REST client for watching a pull request the console did not open.

Deliberately not the MCP server the agents use: this is polled every few seconds while a
build is in flight, and paying for a model turn to answer "is it green yet" would be
absurd. No token means no watching - the console degrades to plain links.
"""

import logging
import ssl
from typing import NamedTuple, Protocol, cast

import httpx
import truststore

logger = logging.getLogger(__name__)

_API_ROOT = "https://api.github.com"
_TIMEOUT_SECONDS = 10.0
_STATUS_ERROR_THRESHOLD = 400
_FAILED_CONCLUSIONS = ("failure", "timed_out", "canceled")


class PullRequestState(NamedTuple):
    """Where one pull request has got to, as far as the console needs to know."""

    number: int
    #: "open", "merged" or "closed" - merged is not a GitHub state, it is `merged: true`.
    state: str
    #: "pending", "passing", "failing" or "none" when nothing has reported yet.
    checks: str
    draft: bool
    title: str
    url: str


class _Response(Protocol):
    """The subset of `httpx.Response` this client actually calls.

    No `text`: httpx exposes it as a read-only property, which a mutable protocol
    attribute will not accept, and nothing here reads a body it could not parse.
    """

    status_code: int

    def json(self) -> object: ...


class _Client(Protocol):
    """The subset of `httpx.Client` this client actually calls."""

    def get(self, url: str, *, headers: dict[str, str]) -> _Response: ...


def read_pull_request(
    token: str, repository: str, number: int, client: _Client | None = None
) -> PullRequestState | None:
    """Fetch one pull request's state and the verdict of its checks.

    Args:
        token: A GitHub PAT with read access to `repository`.
        repository: "owner/repo".
        number: The pull request number.
        client: Injected in tests; a real `httpx.Client` otherwise, closed before return
            so a poll running every few seconds does not leak a socket per call.

    Returns:
        The state, or `None` when GitHub could not be read - the caller shows the
        pull request as unknown rather than claiming it failed.
    """
    if client is not None:
        return _read(client, token, repository, number)
    # OS trust store, not certifi: under corporate TLS inspection GitHub's cert is
    # re-signed by a root only the system store knows. See CONTRIBUTING.md.
    verify = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    with httpx.Client(timeout=_TIMEOUT_SECONDS, verify=verify) as owned:
        return _read(owned, token, repository, number)


def _read(http: _Client, token: str, repository: str, number: int) -> PullRequestState | None:
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    pull = _get(http, f"{_API_ROOT}/repos/{repository}/pulls/{number}", headers)
    if pull is None:
        return None

    head = _as_json_object(pull.get("head"))
    sha = head.get("sha") if head else None
    return PullRequestState(
        number=number,
        state="merged" if pull.get("merged") else _as_text(pull.get("state"), "open"),
        checks=_checks_verdict(http, repository, sha, headers) if isinstance(sha, str) else "none",
        draft=bool(pull.get("draft")),
        title=_as_text(pull.get("title"), ""),
        url=_as_text(pull.get("html_url"), ""),
    )


def _checks_verdict(http: _Client, repository: str, sha: str, headers: dict[str, str]) -> str:
    """Collapse every check run on a commit into one word.

    A check that has not concluded outranks a failure: a build is only failing once
    everything has had its say, or the console would announce a red build mid-run.
    """
    payload = _get(http, f"{_API_ROOT}/repos/{repository}/commits/{sha}/check-runs", headers)
    raw = payload.get("check_runs") if payload else None
    if not isinstance(raw, list):
        return "none"

    runs = [
        parsed
        for entry in cast("list[object]", raw)
        if (parsed := _as_json_object(entry)) is not None
    ]
    if not runs:
        return "none"
    if any(run.get("status") != "completed" for run in runs):
        return "pending"
    if any(run.get("conclusion") in _FAILED_CONCLUSIONS for run in runs):
        return "failing"
    return "passing"


def _get(http: _Client, url: str, headers: dict[str, str]) -> dict[str, object] | None:
    """One GET, or `None` if GitHub said no - a poll must not raise into the request."""
    try:
        response = http.get(url, headers=headers)
    except httpx.HTTPError:
        logger.warning("could not reach GitHub for %s", url)
        return None
    if response.status_code >= _STATUS_ERROR_THRESHOLD:
        logger.warning("GitHub returned HTTP %s for %s", response.status_code, url)
        return None
    try:
        return _as_json_object(response.json())
    except ValueError:
        logger.warning("GitHub returned a body that is not JSON for %s", url)
        return None


def _as_json_object(value: object) -> dict[str, object] | None:
    return cast("dict[str, object]", value) if isinstance(value, dict) else None


def _as_text(value: object, fallback: str) -> str:
    return value if isinstance(value, str) else fallback
