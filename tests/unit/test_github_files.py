"""Fetching several files from one repo concurrently, in one round trip."""

import base64
from typing import Any

from providers.github.files import fetch_files


class _FakeResponse:
    def __init__(self, payload: Any, status_code: int = 200) -> None:
        self.status_code = status_code
        self._payload = payload

    def json(self) -> Any:
        return self._payload


class _FakeClient:
    """Answers by path suffix, so a test only states the files it cares about."""

    def __init__(self, by_path: dict[str, _FakeResponse]) -> None:
        self._by_path = by_path
        self.urls: list[str] = []

    def get(self, url: str, *, headers: dict[str, str], params: dict[str, str]) -> _FakeResponse:
        self.urls.append(url)
        for path, response in self._by_path.items():
            if url.endswith(f"/contents/{path}"):
                return response
        return _FakeResponse({"message": "Not Found"}, status_code=404)


def _content_response(text: str) -> _FakeResponse:
    encoded = base64.b64encode(text.encode("utf-8")).decode("ascii")
    return _FakeResponse({"content": encoded})


def test_every_path_comes_back_in_the_order_requested() -> None:
    client = _FakeClient(
        {
            "a.py": _content_response("print(1)"),
            "b.py": _content_response("print(2)"),
        }
    )

    results = fetch_files("token", "o/r", ["a.py", "b.py"], client=client)

    assert [r.path for r in results] == ["a.py", "b.py"]
    assert results[0].content == "print(1)"
    assert results[1].content == "print(2)"
    assert all(r.error is None for r in results)


def test_a_missing_file_does_not_fail_the_rest_of_the_batch() -> None:
    client = _FakeClient({"a.py": _content_response("print(1)")})

    results = fetch_files("token", "o/r", ["a.py", "missing.py"], client=client)

    by_path = {r.path: r for r in results}
    assert by_path["a.py"].content == "print(1)"
    assert by_path["missing.py"].content is None
    assert by_path["missing.py"].error == "GitHub returned HTTP 404"


def test_a_directory_path_is_an_error_not_a_crash() -> None:
    client = _FakeClient({"src/": _FakeResponse([{"name": "a.py"}])})

    results = fetch_files("token", "o/r", ["src/"], client=client)

    assert results[0].content is None
    assert results[0].error is not None


def test_a_body_that_is_not_json_is_an_error_not_an_exception() -> None:
    class _Broken(_FakeResponse):
        def json(self) -> Any:
            raise ValueError

    client = _FakeClient({"a.py": _Broken(None)})

    results = fetch_files("token", "o/r", ["a.py"], client=client)

    assert results[0].content is None
    assert results[0].error == "response was not JSON"


def test_no_paths_makes_no_requests() -> None:
    client = _FakeClient({})

    results = fetch_files("token", "o/r", [], client=client)

    assert results == []
    assert client.urls == []


def test_ref_is_passed_through_as_a_query_param() -> None:
    captured: dict[str, dict[str, str]] = {}

    class _CapturingClient(_FakeClient):
        def get(
            self, url: str, *, headers: dict[str, str], params: dict[str, str]
        ) -> _FakeResponse:
            captured[url] = params
            return super().get(url, headers=headers, params=params)

    client = _CapturingClient({"a.py": _content_response("print(1)")})

    fetch_files("token", "o/r", ["a.py"], ref="feature-branch", client=client)

    assert all(params == {"ref": "feature-branch"} for params in captured.values())
