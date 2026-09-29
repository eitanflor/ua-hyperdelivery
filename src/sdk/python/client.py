"""Python client for the console API."""

from typing import Any, cast

import httpx


class HyperdeliveryError(httpx.HTTPStatusError):
    """The API refused a request. Branch on `code`, not on the message.

    Still an `httpx.HTTPStatusError`, so a caller that catches that keeps working. `code` is
    the API's `ErrorCode` value, or `None` for a failure that carries none (a gateway error, an
    unknown route).
    """

    def __init__(self, response: httpx.Response) -> None:
        """Read the message and code out of the API's `{"detail", "code"}` body."""
        body = _error_body(response)
        detail = body.get("detail")
        code = body.get("code")
        self.detail = detail if isinstance(detail, str) else response.reason_phrase
        self.code = code if isinstance(code, str) else None
        super().__init__(self.detail, request=response.request, response=response)


def _error_body(response: httpx.Response) -> dict[str, object]:
    try:
        body = response.json()
    except ValueError:
        return {}
    return cast("dict[str, object]", body) if isinstance(body, dict) else {}


def _check(response: httpx.Response) -> None:
    if not response.is_success:
        raise HyperdeliveryError(response)


class HyperdeliveryClient:
    """Thin HTTP client for the console API.

    Every interface (CLI, web UI, future integrations) should depend on this rather than
    hand-rolling requests against the API directly.
    """

    def __init__(self, base_url: str, api_token: str | None = None) -> None:
        """Open a session against `base_url`, bearer-authenticated when a token is given."""
        headers = {"Authorization": f"Bearer {api_token}"} if api_token else {}
        self._client = httpx.Client(base_url=base_url, headers=headers)

    def create_project(self, name: str) -> dict[str, Any]:
        """Create a project and start it down the line."""
        response = self._client.post("/projects", json={"name": name})
        _check(response)
        return response.json()

    def get_project(self, project_id: str) -> dict[str, Any]:
        """Fetch a project's current station and metadata."""
        response = self._client.get(f"/projects/{project_id}")
        _check(response)
        return response.json()

    def list_pending(self, station: str) -> list[dict[str, Any]]:
        """List the projects waiting for a decision at `station`."""
        response = self._client.get(f"/projects/pending/{station}")
        _check(response)
        return response.json()

    def list_decisions(self, project_id: str) -> list[dict[str, Any]]:
        """List every gate decision on a project, oldest first."""
        response = self._client.get(f"/projects/{project_id}/decisions")
        _check(response)
        return response.json()

    def submit_decision(
        self, project_id: str, approved: bool, comment: str | None = None
    ) -> dict[str, Any]:
        """Approve or reject the gate the project is currently held at.

        The API records the signed-in caller as the signer.
        """
        response = self._client.post(
            f"/projects/{project_id}/decisions",
            json={"approved": approved, "comment": comment},
        )
        _check(response)
        return response.json()

    def close(self) -> None:
        """Release the underlying connection pool."""
        self._client.close()
