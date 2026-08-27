import httpx


class HyperdeliveryClient:
    """Thin HTTP client for the console API - every interface (CLI, web UI, future
    integrations) should depend on this, not hand-roll requests against the API directly."""

    def __init__(self, base_url: str, api_token: str | None = None) -> None:
        headers = {"Authorization": f"Bearer {api_token}"} if api_token else {}
        self._client = httpx.Client(base_url=base_url, headers=headers)

    def create_project(self, name: str) -> dict:
        response = self._client.post("/projects", json={"name": name})
        response.raise_for_status()
        return response.json()

    def get_project(self, project_id: str) -> dict:
        response = self._client.get(f"/projects/{project_id}")
        response.raise_for_status()
        return response.json()

    def list_pending(self, station: str) -> list[dict]:
        response = self._client.get(f"/projects/pending/{station}")
        response.raise_for_status()
        return response.json()

    def submit_decision(
        self, project_id: str, approved: bool, signer: str, comment: str | None = None
    ) -> dict:
        response = self._client.post(
            f"/projects/{project_id}/decisions",
            json={"approved": approved, "signer": signer, "comment": comment},
        )
        response.raise_for_status()
        return response.json()

    def close(self) -> None:
        self._client.close()
