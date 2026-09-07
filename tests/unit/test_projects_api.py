import json
from collections.abc import Callable, Iterator
from types import SimpleNamespace
from typing import Any, Never, cast

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import SecretStr

from api.auth import CurrentUser, get_current_user
from api.main import create_app
from core.domain.project import Station
from fakes import FakeStateMachineClient, FakeTable, complete_spec_content, loaded
from infrastructure.local_preview import PreviewTarget, PullResult
from infrastructure.repositories.project_repository import ProjectRepository
from providers.github.merge import MergeResult
from providers.github.pull_requests import PullRequestState


def _state(client: TestClient) -> Any:
    """TestClient types `.app` as a bare ASGI callable, which hides `.state`."""
    return cast(FastAPI, client.app).state


class _FakeAgentResponse:
    """Stands in for the raw HTTP response `LocalAgentClient.stream` hands to `on_response`."""

    def __init__(self) -> None:
        self.closed = False

    def close(self) -> None:
        self.closed = True


class _FakeLocalAgentClient:
    def __init__(
        self,
        result: dict[str, Any] | None = None,
        results: list[dict[str, Any]] | None = None,
        events: list[dict[str, Any]] | None = None,
    ) -> None:
        self.result = result if result is not None else {"title": "FSD"}
        self._results = list(results) if results is not None else None
        # yielded verbatim before the result, the way the real client relays whatever
        # the agent's SSE stream sent
        self._events = events if events is not None else []
        self.calls: list[tuple[str, str]] = []
        self.last_response = _FakeAgentResponse()

    def _next_result(self) -> dict[str, Any]:
        if self._results is not None:
            return self._results.pop(0) if self._results else self.result
        return self.result

    def invoke(self, agent: str, prompt: str) -> dict[str, Any]:
        self.calls.append((agent, prompt))
        return self._next_result()

    def stream(
        self, agent: str, prompt: str, on_response: Callable[[Any], None] | None = None
    ) -> Iterator[dict[str, Any]]:
        self.calls.append((agent, prompt))
        if on_response is not None:
            on_response(self.last_response)
        yield from self._events
        yield {"result": self._next_result()}


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    # avoid create_app() reaching for real AWS credentials/table during app construction
    def fake_init(
        self: ProjectRepository,
        table_name: str,
        region: str,
        dynamodb_resource: object = None,
    ) -> None:
        self.__dict__["_table"] = FakeTable()

    monkeypatch.setattr(ProjectRepository, "__init__", fake_init)
    app = create_app()
    app.state.state_machine_client = FakeStateMachineClient()
    # sign-in is exercised separately in test_auth.py - everything else assumes an
    # already-authenticated caller, matching how the endpoint tests were written before
    # auth existed.
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(oid="test-user")
    return TestClient(app)


