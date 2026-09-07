"""Read-only GitHub REST client for fetching several files from one repo concurrently.

This exists alongside the GitHub MCP server because agents often end up calling
single-file `get_file_contents` repeatedly, which costs extra model round trips.
Given a known list of paths, this issues one GitHub REST request per path (in
parallel via a bounded thread pool) and returns results in the requested order.
"""

import base64
import logging
import ssl
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from typing import NamedTuple, Protocol, cast

import httpx
import truststore

logger = logging.getLogger(__name__)

_API_ROOT = "https://api.github.com"
_TIMEOUT_SECONDS = 10.0
_STATUS_ERROR_THRESHOLD = 400
# Bounds the thread pool, not the request count - GitHub's own rate limit is the real cap.
_MAX_CONCURRENCY = 8


class FileContent(NamedTuple):
    """One requested path's outcome - never raises, so one bad path can't sink the batch."""

    path: str
    content: str | None
    error: str | None


class _Response(Protocol):
    """The subset of `httpx.Response` this client actually calls."""

    status_code: int

    def json(self) -> object: ...


class _Client(Protocol):
    """The subset of `httpx.Client` this client actually calls."""

    def get(self, url: str, *, headers: dict[str, str], params: dict[str, str]) -> _Response: ...


def fetch_files(
    token: str,
    repository: str,
    paths: list[str],
    ref: str | None = None,
    client: _Client | None = None,
) -> list[FileContent]:
    """Fetch several files from one repo concurrently, in one round trip.

    Args:
        token: A GitHub PAT with read access to `repository`.
        repository: "owner/repo".
        paths: File paths relative to the repo root, in the order results are returned.
        ref: Branch, tag or commit sha; the default branch when `None`.
        client: Injected in tests; a real `httpx.Client` otherwise, closed before return.

    Returns:
        One `FileContent` per input path, same order, each independently succeeded or
        failed - a missing or binary file must not blank out the ones that were readable.
    """
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    params = {"ref": ref} if ref else {}
    if client is not None:
        return _fetch_all(client, repository, paths, headers, params)
    # OS trust store, not certifi: under corporate TLS inspection GitHub's cert is
    # re-signed by a root only the system store knows. See CONTRIBUTING.md.
    verify = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    with httpx.Client(timeout=_TIMEOUT_SECONDS, verify=verify) as owned:
        return _fetch_all(owned, repository, paths, headers, params)


def _fetch_all(
    http: _Client,
    repository: str,
    paths: list[str],
    headers: dict[str, str],
    params: dict[str, str],
) -> list[FileContent]:
    if not paths:
        return []
    fetch_one = partial(_fetch_one, http, repository, headers=headers, params=params)
    with ThreadPoolExecutor(max_workers=min(_MAX_CONCURRENCY, len(paths))) as pool:
        return list(pool.map(fetch_one, paths))


def _fetch_one(
    http: _Client, repository: str, path: str, headers: dict[str, str], params: dict[str, str]
) -> FileContent:
    url = f"{_API_ROOT}/repos/{repository}/contents/{path}"
    try:
        response = http.get(url, headers=headers, params=params)
    except httpx.HTTPError:
        logger.warning("could not reach GitHub for %s", path)
        return FileContent(path=path, content=None, error="could not reach GitHub")
    if response.status_code >= _STATUS_ERROR_THRESHOLD:
        return FileContent(
            path=path, content=None, error=f"GitHub returned HTTP {response.status_code}"
        )
    try:
        raw_body = response.json()
    except ValueError:
        return FileContent(path=path, content=None, error="response was not JSON")
    body = _as_json_object(raw_body)
    encoded = body.get("content") if body else None
    if not isinstance(encoded, str):
        error = "no file content in response - is this a directory?"
        return FileContent(path=path, content=None, error=error)
    try:
        decoded = base64.b64decode(encoded).decode("utf-8")
    except (ValueError, UnicodeDecodeError):
        return FileContent(path=path, content=None, error="file is not decodable as UTF-8 text")
    return FileContent(path=path, content=decoded, error=None)


def _as_json_object(value: object) -> dict[str, object] | None:
    return cast("dict[str, object]", value) if isinstance(value, dict) else None
