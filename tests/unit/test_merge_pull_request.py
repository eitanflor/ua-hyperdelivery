"""Merging a build pull request: what GitHub says when it won't, and what happens then.

Both a real conflict and a base branch that has moved past what the PR was opened
against are things GitHub itself refuses the merge for - this module does not try to
resolve either, it only relays GitHub's own verdict (see providers/github/merge.py).
"""

from typing import Any

import httpx
import pytest

from providers.github import merge as merge_module
from providers.github.merge import (
    mark_ready_for_review,
    merge_pull_request,
    resolve_and_merge,
    update_branch,
)


class _FakeResponse:
    def __init__(self, payload: Any, status_code: int = 200) -> None:
        self.status_code = status_code
        self._payload = payload

    def json(self) -> Any:
        return self._payload


def _merged(sha: str, message: str = "Pull Request successfully merged") -> dict[str, object]:
    return {"status": "merged", "details": {"message": message, "sha": sha}}


def _failed(message: str) -> dict[str, object]:
    return {"status": "failed", "details": {"message": message}}


def _pending(uuid: str = "job-1", message: str = "Merge queued") -> dict[str, object]:
    return {"status": "pending", "details": {"message": message, "uuid": uuid}}


class _FakeClient:
    """`put` starts a merge-async job; `get` is only reached when it does not settle at once."""

    def __init__(self, payload: Any, status_code: int = 200) -> None:
        self._payload = payload
        self._status_code = status_code
        self.calls: list[tuple[str, dict[str, object]]] = []

    def put(self, url: str, *, headers: dict[str, str], json: dict[str, object]) -> _FakeResponse:
        self.calls.append((url, json))
        return _FakeResponse(self._payload, self._status_code)

    def get(self, url: str, *, headers: dict[str, str]) -> _FakeResponse:
        raise AssertionError("a merge that settles immediately has no reason to poll")


def test_a_clean_merge_reports_the_resulting_sha() -> None:
    client = _FakeClient(_merged("abc123"), status_code=200)

    result = merge_pull_request("token", "o/r", 7, client)

    assert result.merged is True
    assert result.sha == "abc123"
    assert client.calls[0][0].endswith("/repos/o/r/pulls/7/merge-async")


def test_a_real_conflict_is_reported_not_forced() -> None:
    # GitHub's actual response shape for a merge it will not perform
    client = _FakeClient(_failed("Pull Request is not mergeable"), status_code=400)

    result = merge_pull_request("token", "o/r", 7, client)

    assert result.merged is False
    assert result.sha is None
    assert result.message == "Pull Request is not mergeable"


def test_a_pr_behind_a_protected_base_branch_is_reported_not_updated() -> None:
    # GitHub's actual response when "require branches to be up to date" blocks the merge
    client = _FakeClient(
        _failed("Base branch was modified. Review and try the merge again."), status_code=400
    )

    result = merge_pull_request("token", "o/r", 7, client)

    assert result.merged is False
    assert result.message == "Base branch was modified. Review and try the merge again."


def test_a_sha_mismatch_is_reported_as_github_own_message() -> None:
    client = _FakeClient(
        _failed("Head branch was modified. Review and try the merge again."), status_code=409
    )

    result = merge_pull_request("token", "o/r", 7, client)

    assert result.merged is False
    assert result.message == "Head branch was modified. Review and try the merge again."


def test_a_stacked_pr_merges_via_the_asynchronous_endpoint() -> None:
    # GitHub refuses the synchronous /merge endpoint outright for a stacked pull request
    # ("Merging stacked PRs via this endpoint is not supported") - merge-async is the one
    # endpoint that handles both, and reports the whole stack's merge as settled or not.
    client = _FakeClient(_merged("def456"), status_code=200)

    result = merge_pull_request("token", "o/r", 22, client)

    assert result.merged is True
    assert result.sha == "def456"
    assert client.calls[0][0] == "https://api.github.com/repos/o/r/pulls/22/merge-async"


