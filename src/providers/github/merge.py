"""Write-path GitHub client for merging a pull request Review already opened.

Deliberately separate from `pull_requests.py` (that one is read-only, polled on a
timer): this one performs a state change and is only ever called from a human-triggered
console action (`api.routers.projects.merge_build`, or `submit_decision`'s auto-merge on
G3 approval) - no agent tool imports this module, by design (see `tools/github.py`,
AGENTS.md: "merging is a human decision, not an agent one"). `update_branch` and
`mark_ready_for_review` only ever do the mechanical, judgment-free part of that (catching
a branch up to its base; taking a PR out of a draft state the human's own G3 sign-off has
already superseded); a real textual conflict still surfaces as an honest failure, not a
silent guess. Every call retries a couple of times first if GitHub cannot be reached at
all - a dropped connection is not GitHub's verdict, and must not block a G3 approval on
its own.
"""

import logging
import ssl
import time
from collections.abc import Callable
from typing import NamedTuple, Protocol, cast

import httpx
import truststore

from providers.github.http import (
    API_ROOT,
    ERROR_STATUS_THRESHOLD,
    TIMEOUT_SECONDS,
)

logger = logging.getLogger(__name__)
_GRAPHQL_URL = f"{API_ROOT}/graphql"

_STATUS_OK = 200
_STATUS_ACCEPTED = 202
#: A dropped connection through a TLS-inspecting proxy is common enough here that one
#: transient blip must not block a whole G3 approval - a real 4xx/5xx from GitHub itself
#: is not this, and is never retried (callers check `response.status_code` themselves).
_RETRY_ATTEMPTS = 3
_RETRY_BACKOFF_SECONDS = 0.2
#: `merge-async` reports `pending`/`enqueued` until GitHub's background job settles; a
#: real merge (stacked or not) has always finished well inside this ceiling in practice.
_MERGE_SETTLED_STATUSES = ("merged", "failed")
_MERGE_POLL_INTERVAL_SECONDS = 1.0
_MERGE_POLL_ATTEMPTS = 20

#: `markPullRequestReadyForReview` is the only way to flip a PR out of draft: REST's
#: "Update a pull request" body only accepts title/body/state/base/maintainer_can_modify
#: (draft is create-only there), so this needs the PR's GraphQL node id, not its number.
_MARK_READY_MUTATION = """
mutation($id: ID!) {
  markPullRequestReadyForReview(input: {pullRequestId: $id}) {
    pullRequest { id }
  }
}
"""


class MergeResult(NamedTuple):
    """The outcome of one merge attempt, as GitHub reported it."""

    merged: bool
    sha: str | None
    #: GitHub's own message (e.g. a failed required check, a conflict) - surfaced to the
    #: human as-is rather than reworded, since GitHub's verdict is the ground truth here.
    message: str


class _Response(Protocol):
    """The subset of `httpx.Response` this client actually calls."""

    status_code: int

    def json(self) -> object: ...


class _Client(Protocol):
    """The subset of `httpx.Client` this client actually calls."""

    def put(self, url: str, *, headers: dict[str, str], json: dict[str, object]) -> _Response: ...


class _MergeClient(_Client, Protocol):
    """`merge_pull_request`'s verbs: a kickoff, then a poll for its background result."""

    def get(self, url: str, *, headers: dict[str, str]) -> _Response: ...


class _ReadyClient(Protocol):
    """The read-then-GraphQL-write pair `mark_ready_for_review` needs."""

    def get(self, url: str, *, headers: dict[str, str]) -> _Response: ...

    def post(self, url: str, *, headers: dict[str, str], json: dict[str, object]) -> _Response: ...


class _ResolveClient(_MergeClient, _ReadyClient, Protocol):
    """Every verb `resolve_and_merge` needs across its three GitHub calls."""


def _call_with_retries(call: Callable[[], _Response]) -> _Response:
    """Retry a GitHub call on a dropped connection, not on GitHub's own verdict.

    The last attempt is unguarded, so a caller's own `except httpx.HTTPError` still
    sees the final failure exactly as before - this only buys a couple of retries first.
    """
    for attempt in range(_RETRY_ATTEMPTS - 1):
        try:
            return call()
        except httpx.HTTPError:
            time.sleep(_RETRY_BACKOFF_SECONDS * (attempt + 1))
    return call()


