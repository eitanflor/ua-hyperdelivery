import httpx

from sdk.python.client import HyperdeliveryClient


def _client_with_handler(handler) -> HyperdeliveryClient:
    client = HyperdeliveryClient(base_url="http://console.test")
    client._client = httpx.Client(
        base_url="http://console.test", transport=httpx.MockTransport(handler)
    )
    return client


def test_create_project_posts_name_and_returns_json():
    captured = {}

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


def test_get_project_returns_json():
    client = _client_with_handler(
        lambda request: httpx.Response(200, json={"id": "p1", "station": "distill"})
    )

    assert client.get_project("p1") == {"id": "p1", "station": "distill"}


def test_list_pending_hits_correct_path():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        return httpx.Response(200, json=[{"id": "p1"}])

    client = _client_with_handler(handler)

    result = client.list_pending("blueprint_approval")

    assert captured["url"] == "http://console.test/projects/pending/blueprint_approval"
    assert result == [{"id": "p1"}]


def test_submit_decision_posts_payload():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["body"] = request.read()
        return httpx.Response(200, json={"id": "p1", "station": "blueprint"})

    client = _client_with_handler(handler)

    result = client.submit_decision("p1", approved=True, signer="rahul", comment="lgtm")

    assert b'"approved":true' in captured["body"]
    assert b'"signer":"rahul"' in captured["body"]
    assert result == {"id": "p1", "station": "blueprint"}


def test_raises_for_error_response():
    client = _client_with_handler(lambda request: httpx.Response(404, json={"detail": "nope"}))

    try:
        client.get_project("missing")
    except httpx.HTTPStatusError as exc:
        assert exc.response.status_code == 404
    else:
        raise AssertionError("expected HTTPStatusError")