def test_a_pending_merge_is_polled_until_it_settles(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(merge_module, "_MERGE_POLL_INTERVAL_SECONDS", 0.0)

    class _Async:
        def __init__(self) -> None:
            self.polled: list[str] = []

        def put(
            self, url: str, *, headers: dict[str, str], json: dict[str, object]
        ) -> _FakeResponse:
            return _FakeResponse(_pending("job-1"), status_code=202)

        def get(self, url: str, *, headers: dict[str, str]) -> _FakeResponse:
            self.polled.append(url)
            return _FakeResponse(_merged("abc123"), status_code=200)

    client = _Async()

    result = merge_pull_request("token", "o/r", 22, client)

    assert result.merged is True
    assert result.sha == "abc123"
    assert client.polled == ["https://api.github.com/repos/o/r/pulls/22/merge-async/job-1"]


def test_a_merge_that_never_settles_is_reported_not_left_hanging(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(merge_module, "_MERGE_POLL_INTERVAL_SECONDS", 0.0)
    monkeypatch.setattr(merge_module, "_MERGE_POLL_ATTEMPTS", 2)

    class _NeverSettles:
        def put(
            self, url: str, *, headers: dict[str, str], json: dict[str, object]
        ) -> _FakeResponse:
            return _FakeResponse(_pending("job-1"), status_code=202)

        def get(self, url: str, *, headers: dict[str, str]) -> _FakeResponse:
            return _FakeResponse(_pending("job-1"), status_code=200)

    result = merge_pull_request("token", "o/r", 22, _NeverSettles())

    assert result.merged is False
    assert result.message == "merge is still pending on GitHub"


def test_unreachable_github_is_reported_not_raised() -> None:
    class _Unreachable:
        def put(
            self, url: str, *, headers: dict[str, str], json: dict[str, object]
        ) -> _FakeResponse:
            raise httpx.ConnectError("no route")

        def get(self, url: str, *, headers: dict[str, str]) -> _FakeResponse:
            raise AssertionError("a merge that never starts has no job to poll")

    result = merge_pull_request("token", "o/r", 7, _Unreachable())

    assert result.merged is False
    assert result.sha is None


def test_a_body_that_is_not_json_falls_back_to_a_generic_message() -> None:
    class _Broken(_FakeClient):
        def put(
            self, url: str, *, headers: dict[str, str], json: dict[str, object]
        ) -> _FakeResponse:
            self.calls.append((url, json))
            return _BrokenResponse()

    result = merge_pull_request("token", "o/r", 7, _Broken({}, status_code=400))

    assert result.merged is False
    assert result.message == "merge failed"


class _BrokenResponse(_FakeResponse):
    def __init__(self) -> None:
        super().__init__(None, status_code=400)

    def json(self) -> Any:
        raise ValueError("not json")


def test_update_branch_reports_true_when_github_accepts_it() -> None:
    client = _FakeClient({"message": "Updating pull request branch."}, status_code=202)

    accepted = update_branch("token", "o/r", 7, client)

    assert accepted is True
    assert client.calls[0][0] == "https://api.github.com/repos/o/r/pulls/7/update-branch"


def test_update_branch_reports_false_when_a_real_conflict_blocks_it() -> None:
    client = _FakeClient({"message": "merge conflict"}, status_code=422)

    accepted = update_branch("token", "o/r", 7, client)

    assert accepted is False


def test_resolve_and_merge_updates_the_branch_before_merging() -> None:
    class _Sequenced:
        def __init__(self) -> None:
            self.urls: list[str] = []

        def get(self, url: str, *, headers: dict[str, str]) -> _FakeResponse:
            return _FakeResponse({"draft": False}, status_code=200)

        def post(
            self, url: str, *, headers: dict[str, str], json: dict[str, object]
        ) -> _FakeResponse:
            raise AssertionError("a PR that is already not a draft has no reason to reach GraphQL")

        def put(
            self, url: str, *, headers: dict[str, str], json: dict[str, object]
        ) -> _FakeResponse:
            self.urls.append(url)
            if url.endswith("/update-branch"):
                return _FakeResponse({}, status_code=202)
            return _FakeResponse(_merged("abc123"), status_code=200)

    client = _Sequenced()

    result = resolve_and_merge("token", "o/r", 7, client)

    assert result.merged is True
    assert client.urls == [
        "https://api.github.com/repos/o/r/pulls/7/update-branch",
        "https://api.github.com/repos/o/r/pulls/7/merge-async",
    ]


def test_resolve_and_merge_surfaces_the_merge_verdict_when_update_branch_cannot_help() -> None:
    class _StillConflicted:
        def get(self, url: str, *, headers: dict[str, str]) -> _FakeResponse:
            return _FakeResponse({"draft": False}, status_code=200)

        def post(
            self, url: str, *, headers: dict[str, str], json: dict[str, object]
        ) -> _FakeResponse:
            raise AssertionError("a PR that is already not a draft has no reason to reach GraphQL")

        def put(
            self, url: str, *, headers: dict[str, str], json: dict[str, object]
        ) -> _FakeResponse:
            if url.endswith("/update-branch"):
                return _FakeResponse({}, status_code=422)
            return _FakeResponse(_failed("Pull Request is not mergeable"), status_code=400)

    result = resolve_and_merge("token", "o/r", 7, _StillConflicted())

    assert result.merged is False
    assert result.message == "Pull Request is not mergeable"


def test_resolve_and_merge_takes_a_draft_pr_out_of_draft_before_merging() -> None:
    class _Draft:
        def __init__(self) -> None:
            self.posted: dict[str, object] | None = None

        def get(self, url: str, *, headers: dict[str, str]) -> _FakeResponse:
            return _FakeResponse({"draft": True, "node_id": "PR_kw123456"}, status_code=200)

        def post(
            self, url: str, *, headers: dict[str, str], json: dict[str, object]
        ) -> _FakeResponse:
            self.posted = json
            return _FakeResponse({"data": {"markPullRequestReadyForReview": {}}})

        def put(
            self, url: str, *, headers: dict[str, str], json: dict[str, object]
        ) -> _FakeResponse:
            if url.endswith("/update-branch"):
                return _FakeResponse({}, status_code=202)
            return _FakeResponse(_merged("abc123"), status_code=200)

    client = _Draft()

    result = resolve_and_merge("token", "o/r", 7, client)

    assert result.merged is True
    assert client.posted is not None
    assert client.posted["variables"] == {"id": "PR_kw123456"}


def test_mark_ready_for_review_leaves_a_non_draft_pr_alone() -> None:
    class _NotADraft:
        def get(self, url: str, *, headers: dict[str, str]) -> _FakeResponse:
            return _FakeResponse({"draft": False}, status_code=200)

        def post(
            self, url: str, *, headers: dict[str, str], json: dict[str, object]
        ) -> _FakeResponse:
            raise AssertionError("a PR that is already not a draft has no reason to reach GraphQL")

    assert mark_ready_for_review("token", "o/r", 7, _NotADraft()) is True


def test_mark_ready_for_review_converts_a_draft_via_graphql() -> None:
    class _Draft:
        def get(self, url: str, *, headers: dict[str, str]) -> _FakeResponse:
            return _FakeResponse({"draft": True, "node_id": "PR_kw123456"}, status_code=200)

        def post(
            self, url: str, *, headers: dict[str, str], json: dict[str, object]
        ) -> _FakeResponse:
            assert url == "https://api.github.com/graphql"
            assert json["variables"] == {"id": "PR_kw123456"}
            return _FakeResponse({"data": {"markPullRequestReadyForReview": {}}})

    assert mark_ready_for_review("token", "o/r", 7, _Draft()) is True


def test_mark_ready_for_review_reports_a_graphql_error_as_not_converted() -> None:
    class _Rejected:
        def get(self, url: str, *, headers: dict[str, str]) -> _FakeResponse:
            return _FakeResponse({"draft": True, "node_id": "PR_kw123456"}, status_code=200)

        def post(
            self, url: str, *, headers: dict[str, str], json: dict[str, object]
        ) -> _FakeResponse:
            return _FakeResponse({"errors": [{"message": "not authorized"}]})

    assert mark_ready_for_review("token", "o/r", 7, _Rejected()) is False


def test_mark_ready_for_review_reports_an_unreadable_pr_as_not_converted() -> None:
    class _Unreachable:
        def get(self, url: str, *, headers: dict[str, str]) -> _FakeResponse:
            raise httpx.ConnectError("no route")

        def post(
            self, url: str, *, headers: dict[str, str], json: dict[str, object]
        ) -> _FakeResponse:
            raise AssertionError("should never reach GraphQL without a node id")

    assert mark_ready_for_review("token", "o/r", 7, _Unreachable()) is False