def test_create_and_get_project(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()

    assert created["station"] == Station.DISTILL.value

    fetched = client.get(f"/projects/{created['id']}").json()
    assert fetched == created


def test_list_projects_returns_every_project(client: TestClient) -> None:
    first = client.post("/projects", json={"name": "First"}).json()
    second = client.post("/projects", json={"name": "Second"}).json()

    listed = client.get("/projects").json()

    assert {p["id"] for p in listed} == {first["id"], second["id"]}


def test_requests_without_a_sign_in_token_are_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    # unlike `client`, this app has no get_current_user override - it exercises the
    # real dependency, so a request with no Authorization header should 401 rather
    # than reach the route handler at all.
    def fake_init(
        self: ProjectRepository,
        table_name: str,
        region: str,
        dynamodb_resource: object = None,
    ) -> None:
        self.__dict__["_table"] = FakeTable()

    monkeypatch.setattr(ProjectRepository, "__init__", fake_init)
    app = create_app()
    resp = TestClient(app).post("/projects", json={"name": "My Project"})
    assert resp.status_code == 401


def test_create_project_generates_a_name_from_a_message_when_no_name_given(
    client: TestClient,
) -> None:
    class _FakeProjectNamer:
        def generate(self, message: str) -> str:
            self.received = message
            return "Feedback Portal"

    fake_namer = _FakeProjectNamer()
    _state(client).project_namer = fake_namer

    resp = client.post("/projects", json={"message": "We want a feedback portal."})

    # the response comes back with the instant heuristic name - the console UI must not
    # wait on the naming model call to navigate to the new project
    assert resp.status_code == 201
    assert resp.json()["name"] == "We want a feedback portal."
    assert fake_namer.received == "We want a feedback portal."

    # TestClient drives background tasks to completion before returning, so the nicer
    # AI-generated name is already applied by the time we look again
    project_id = resp.json()["id"]
    fetched = client.get(f"/projects/{project_id}").json()
    assert fetched["name"] == "Feedback Portal"


def test_create_project_400s_when_neither_name_nor_message_given(client: TestClient) -> None:
    resp = client.post("/projects", json={})

    assert resp.status_code == 400


def test_get_project_404(client: TestClient) -> None:
    resp = client.get("/projects/does-not-exist")
    assert resp.status_code == 404


def test_delete_project_removes_it(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "distill", {"title": "FSD"})

    resp = client.delete(f"/projects/{created['id']}")

    assert resp.status_code == 204
    assert client.get(f"/projects/{created['id']}").status_code == 404
    assert client.get(f"/projects/{created['id']}/artifacts").json() == []


def test_delete_project_404s_for_an_unknown_project(client: TestClient) -> None:
    resp = client.delete("/projects/does-not-exist")
    assert resp.status_code == 404


def test_rename_project_updates_the_name(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "Old Name"}).json()

    resp = client.patch(f"/projects/{created['id']}", json={"name": "New Name"})

    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"
    assert client.get(f"/projects/{created['id']}").json()["name"] == "New Name"


def test_rename_project_404s_for_an_unknown_project(client: TestClient) -> None:
    resp = client.patch("/projects/does-not-exist", json={"name": "New Name"})
    assert resp.status_code == 404


def test_rename_project_400s_for_a_blank_name(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "Old Name"}).json()

    resp = client.patch(f"/projects/{created['id']}", json={"name": "   "})

    assert resp.status_code == 400