def mark_ready_for_review(
    token: str, repository: str, number: int, client: _ReadyClient | None = None
) -> bool:
    """Take a pull request out of GitHub's draft state, if it is in one.

    Copilot opens every pull request it authors as a draft and does not reliably flip it
    to ready itself, and GitHub refuses to merge a draft regardless of CI or approval -
    `merge_pull_request` would just surface that refusal as a real failure without ever
    saying why. Safe to call unconditionally: a PR that is already ready is left alone.

    Returns:
        Whether the pull request is (now) not a draft - `True` for one that never was.
    """
    if client is not None:
        return _mark_ready(client, token, repository, number)
    # OS trust store, not certifi: under corporate TLS inspection GitHub's cert is
    # re-signed by a root only the system store knows. See CONTRIBUTING.md.
    verify = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    with httpx.Client(timeout=TIMEOUT_SECONDS, verify=verify) as owned:
        return _mark_ready(owned, token, repository, number)


def _mark_ready(http: _ReadyClient, token: str, repository: str, number: int) -> bool:
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    pull = _get(http, f"{API_ROOT}/repos/{repository}/pulls/{number}", headers)
    if pull is None:
        return False
    if not pull.get("draft"):
        return True
    node_id = pull.get("node_id")
    if not isinstance(node_id, str):
        logger.warning("GitHub did not return a node id for %s#%s", repository, number)
        return False
    return _post_ready_mutation(http, headers, repository, number, node_id)


def _post_ready_mutation(
    http: _ReadyClient, headers: dict[str, str], repository: str, number: int, node_id: str
) -> bool:
    try:
        response = _call_with_retries(
            lambda: http.post(
                _GRAPHQL_URL,
                headers=headers,
                json={"query": _MARK_READY_MUTATION, "variables": {"id": node_id}},
            )
        )
    except httpx.HTTPError:
        logger.warning("could not reach GitHub to mark %s#%s ready for review", repository, number)
        return False
    if response.status_code != _STATUS_OK:
        logger.warning(
            "GitHub returned HTTP %s marking %s#%s ready for review",
            response.status_code,
            repository,
            number,
        )
        return False
    try:
        raw = response.json()
    except ValueError:
        return False
    body = cast("dict[str, object]", raw) if isinstance(raw, dict) else {}
    errors = body.get("errors")
    if errors:
        logger.warning(
            "GitHub declined to mark %s#%s ready for review: %s", repository, number, errors
        )
        return False
    return True


def _get(http: _ReadyClient, url: str, headers: dict[str, str]) -> dict[str, object] | None:
    """One GET, or `None` if GitHub said no - a best-effort step must not raise."""
    try:
        response = _call_with_retries(lambda: http.get(url, headers=headers))
    except httpx.HTTPError:
        logger.warning("could not reach GitHub for %s", url)
        return None
    if response.status_code >= ERROR_STATUS_THRESHOLD:
        logger.warning("GitHub returned HTTP %s for %s", response.status_code, url)
        return None
    try:
        raw = response.json()
    except ValueError:
        logger.warning("GitHub returned a body that is not JSON for %s", url)
        return None
    return cast("dict[str, object]", raw) if isinstance(raw, dict) else None


def update_branch(token: str, repository: str, number: int, client: _Client | None = None) -> bool:
    """Bring a pull request's branch up to date with its base, if it is behind.

    Purely mechanical - GitHub fast-forwards/merges the base into the head with no
    textual judgment involved, so this is safe to run without a human looking at it
    (unlike an actual conflict, which this cannot and does not try to resolve: if the
    base has diverged in a way git cannot auto-merge, GitHub itself declines and the
    subsequent `merge_pull_request` call surfaces that as a real failure).

    Returns:
        Whether GitHub accepted the update request. `False` (already up to date, or a
        real conflict blocks it) is not an error - the caller always attempts the merge
        afterward and trusts *that* call's verdict, this is just a best-effort head start.
    """
    if client is not None:
        return _update_branch(client, token, repository, number)
    verify = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    with httpx.Client(timeout=TIMEOUT_SECONDS, verify=verify) as owned:
        return _update_branch(owned, token, repository, number)


def _update_branch(http: _Client, token: str, repository: str, number: int) -> bool:
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    url = f"{API_ROOT}/repos/{repository}/pulls/{number}/update-branch"
    try:
        response = _call_with_retries(lambda: http.put(url, headers=headers, json={}))
    except httpx.HTTPError:
        logger.warning("could not reach GitHub to update branch for %s#%s", repository, number)
        return False
    return response.status_code == _STATUS_ACCEPTED


def merge_pull_request(
    token: str, repository: str, number: int, client: _MergeClient | None = None
) -> MergeResult:
    """Merge one pull request, squash-and-merge.

    Args:
        token: A GitHub PAT with write access to `repository`.
        repository: "owner/repo".
        number: The pull request number.
        client: Injected in tests; a real `httpx.Client` otherwise, closed before return.

    Returns:
        Whether the merge succeeded, the resulting commit sha, and GitHub's own message.
    """
    if client is not None:
        return _merge(client, token, repository, number)
    verify = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    with httpx.Client(timeout=TIMEOUT_SECONDS, verify=verify) as owned:
        return _merge(owned, token, repository, number)


