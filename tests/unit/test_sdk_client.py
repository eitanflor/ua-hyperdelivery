from collections.abc import Callable
from typing import Any

import httpx
import pytest

from sdk.python.client import HyperdeliveryClient, HyperdeliveryError


def _client_with_handler(
    handler: Callable[[httpx.Request], httpx.Response],
) -> HyperdeliveryClient:
    client = HyperdeliveryClient(base_url="http://console.test")
    client._client = httpx.Client(
        base_url="http://console.test", transport=httpx.MockTransport(handler)
    )
    return client


def test_create_project_posts_name_and_returns_json() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["method"] = request.method
        captured["url"] = str(request.url)
        captured["body"] = request.read()
        return httpx.Response(201, json={"id": "p1", "name": "My Project", "station": "distill"})

    client = _client_with_handler(handler)

    result = client.create_project("My Project")

    assert captured["method"] == "POST"
    assert captured["url"] == "http://console.test/projects"
    assert result == {"id": "p1", "name": "My Project", "station": "distill"}


def test_get_project_returns_json() -> None:
    client = _client_with_handler(
        lambda request: httpx.Response(200, json={"id": "p1", "station": "distill"})
    )

    assert client.get_project("p1") == {"id": "p1", "station": "distill"}


def test_list_pending_hits_correct_path() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        return httpx.Response(200, json=[{"id": "p1"}])

    client = _client_with_handler(handler)

    result = client.list_pending("blueprint_approval")

    assert captured["url"] == "http://console.test/projects/pending/blueprint_approval"
    assert result == [{"id": "p1"}]


def test_list_decisions_hits_correct_path() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        return httpx.Response(200, json=[{"station": "blueprint_approval"}])

    client = _client_with_handler(handler)

    result = client.list_decisions("p1")

    assert captured["url"] == "http://console.test/projects/p1/decisions"
    assert result == [{"station": "blueprint_approval"}]


def test_submit_decision_posts_payload_without_a_signer() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["body"] = request.read()
        return httpx.Response(200, json={"id": "p1", "station": "blueprint"})

    client = _client_with_handler(handler)

    result = client.submit_decision("p1", approved=True, comment="lgtm")

    assert b'"approved":true' in captured["body"]
    assert b"signer" not in captured["body"]
    assert result == {"id": "p1", "station": "blueprint"}


def test_raises_for_error_response() -> None:
    client = _client_with_handler(lambda request: httpx.Response(404, json={"detail": "nope"}))

    with pytest.raises(httpx.HTTPStatusError) as excinfo:
        client.get_project("missing")

    assert excinfo.value.response.status_code == 404


def test_an_error_response_carries_the_apis_code_and_message() -> None:
    body = {"detail": "project not found", "code": "project_not_found"}
    client = _client_with_handler(lambda request: httpx.Response(404, json=body))

    with pytest.raises(HyperdeliveryError) as excinfo:
        client.get_project("missing")

    assert (excinfo.value.code, excinfo.value.detail) == ("project_not_found", "project not found")


def test_a_redirect_is_not_treated_as_success() -> None:
    client = _client_with_handler(lambda request: httpx.Response(302, headers={"location": "/x"}))

    with pytest.raises(HyperdeliveryError) as excinfo:
        client.get_project("p1")

    assert excinfo.value.response.status_code == 302


def test_an_error_without_a_code_still_raises_with_the_status_message() -> None:
    client = _client_with_handler(lambda request: httpx.Response(502, text="bad gateway"))

    with pytest.raises(HyperdeliveryError) as excinfo:
        client.get_project("p1")

    assert excinfo.value.code is None
    assert excinfo.value.response.status_code == 502