def test_decision_rejected_for_project_not_awaiting_approval(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(
        f"/projects/{created['id']}/decisions",
        json={"approved": True, "signer": "rahul"},
    )

    assert resp.status_code == 409


def test_decision_advances_station_and_appears_in_pending_list(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    project = loaded(repo.get_project(created["id"]))
    project.station = Station.BLUEPRINT_APPROVAL
    repo._table.put_item(Item=repo._state_item(project))

    pending = client.get(f"/projects/pending/{Station.BLUEPRINT_APPROVAL.value}").json()
    assert [p["id"] for p in pending] == [created["id"]]

    resp = client.post(
        f"/projects/{created['id']}/decisions",
        json={"approved": True, "signer": "rahul"},
    )

    assert resp.status_code == 200
    assert resp.json()["station"] == Station.BLUEPRINT.value


def test_create_project_starts_a_state_machine_execution(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()

    sfn: FakeStateMachineClient = _state(client).state_machine_client
    assert sfn.calls == [("start_execution", (created["id"],))]


def test_approved_decision_resumes_execution_via_task_token(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    project = loaded(repo.get_project(created["id"]))
    project.station = Station.BLUEPRINT_APPROVAL
    project.task_token = "token-123"
    repo._table.put_item(Item=repo._state_item(project))

    client.post(
        f"/projects/{created['id']}/decisions",
        json={"approved": True, "signer": "rahul"},
    )

    sfn: FakeStateMachineClient = _state(client).state_machine_client
    assert ("send_task_success", ("token-123", {"approved": True})) in sfn.calls


def test_rejected_decision_fails_execution_via_task_token(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    project = loaded(repo.get_project(created["id"]))
    project.station = Station.BLUEPRINT_APPROVAL
    project.task_token = "token-123"
    repo._table.put_item(Item=repo._state_item(project))

    client.post(
        f"/projects/{created['id']}/decisions",
        json={"approved": False, "signer": "rahul"},
    )

    sfn: FakeStateMachineClient = _state(client).state_machine_client
    assert ("send_task_failure", ("token-123", "Rejected")) in sfn.calls


def test_get_artifact_404_when_missing(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.get(f"/projects/{created['id']}/artifacts/distill")

    assert resp.status_code == 404


def test_get_artifact_returns_saved_content(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "distill", {"title": "FSD"})

    resp = client.get(f"/projects/{created['id']}/artifacts/distill")

    assert resp.status_code == 200
    body = resp.json()
    assert body["agent"] == "distill"
    assert body["content"] == {"title": "FSD"}


def test_list_artifacts_returns_all_agents_for_project(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "distill", {"title": "FSD"})
    repo.save_artifact(created["id"], "blueprint", {"title": "TDD"})

    resp = client.get(f"/projects/{created['id']}/artifacts")

    assert resp.status_code == 200
    assert {a["agent"] for a in resp.json()} == {"distill", "blueprint"}


def test_advance_invokes_the_local_agent_and_moves_to_the_next_station(client: TestClient) -> None:
    _state(client).state_machine_client = None
    fake_agent = _FakeLocalAgentClient(complete_spec_content())
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(
        f"/projects/{created['id']}/advance",
        json={"prompt": "Users must be able to reset their password via email."},
    )

    assert resp.status_code == 200
    assert resp.json()["station"] == Station.BLUEPRINT_APPROVAL.value
    assert fake_agent.calls == [
        ("distill", "Users must be able to reset their password via email.")
    ]
    artifact = client.get(f"/projects/{created['id']}/artifacts/distill").json()
    assert artifact["content"]["title"] == "FSD"


def test_advance_falls_back_to_a_placeholder_prompt_when_none_given(client: TestClient) -> None:
    _state(client).state_machine_client = None
    fake_agent = _FakeLocalAgentClient({"title": "FSD"})
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(f"/projects/{created['id']}/advance")

    assert resp.status_code == 200
    assert fake_agent.calls == [("distill", f"Project {created['id']}")]


def test_advance_prepends_the_predecessor_artifact_as_context(client: TestClient) -> None:
    _state(client).state_machine_client = None
    fake_agent = _FakeLocalAgentClient({"title": "Blueprint draft"})
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "distill", {"title": "FSD", "requirements": []})
    project = loaded(repo.get_project(created["id"]))
    project.station = Station.BLUEPRINT
    repo._table.put_item(Item=repo._state_item(project))

    resp = client.post(
        f"/projects/{created['id']}/advance", json={"prompt": "Blueprint may begin."}
    )

    assert resp.status_code == 200
    agent, prompt = fake_agent.calls[0]
    assert agent == "blueprint"
    assert '"title": "FSD"' in prompt
    assert prompt.endswith("Blueprint may begin.")


def test_advance_stays_at_the_same_station_when_gaps_are_flagged(client: TestClient) -> None:
    _state(client).state_machine_client = None
    incomplete = complete_spec_content()
    incomplete["business_value"] = []
    # the model still claims a clean bill of health - the gate has to overrule it
    incomplete["completeness"] = {"score": 1.0, "gaps": []}
    fake_agent = _FakeLocalAgentClient(incomplete)
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(f"/projects/{created['id']}/advance", json={"prompt": "a vague idea"})

    assert resp.status_code == 200
    assert resp.json()["station"] == Station.DISTILL.value
    artifact = client.get(f"/projects/{created['id']}/artifacts/distill").json()
    assert artifact["content"]["completeness"]["gaps"] == [
        "requirement R1 has no business value (use case/ROI)"
    ]


def test_advance_supports_multiple_turns_until_gaps_are_resolved(client: TestClient) -> None:
    _state(client).state_machine_client = None
    incomplete = complete_spec_content()
    incomplete["acceptance_criteria"] = []
    fake_agent = _FakeLocalAgentClient(results=[incomplete, complete_spec_content()])
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()

    first = client.post(f"/projects/{created['id']}/advance", json={"prompt": "a vague idea"})
    assert first.json()["station"] == Station.DISTILL.value

    second = client.post(
        f"/projects/{created['id']}/advance",
        json={"prompt": "success measure: 90% triaged within 24h"},
    )
    assert second.json()["station"] == Station.BLUEPRINT_APPROVAL.value
    assert len(fake_agent.calls) == 2
    # the retry turn is grounded in the draft it has to fix, not started from scratch
    assert "your previous draft" in fake_agent.calls[1][1]


def test_advance_409s_when_a_state_machine_is_configured(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(f"/projects/{created['id']}/advance")

    assert resp.status_code == 409


def test_advance_409s_when_not_at_an_agent_station(client: TestClient) -> None:
    _state(client).state_machine_client = None
    _state(client).local_agent_client = _FakeLocalAgentClient()
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    project = loaded(repo.get_project(created["id"]))
    project.station = Station.BLUEPRINT_APPROVAL
    repo._table.put_item(Item=repo._state_item(project))

    resp = client.post(f"/projects/{created['id']}/advance")

    assert resp.status_code == 409


def _parse_sse(text: str) -> list[dict[str, Any]]:
    lines = text.split("\n\n")
    return [json.loads(line[len("data: ") :]) for line in lines if line.startswith("data: ")]


def test_advance_stream_yields_chunks_then_a_done_event(client: TestClient) -> None:
    _state(client).state_machine_client = None
    fake_agent = _FakeLocalAgentClient(
        complete_spec_content(), events=[{"chunk": "Analyzing"}, {"chunk": "..."}]
    )
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(
        f"/projects/{created['id']}/advance/stream",
        json={"prompt": "Users must be able to reset their password via email."},
    )

    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    assert events[:2] == [{"chunk": "Analyzing"}, {"chunk": "..."}]
    assert events[-1]["done"] is True
    assert events[-1]["project"]["station"] == Station.BLUEPRINT_APPROVAL.value


def test_advance_stream_closes_the_agent_response_once_finished(client: TestClient) -> None:
    # a real bug: the connection to the agent's dev server was never explicitly closed,
    # so an abandoned stream (e.g. the browser tab closing) kept it - and whatever the
    # agent was still doing - running unseen instead of actually stopping.
    _state(client).state_machine_client = None
    fake_agent = _FakeLocalAgentClient(complete_spec_content())
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()

    client.post(f"/projects/{created['id']}/advance/stream", json={"prompt": "a vague idea"})

    assert fake_agent.last_response.closed is True
    artifact = client.get(f"/projects/{created['id']}/artifacts/distill").json()
    assert artifact["content"]["title"] == "FSD"


def test_advance_stream_yields_tool_call_events(client: TestClient) -> None:
    _state(client).state_machine_client = None
    tool_call = {
        "id": "t1",
        "name": "score_completeness",
        "status": "done",
        "result": {"score": 1.0},
    }
    fake_agent = _FakeLocalAgentClient({"title": "FSD"}, events=[{"tool_call": tool_call}])
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(f"/projects/{created['id']}/advance/stream", json={"prompt": "a vague idea"})

    events = _parse_sse(resp.text)
    assert {"tool_call": tool_call} in events


def test_advance_stream_forwards_the_artifact_draft(client: TestClient) -> None:
    _state(client).state_machine_client = None
    fake_agent = _FakeLocalAgentClient(
        {"title": "FSD"}, events=[{"draft": '{"title"'}, {"draft": ': "FSD"}'}]
    )
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(f"/projects/{created['id']}/advance/stream", json={"prompt": "a vague idea"})

    events = _parse_sse(resp.text)
    assert {"draft": '{"title"'} in events
    assert {"draft": ': "FSD"}'} in events


def test_advance_stream_forwards_the_turn_s_token_usage(client: TestClient) -> None:
    _state(client).state_machine_client = None
    usage = {"input_tokens": 1200, "output_tokens": 340, "total_tokens": 1540}
    fake_agent = _FakeLocalAgentClient({"title": "FSD"}, events=[{"usage": usage}])
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(f"/projects/{created['id']}/advance/stream", json={"prompt": "a vague idea"})

    assert {"usage": usage} in _parse_sse(resp.text)


def test_advance_stream_stays_at_the_same_station_when_gaps_are_flagged(client: TestClient) -> None:
    _state(client).state_machine_client = None
    fake_agent = _FakeLocalAgentClient(
        {"title": "FSD", "completeness": {"score": 0.4, "gaps": ["no success metric given"]}}
    )
    _state(client).local_agent_client = fake_agent
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(f"/projects/{created['id']}/advance/stream", json={"prompt": "a vague idea"})

    events = _parse_sse(resp.text)
    assert events[-1]["project"]["station"] == Station.DISTILL.value


class _FailingAgentClient:
    def stream(
        self, agent: str, prompt: str, on_response: Callable[[Any], None] | None = None
    ) -> Iterator[dict[str, Any]]:
        yield {"chunk": "Analyzing"}
        yield {"error": "agent invocation failed"}


def test_advance_stream_surfaces_agent_errors_as_an_sse_event(client: TestClient) -> None:
    _state(client).state_machine_client = None
    _state(client).local_agent_client = _FailingAgentClient()
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(f"/projects/{created['id']}/advance/stream")

    events = _parse_sse(resp.text)
    assert events == [{"chunk": "Analyzing"}, {"error": "agent invocation failed"}]


def test_advance_stream_saves_a_completed_side_effect_from_a_turn_that_then_fails(
    client: TestClient,
) -> None:
    # a real bug this caught live: create_pull_request_with_copilot succeeded on
    # GitHub's side, but the turn then timed out before producing a result - leaving
    # no local record that the PR/Copilot hand-off already happened.
    _state(client).state_machine_client = None
    pr_call = {
        "id": "t1",
        "name": "create_pull_request_with_copilot",
        "status": "done",
        "result": {"number": 4},
    }

    class _TimingOutAfterHandoff:
        def stream(
            self, agent: str, prompt: str, on_response: Callable[[Any], None] | None = None
        ) -> Iterator[dict[str, Any]]:
            yield {"tool_call": pr_call}
            yield {"error": "agent invocation timed out"}

    _state(client).local_agent_client = _TimingOutAfterHandoff()
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(f"/projects/{created['id']}/advance/stream")

    events = _parse_sse(resp.text)
    assert events[-1] == {"error": "agent invocation timed out"}
    artifact = client.get(f"/projects/{created['id']}/artifacts/distill").json()
    assert artifact["content"]["tool_calls_before_failure"] == [pr_call]
    assert artifact["content"]["last_turn_error"] == "agent invocation timed out"


def test_advance_stream_does_not_save_anything_when_no_side_effect_tool_ran(
    client: TestClient,
) -> None:
    _state(client).state_machine_client = None
    _state(client).local_agent_client = _FailingAgentClient()
    created = client.post("/projects", json={"name": "My Project"}).json()

    client.post(f"/projects/{created['id']}/advance/stream")

    resp = client.get(f"/projects/{created['id']}/artifacts/distill")
    assert resp.status_code == 404


def test_advance_stream_surfaces_persistence_errors_as_an_sse_event(client: TestClient) -> None:
    # a real bug this caught live: an exception saving the artifact/advancing the
    # station (e.g. the AWS session expiring) happened *after* the agent stream
    # itself succeeded, outside the original try/except - it crashed the generator
    # uncaught, which just breaks the HTTP connection instead of a clean SSE error.
    _state(client).state_machine_client = None
    _state(client).local_agent_client = _FakeLocalAgentClient({"title": "FSD"})
    created = client.post("/projects", json={"name": "My Project"}).json()

    def _boom(*args: object, **kwargs: object) -> Never:
        raise RuntimeError("token expired")

    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact = _boom

    resp = client.post(f"/projects/{created['id']}/advance/stream")

    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    assert events[-1] == {"error": "token expired"}


def test_advance_stream_409s_when_a_state_machine_is_configured(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()

    resp = client.post(f"/projects/{created['id']}/advance/stream")

    assert resp.status_code == 409


def test_advance_stream_409s_when_not_at_an_agent_station(client: TestClient) -> None:
    _state(client).state_machine_client = None
    _state(client).local_agent_client = _FakeLocalAgentClient()
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    project = loaded(repo.get_project(created["id"]))
    project.station = Station.BLUEPRINT_APPROVAL
    repo._table.put_item(Item=repo._state_item(project))

    resp = client.post(f"/projects/{created['id']}/advance/stream")

    assert resp.status_code == 409


def test_builds_are_empty_before_review_has_run(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()

    body = client.get(f"/projects/{created['id']}/builds").json()

    assert body == {"repository": None, "builds": [], "watching": False}


def test_builds_are_returned_as_links_when_the_console_has_no_github_token(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "review", _review_with_build())
    # pinned rather than inherited: a developer with GITHUB_PAT in .env would otherwise
    # have this test reach the real api.github.com
    monkeypatch.setattr(
        "api.routers.projects.get_settings", lambda: SimpleNamespace(github_pat=None)
    )

    body = client.get(f"/projects/{created['id']}/builds").json()

    # unreadable is not failed: the human can still click through
    assert body["watching"] is False
    assert body["repository"] == "o/r"
    assert body["builds"][0]["url"] == "https://github.com/o/r/pull/7"
    assert body["builds"][0]["state"] is None
    assert body["builds"][0]["issue_numbers"] == [17, 18]


def test_builds_carry_live_status_when_a_token_is_configured(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "review", _review_with_build())
    monkeypatch.setattr(
        "api.routers.projects.get_settings",
        lambda: SimpleNamespace(github_pat=SecretStr("token")),
    )

    def _state_of(_token: str, _repository: str, _number: int) -> PullRequestState:
        return PullRequestState(
            number=7,
            state="open",
            checks="passing",
            draft=False,
            title="Persist history results",
            url="https://github.com/o/r/pull/7",
        )

    monkeypatch.setattr("api.routers.projects.read_pull_request", _state_of)

    body = client.get(f"/projects/{created['id']}/builds").json()

    assert body["watching"] is True
    assert body["builds"][0]["checks"] == "passing"
    assert body["builds"][0]["title"] == "Persist history results"


def test_builds_are_empty_when_the_stored_review_no_longer_matches_its_contract(
    client: TestClient,
) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "review", {"title": "written before the contract"})

    resp = client.get(f"/projects/{created['id']}/builds")

    # polled every few seconds - an artifact the contract outgrew must not 500 the console
    assert resp.status_code == 200
    assert resp.json()["builds"] == []


def _review_with_build() -> dict[str, Any]:
    return {
        "title": "Review",
        "findings": [],
        "coverage": [],
        "completeness": {"score": 1.0, "gaps": []},
        "repository": "o/r",
        "builds": [
            {
                "group_id": "D1",
                "number": 7,
                "url": "https://github.com/o/r/pull/7",
                "unit_ids": ["U1", "U2"],
                "issue_numbers": [17, 18],
            }
        ],
    }


def _at_showroom_approval(repo: ProjectRepository, project_id: str) -> None:
    project = loaded(repo.get_project(project_id))
    project.station = Station.SHOWROOM_APPROVAL
    repo._table.put_item(Item=repo._state_item(project))


def _merged_ok(_token: str, _repository: str, _number: int) -> MergeResult:
    return MergeResult(merged=True, sha="abc123", message="merged")


def _merge_not_mergeable(_token: str, _repository: str, _number: int) -> MergeResult:
    return MergeResult(merged=False, sha=None, message="Pull Request is not mergeable")


def _pulled_ok(_path: str) -> PullResult:
    return PullResult(ok=True, message="already up to date")


def _pulled_diverged(_path: str) -> PullResult:
    return PullResult(ok=False, message="fatal: not possible to fast-forward")


def _pulled_dirty(_path: str) -> PullResult:
    return PullResult(ok=False, message="checkout is dirty")


def _preview_healthy(_target: PreviewTarget) -> bool:
    return True


def _preview_noop_stop(_path: str, _command: str) -> None:
    return None


def test_merge_build_rejected_before_the_g3_gate(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "review", _review_with_build())

    resp = client.post(f"/projects/{created['id']}/builds/7/merge")

    assert resp.status_code == 409


def test_merge_build_rejected_for_a_number_review_never_recorded(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "review", _review_with_build())
    _at_showroom_approval(repo, created["id"])
    monkeypatch.setattr(
        "api.routers.projects.get_settings",
        lambda: SimpleNamespace(github_pat=SecretStr("token")),
    )

    resp = client.post(f"/projects/{created['id']}/builds/999/merge")

    assert resp.status_code == 404


def test_merge_build_rejected_without_a_github_token(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "review", _review_with_build())
    _at_showroom_approval(repo, created["id"])
    monkeypatch.setattr(
        "api.routers.projects.get_settings", lambda: SimpleNamespace(github_pat=None)
    )

    resp = client.post(f"/projects/{created['id']}/builds/7/merge")

    assert resp.status_code == 409


def test_merge_build_succeeds_and_returns_a_next_step(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "review", _review_with_build())
    _at_showroom_approval(repo, created["id"])
    monkeypatch.setattr(
        "api.routers.projects.get_settings",
        lambda: SimpleNamespace(github_pat=SecretStr("token"), preview_checkout_path=None),
    )
    monkeypatch.setattr("api.routers.projects.resolve_and_merge", _merged_ok)

    resp = client.post(f"/projects/{created['id']}/builds/7/merge")

    assert resp.status_code == 200
    body = resp.json()
    assert body["merged"] is True
    assert body["sha"] == "abc123"
    assert "make preview" in body["next_step"]


def test_merge_build_surfaces_a_github_failure(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "review", _review_with_build())
    _at_showroom_approval(repo, created["id"])
    monkeypatch.setattr(
        "api.routers.projects.get_settings",
        lambda: SimpleNamespace(github_pat=SecretStr("token")),
    )
    monkeypatch.setattr("api.routers.projects.resolve_and_merge", _merge_not_mergeable)

    resp = client.post(f"/projects/{created['id']}/builds/7/merge")

    assert resp.status_code == 502
    assert resp.json()["detail"] == "Pull Request is not mergeable"


def test_g3_approval_merges_every_recorded_build_before_completing(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "review", _review_with_build())
    _at_showroom_approval(repo, created["id"])
    monkeypatch.setattr(
        "api.routers.projects.get_settings",
        lambda: SimpleNamespace(github_pat=SecretStr("token"), preview_checkout_path=None),
    )
    calls: list[int] = []

    def _merge_and_record(_token: str, _repository: str, number: int) -> MergeResult:
        calls.append(number)
        return MergeResult(merged=True, sha="abc123", message="merged")

    monkeypatch.setattr("api.routers.projects.resolve_and_merge", _merge_and_record)

    resp = client.post(
        f"/projects/{created['id']}/decisions",
        json={"approved": True, "signer": "rahul"},
    )

    assert resp.status_code == 200
    assert resp.json()["station"] == Station.SHOWROOM.value
    assert calls == [7]


def test_g3_approval_is_blocked_when_a_build_has_a_real_conflict(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "review", _review_with_build())
    _at_showroom_approval(repo, created["id"])
    monkeypatch.setattr(
        "api.routers.projects.get_settings",
        lambda: SimpleNamespace(github_pat=SecretStr("token")),
    )
    monkeypatch.setattr("api.routers.projects.resolve_and_merge", _merge_not_mergeable)

    resp = client.post(
        f"/projects/{created['id']}/decisions",
        json={"approved": True, "signer": "rahul"},
    )

    assert resp.status_code == 502
    assert "Pull Request is not mergeable" in resp.json()["detail"]
    # the audit trail must not claim an approval the demo can't actually show
    still_pending = loaded(repo.get_project(created["id"]))
    assert still_pending.station == Station.SHOWROOM_APPROVAL


def test_g3_approval_proceeds_normally_with_no_builds_recorded(client: TestClient) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    _at_showroom_approval(repo, created["id"])

    resp = client.post(
        f"/projects/{created['id']}/decisions",
        json={"approved": True, "signer": "rahul"},
    )

    assert resp.status_code == 200
    assert resp.json()["station"] == Station.SHOWROOM.value


def test_preview_rejected_without_a_checkout_path_configured(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    monkeypatch.setattr(
        "api.routers.projects.get_settings", lambda: SimpleNamespace(preview_checkout_path=None)
    )

    resp = client.post(f"/projects/{created['id']}/preview")

    assert resp.status_code == 409


def test_preview_rejected_for_an_unknown_project(client: TestClient) -> None:
    resp = client.post("/projects/does-not-exist/preview")

    assert resp.status_code == 404


def test_preview_starts_and_reports_urls_when_healthy(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    monkeypatch.setattr(
        "api.routers.projects.get_settings",
        lambda: SimpleNamespace(
            preview_checkout_path="/some/checkout",
            preview_command="./scripts/preview.sh",
            preview_backend_port=8000,
            preview_frontend_port=5183,
        ),
    )
    monkeypatch.setattr("api.routers.projects.pull_default_branch", _pulled_ok)
    monkeypatch.setattr("api.routers.projects.start_preview", _preview_healthy)

    resp = client.post(f"/projects/{created['id']}/preview")

    assert resp.status_code == 200
    body = resp.json()
    assert body["running"] is True
    assert body["backend_url"] == "http://localhost:8000"
    assert body["frontend_url"] == "http://localhost:5183"


def test_preview_surfaces_a_pull_failure(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    monkeypatch.setattr(
        "api.routers.projects.get_settings",
        lambda: SimpleNamespace(
            preview_checkout_path="/some/checkout",
            preview_command="./scripts/preview.sh",
            preview_backend_port=8000,
            preview_frontend_port=5183,
        ),
    )
    monkeypatch.setattr("api.routers.projects.pull_default_branch", _pulled_diverged)

    resp = client.post(f"/projects/{created['id']}/preview")

    assert resp.status_code == 502


def test_stop_preview_rejected_without_a_checkout_path_configured(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    monkeypatch.setattr(
        "api.routers.projects.get_settings", lambda: SimpleNamespace(preview_checkout_path=None)
    )

    resp = client.post(f"/projects/{created['id']}/preview/stop")

    assert resp.status_code == 409


def test_stop_preview_succeeds(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    monkeypatch.setattr(
        "api.routers.projects.get_settings",
        lambda: SimpleNamespace(
            preview_checkout_path="/some/checkout", preview_command="./scripts/preview.sh"
        ),
    )
    monkeypatch.setattr("api.routers.projects.stop_preview", _preview_noop_stop)

    resp = client.post(f"/projects/{created['id']}/preview/stop")

    assert resp.status_code == 200
    assert resp.json()["running"] is False


def test_merge_build_auto_starts_the_preview_when_configured(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "review", _review_with_build())
    _at_showroom_approval(repo, created["id"])
    monkeypatch.setattr(
        "api.routers.projects.get_settings",
        lambda: SimpleNamespace(
            github_pat=SecretStr("token"),
            preview_checkout_path="/some/checkout",
            preview_command="./scripts/preview.sh",
            preview_backend_port=8000,
            preview_frontend_port=5183,
        ),
    )
    monkeypatch.setattr("api.routers.projects.resolve_and_merge", _merged_ok)
    monkeypatch.setattr("api.routers.projects.pull_default_branch", _pulled_ok)
    started: list[PreviewTarget] = []

    def _record_start(target: PreviewTarget) -> bool:
        started.append(target)
        return True

    monkeypatch.setattr("api.routers.projects.start_preview", _record_start)

    resp = client.post(f"/projects/{created['id']}/builds/7/merge")

    assert resp.status_code == 200
    assert "starting automatically" in resp.json()["next_step"]
    assert len(started) == 1


def test_merge_build_auto_preview_failure_does_not_fail_the_merge_response(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    created = client.post("/projects", json={"name": "My Project"}).json()
    repo: ProjectRepository = _state(client).project_repository
    repo.save_artifact(created["id"], "review", _review_with_build())
    _at_showroom_approval(repo, created["id"])
    monkeypatch.setattr(
        "api.routers.projects.get_settings",
        lambda: SimpleNamespace(
            github_pat=SecretStr("token"),
            preview_checkout_path="/some/checkout",
            preview_command="./scripts/preview.sh",
            preview_backend_port=8000,
            preview_frontend_port=5183,
        ),
    )
    monkeypatch.setattr("api.routers.projects.resolve_and_merge", _merged_ok)
    monkeypatch.setattr("api.routers.projects.pull_default_branch", _pulled_dirty)

    resp = client.post(f"/projects/{created['id']}/builds/7/merge")

    # the merge itself already succeeded - a broken local checkout is never this response's problem
    assert resp.status_code == 200
    assert resp.json()["merged"] is True