def resolve_and_merge(
    token: str, repository: str, number: int, client: _ResolveClient | None = None
) -> MergeResult:
    """Take a pull request out of draft, bring its branch up to date, then merge it.

    The one call site both `merge_build` and an approval's auto-merge should use: a PR
    that is merely a draft, or merely behind its base, is fixed with no human involved -
    the human already made the actual judgment call by signing the G3 gate. A PR with a
    real, textual conflict is not fixed by either step - they simply fail to clear it,
    and the subsequent merge attempt reports GitHub's genuine verdict, unchanged.
    """
    mark_ready_for_review(token, repository, number, client)
    update_branch(token, repository, number, client)
    return merge_pull_request(token, repository, number, client)


def _merge(http: _MergeClient, token: str, repository: str, number: int) -> MergeResult:
    """Kick off GitHub's asynchronous merge and wait for it to settle.

    Not the synchronous `PUT .../merge`: GitHub refuses that one outright for a stacked
    pull request ("Merging stacked PRs via this endpoint is not supported") - `merge-async`
    is the one endpoint that handles both, merging every PR in the stack up to this one.
    """
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    url = f"{API_ROOT}/repos/{repository}/pulls/{number}/merge-async"
    try:
        response = _call_with_retries(
            lambda: http.put(url, headers=headers, json={"merge_method": "squash"})
        )
    except httpx.HTTPError:
        logger.warning("could not reach GitHub to merge %s#%s", repository, number)
        return MergeResult(merged=False, sha=None, message="could not reach GitHub")

    parsed = _parse_async_merge(response)
    if parsed is None:
        logger.warning("GitHub returned an unreadable body merging %s#%s", repository, number)
        return MergeResult(merged=False, sha=None, message="merge failed")
    status, uuid, message, sha = parsed
    if status in _MERGE_SETTLED_STATUSES:
        return _settled_result(repository, number, status, message, sha)
    if uuid is None:
        logger.warning("GitHub started a merge for %s#%s with no UUID to poll", repository, number)
        return MergeResult(merged=False, sha=None, message="merge failed")
    return _poll_async_merge(http, headers, repository, number, uuid)


def _poll_async_merge(
    http: _MergeClient, headers: dict[str, str], repository: str, number: int, uuid: str
) -> MergeResult:
    """Poll GitHub's background merge job until it reports merged or failed."""
    url = f"{API_ROOT}/repos/{repository}/pulls/{number}/merge-async/{uuid}"
    for _attempt in range(_MERGE_POLL_ATTEMPTS):
        time.sleep(_MERGE_POLL_INTERVAL_SECONDS)
        try:
            response = _call_with_retries(lambda: http.get(url, headers=headers))
        except httpx.HTTPError:
            logger.warning("could not reach GitHub to check merge %s#%s", repository, number)
            return MergeResult(merged=False, sha=None, message="could not reach GitHub")
        parsed = _parse_async_merge(response)
        if parsed is None:
            logger.warning(
                "GitHub returned an unreadable body checking merge %s#%s", repository, number
            )
            return MergeResult(merged=False, sha=None, message="merge failed")
        status, _uuid, message, sha = parsed
        if status in _MERGE_SETTLED_STATUSES:
            return _settled_result(repository, number, status, message, sha)
    logger.warning(
        "GitHub had not finished merging %s#%s within the poll budget", repository, number
    )
    return MergeResult(merged=False, sha=None, message="merge is still pending on GitHub")


def _settled_result(
    repository: str, number: int, status: str, message: str, sha: str | None
) -> MergeResult:
    merged = status == "merged"
    if not merged:
        logger.warning("GitHub declined to merge %s#%s: %s", repository, number, message)
    return MergeResult(merged=merged, sha=sha if merged else None, message=message)


def _parse_async_merge(response: _Response) -> tuple[str, str | None, str, str | None] | None:
    """One `merge-async` response as `(status, uuid, message, sha)`, or `None` if unreadable."""
    try:
        raw = response.json()
    except ValueError:
        return None
    body = cast("dict[str, object]", raw) if isinstance(raw, dict) else None
    if body is None:
        return None
    status = body.get("status")
    details = body.get("details")
    if not isinstance(status, str) or not isinstance(details, dict):
        return None
    details = cast("dict[str, object]", details)
    message = details.get("message")
    default_message = "merged" if status == "merged" else "merge failed"
    message_text = message if isinstance(message, str) else default_message
    uuid = details.get("uuid")
    sha = details.get("sha")
    return (
        status,
        uuid if isinstance(uuid, str) else None,
        message_text,
        sha if isinstance(sha, str) else None,
    )
