"""Watching a build pull request: what GitHub says, and what happens when it says nothing."""

from typing import Any

from providers.github.pull_requests import read_pull_request


class _FakeResponse:
    def __init__(self, payload: Any, status_code: int = 200) -> None:
        self.status_code = status_code
        self.text = ""
        self._payload = payload

    def json(self) -> Any:
        return self._payload


class _FakeClient:
    """Answers by URL suffix, so a test only states the parts it cares about."""

    def __init__(self, pull: Any, check_runs: Any = None, status_code: int = 200) -> None:
        self._pull = pull
        self._check_runs = check_runs
        self._status_code = status_code
        self.urls: list[str] = []

    def get(self, url: str, *, headers: dict[str, str]) -> _FakeResponse:
        self.urls.append(url)
        payload = self._check_runs if url.endswith("check-runs") else self._pull
        return _FakeResponse(payload, self._status_code)


def _pull(**overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "state": "open",
        "merged": False,
        "draft": False,
        "title": "Persist history results",
        "html_url": "https://github.com/o/r/pull/7",
        "head": {"sha": "abc123"},
    }
    return base | overrides


def _runs(*conclusions: tuple[str, str | None]) -> dict[str, Any]:
    return {
        "check_runs": [
            {"status": status, "conclusion": conclusion} for status, conclusion in conclusions
        ]
    }


def test_a_pull_request_with_every_check_green_is_passing() -> None:
    client = _FakeClient(_pull(), _runs(("completed", "success"), ("completed", "success")))

    state = read_pull_request("token", "o/r", 7, client)

    assert state is not None
    assert (state.state, state.checks, state.draft) == ("open", "passing", False)
    assert state.title == "Persist history results"


def test_one_unfinished_check_keeps_the_build_pending() -> None:
    client = _FakeClient(_pull(), _runs(("completed", "failure"), ("in_progress", None)))

    state = read_pull_request("token", "o/r", 7, client)

    # a failure mid-run is not a verdict yet - announcing it would be wrong half the time
    assert state is not None
    assert state.checks == "pending"


def test_a_finished_failure_is_a_failure() -> None:
    client = _FakeClient(_pull(), _runs(("completed", "success"), ("completed", "timed_out")))

    state = read_pull_request("token", "o/r", 7, client)

    assert state is not None
    assert state.checks == "failing"


def test_a_merged_pull_request_reports_merged_not_closed() -> None:
    client = _FakeClient(_pull(state="closed", merged=True), _runs(("completed", "success")))

    state = read_pull_request("token", "o/r", 7, client)

    assert state is not None
    assert state.state == "merged"


def test_no_checks_at_all_is_not_a_pass() -> None:
    client = _FakeClient(_pull(), {"check_runs": []})

    state = read_pull_request("token", "o/r", 7, client)

    assert state is not None
    assert state.checks == "none"


def test_a_pull_request_github_refuses_to_show_is_unknown_rather_than_failed() -> None:
    client = _FakeClient(_pull(), status_code=404)

    assert read_pull_request("token", "o/r", 7, client) is None


def test_a_pull_request_with_no_head_sha_is_not_asked_about_checks() -> None:
    client = _FakeClient(_pull(head={}))

    state = read_pull_request("token", "o/r", 7, client)

    assert state is not None
    assert state.checks == "none"
    assert not any(url.endswith("check-runs") for url in client.urls)


def test_a_body_that_is_not_json_is_unknown_rather_than_an_exception() -> None:
    class _Broken(_FakeClient):
        def get(self, url: str, *, headers: dict[str, str]) -> _FakeResponse:
            self.urls.append(url)
            return _BrokenResponse()

    assert read_pull_request("token", "o/r", 7, _Broken(_pull())) is None


class _BrokenResponse(_FakeResponse):
    def __init__(self) -> None:
        super().__init__(None)

    def json(self) -> Any:
        message = "Expecting value"
        raise ValueError(message)
