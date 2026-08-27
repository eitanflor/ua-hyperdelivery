"""Python client for the console API."""

from typing import Any

import httpx


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
        response.raise_for_status()
        return response.json()

    def get_project(self, project_id: str) -> dict[str, Any]:
        """Fetch a project's current station and metadata."""
        response = self._client.get(f"/projects/{project_id}")
        response.raise_for_status()
        return response.json()

    def list_pending(self, station: str) -> list[dict[str, Any]]:
        """List the projects waiting for a decision at `station`."""
        response = self._client.get(f"/projects/pending/{station}")
        response.raise_for_status()
        return response.json()

    def submit_decision(
        self, project_id: str, approved: bool, signer: str, comment: str | None = None
    ) -> dict[str, Any]:
        """Approve or reject the gate the project is currently held at."""
        response = self._client.post(
            f"/projects/{project_id}/decisions",
            json={"approved": approved, "signer": signer, "comment": comment},
        )
        response.raise_for_status()
        return response.json()

    def close(self) -> None:
        """Release the underlying connection pool."""
        self._client.close()
