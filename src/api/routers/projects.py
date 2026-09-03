"""Project endpoints: create, inspect, and record gate decisions."""

import json
import logging
import uuid
from collections.abc import AsyncIterator
from typing import Any

from anyio.to_thread import run_sync
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse

from api.auth import get_current_user
from api.schemas.project import (
    AdvanceRequest,
    ArtifactResponse,
    CreateProjectRequest,
    DecisionRequest,
    ProjectResponse,
    RenameProjectRequest,
)
from core.domain.project import AGENT_STATIONS, APPROVAL_STATIONS, Artifact, Project, Station
from infrastructure.repositories.project_repository import ProjectRepository
from orchestration.project_namer import ProjectNamer, heuristic_name

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/projects", tags=["projects"], dependencies=[Depends(get_current_user)])


def _to_response(project: Project) -> ProjectResponse:
    return ProjectResponse(
        id=project.id,
        name=project.name,
        station=project.station,
        created_at=project.created_at.isoformat(),
        updated_at=project.updated_at.isoformat(),
    )


def _artifact_to_response(artifact: Artifact) -> ArtifactResponse:
    return ArtifactResponse(
        agent=artifact.agent,
        content=artifact.content,
        created_at=artifact.created_at.isoformat(),
    )


# Each agent needs its named predecessors' artifacts as grounding - the real state
# machine handoff (ADVA-3015) will do this via Step Functions JSONPath; this local-dev
# bypass has to stitch it in itself, since the console UI only ever sends a short
# instruction like "Blueprint may begin.".
_PREDECESSOR_ARTIFACTS: dict[str, list[str]] = {
    Station.BLUEPRINT.value: [Station.DISTILL.value],
    Station.REVIEW.value: [Station.DISTILL.value, Station.BLUEPRINT.value],
    Station.SHOWROOM.value: [Station.DISTILL.value],
}


def _build_prompt(repo: ProjectRepository, project_id: str, agent: str, user_prompt: str) -> str:
    """Prepend each predecessor station's artifact so the agent isn't drafting blind."""
    sections = [
        f"# {predecessor}'s output\n```json\n{json.dumps(artifact.content, indent=2)}\n```"
        for predecessor in _PREDECESSOR_ARTIFACTS.get(agent, [])
        if (artifact := repo.get_artifact(project_id, predecessor)) is not None
    ]
    return "\n\n".join([*sections, user_prompt])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: CreateProjectRequest, request: Request, background_tasks: BackgroundTasks
) -> ProjectResponse:
    """Create a project and, once the state machine exists, start its execution.

    A message-only request gets an instant heuristic name so creation never blocks on the
    naming model call - the console UI navigates to the project immediately. The nicer
    AI-generated name is applied afterward, in the background, via `rename_project`.
    """
    name = payload.name
    if not name:
        if not payload.message:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, detail="either name or message is required"
            )
        name = heuristic_name(payload.message)

    repo = request.app.state.project_repository
    project = repo.create_project(project_id=str(uuid.uuid4()), name=name)
    if payload.name is None and payload.message:
        background_tasks.add_task(
            _apply_generated_name,
            repo,
            request.app.state.project_namer,
            project.id,
            payload.message,
        )
    if (sfn := request.app.state.state_machine_client) is not None:
        sfn.start_execution(project.id)
    return _to_response(project)


def _apply_generated_name(
    repo: ProjectRepository, project_namer: ProjectNamer, project_id: str, message: str
) -> None:
    """Runs after the response is sent.

    A slow/failed model or rename must not surface to the client that already got its
    201, so this is the one place besides agent_runtime.factory that deliberately
    catches everything.
    """
    try:
        repo.rename_project(project_id, project_namer.generate(message))
    except Exception:
        logger.exception("background project naming failed for %s", project_id)


@router.get("/pending/{station}", response_model=list[ProjectResponse])
def list_pending(station: Station, request: Request) -> list[ProjectResponse]:
    """List the projects that owe a decision at `station`."""
    repo = request.app.state.project_repository
    return [_to_response(p) for p in repo.list_pending(station)]


@router.get("", response_model=list[ProjectResponse])
def list_projects(request: Request) -> list[ProjectResponse]:
    """List every project, most recently updated first - backs the portfolio dashboard."""
    repo = request.app.state.project_repository
    return [_to_response(p) for p in repo.list_projects()]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, request: Request) -> ProjectResponse:
    """Return one project's current position on the line."""
    repo = request.app.state.project_repository
    project = repo.get_project(project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="project not found")
    return _to_response(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, request: Request) -> None:
    """Delete a project and everything under it (artifacts, decision history)."""
    repo = request.app.state.project_repository
    if repo.get_project(project_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="project not found")
    repo.delete_project(project_id)


@router.patch("/{project_id}", response_model=ProjectResponse)
def rename_project(
    project_id: str, payload: RenameProjectRequest, request: Request
) -> ProjectResponse:
    """Rename a project in place - station and history are untouched."""
    repo = request.app.state.project_repository
    if repo.get_project(project_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="project not found")
    name = payload.name.strip()
    if not name:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="name must not be empty")
    updated = repo.rename_project(project_id, name)
    return _to_response(updated)


@router.get("/{project_id}/artifacts", response_model=list[ArtifactResponse])
def list_artifacts(project_id: str, request: Request) -> list[ArtifactResponse]:
    """Return every artifact produced so far for a project."""
    repo = request.app.state.project_repository
    return [_artifact_to_response(a) for a in repo.list_artifacts(project_id)]


@router.get("/{project_id}/artifacts/{agent}", response_model=ArtifactResponse)
def get_artifact(project_id: str, agent: str, request: Request) -> ArtifactResponse:
    """Return a single agent's artifact, 404ing if it hasn't run yet."""
    repo = request.app.state.project_repository
    artifact = repo.get_artifact(project_id, agent)
    if artifact is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="artifact not found")
    return _artifact_to_response(artifact)


@router.post("/{project_id}/advance", response_model=ProjectResponse)
def advance_project(
    project_id: str, request: Request, payload: AdvanceRequest | None = None
) -> ProjectResponse:
    """Local-dev-only agent invocation, no streaming.

    Invokes the current station's agent on its local dev HTTP server directly
    (bypassing Step Functions/AgentCore Runtime, which aren't deployed - see
    orchestration.local_agent_client) and advances the project. Disabled once a real
    state machine is wired, since that drives progression on its own.
    """
    if request.app.state.state_machine_client is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="not available once the state machine is deployed",
        )

    repo = request.app.state.project_repository
    project = repo.get_project(project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="project not found")
    if project.station not in AGENT_STATIONS:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"project is not at an agent station (at {project.station.value})",
        )

    agent = project.station.value
    prompt = (payload.prompt if payload else None) or f"Project {project_id}"
    prompt = _build_prompt(repo, project_id, agent, prompt)
    result = request.app.state.local_agent_client.invoke(agent, prompt=prompt)
    repo.save_artifact(project_id, agent, result)

    # Only agents whose output models carry a `completeness` verdict (currently just
    # Distill's StructuredSpec) support this elicitation loop - others have no such
    # concept, so a single turn is always "done".
    if _has_open_gaps(result):
        return _to_response(project)
    updated = repo.advance_after_artifact(project_id, agent)
    return _to_response(updated)


def _has_open_gaps(result: dict[str, Any]) -> bool:
    completeness = result.get("completeness")
    if not isinstance(completeness, dict):
        return False
    return bool(completeness.get("gaps"))


def _sse(event: dict[str, Any]) -> str:
    return f"data: {json.dumps(event)}\n\n"


@router.post("/{project_id}/advance/stream")
def advance_project_stream(
    project_id: str, request: Request, payload: AdvanceRequest | None = None
) -> StreamingResponse:
    """Same local-dev-only bypass as `advance_project`, but streams the output.

    As it's produced instead of blocking until it's done - see LocalAgentClient.stream.
    Validation happens up front, before the stream starts, since an HTTP status can't
    change once streaming begins; anything going wrong after that is surfaced as an
    `{"error": ...}` SSE event instead of a status code.
    """
    if request.app.state.state_machine_client is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="not available once the state machine is deployed",
        )

    repo = request.app.state.project_repository
    project = repo.get_project(project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="project not found")
    if project.station not in AGENT_STATIONS:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"project is not at an agent station (at {project.station.value})",
        )

    agent = project.station.value
    prompt = (payload.prompt if payload else None) or f"Project {project_id}"
    prompt = _build_prompt(repo, project_id, agent, prompt)
    local_agent_client = request.app.state.local_agent_client

    async def event_stream() -> AsyncIterator[str]:
        result: dict[str, Any] | None = None
        # boxes the raw HTTP response to the agent's dev server, so a disconnect (see
        # below) can close it from here and unblock the `next()` call that's stuck
        # reading it in the worker thread - without this the agent invocation (and any
        # tool call it's mid-way through) just keeps running unseen after "Stop".
        held_response: list[Any] = []
        gen = local_agent_client.stream(agent, prompt, on_response=held_response.append)

        def next_event() -> dict[str, Any] | None:
            # `None` (rather than raising StopIteration across the thread hop) keeps
            # the type simple and side-steps PEP 479 turning a StopIteration that
            # escapes an async generator's frame into an opaque RuntimeError.
            return next(gen, None)

        try:
            while True:
                # abandon_on_cancel=True: if the client disconnects, Starlette cancels
                # this task while it's awaiting exactly this call (see StreamingResponse's
                # own listen_for_disconnect) - the `finally` below still runs, closing
                # the connection to the agent's dev server so its blocked read unblocks.
                event = await run_sync(next_event, abandon_on_cancel=True)
                if event is None:
                    break
                if "chunk" in event:
                    yield _sse({"chunk": event["chunk"]})
                elif "tool_call" in event:
                    yield _sse({"tool_call": event["tool_call"]})
                elif "error" in event:
                    yield _sse({"error": event["error"]})
                    return
                elif "result" in event:
                    result = event["result"]

            if result is None:
                yield _sse({"error": f"{agent} agent invocation ended without a result"})
                return

            repo.save_artifact(project_id, agent, result)
            if _has_open_gaps(result):
                updated = project
            else:
                updated = repo.advance_after_artifact(project_id, agent)
            yield _sse({"done": True, "project": _to_response(updated).model_dump(mode="json")})
        except Exception as exc:
            # covers the agent stream itself *and* the save-artifact/advance-station
            # calls after it - those run after the HTTP response has already started
            # streaming, so an uncaught exception here would otherwise just kill the
            # connection (client sees a raw network error, not a clean {"error": ...}).
            logger.exception("advance_project_stream failed for %s/%s", project_id, agent)
            yield _sse({"error": str(exc)})
        finally:
            if held_response:
                held_response[0].close()

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/{project_id}/decisions", response_model=ProjectResponse)
def submit_decision(project_id: str, payload: DecisionRequest, request: Request) -> ProjectResponse:
    """Approve or reject the gate the project is held at, then release the execution.

    The decision is written before the task token is released so the audit trail can
    never lag the state machine.
    """
    repo = request.app.state.project_repository
    project = repo.get_project(project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="project not found")
    if project.station not in APPROVAL_STATIONS:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"project is not awaiting approval (at {project.station.value})",
        )

    repo.record_decision(
        project_id=project_id,
        station=project.station,
        approved=payload.approved,
        signer=payload.signer,
        comment=payload.comment,
    )
    if (sfn := request.app.state.state_machine_client) is not None and project.task_token:
        if payload.approved:
            sfn.send_task_success(project.task_token, {"approved": True})
        else:
            sfn.send_task_failure(project.task_token, error="Rejected")

    updated = repo.get_project(project_id)
    if updated is None:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="project missing after recording decision",
        )
    return _to_response(updated)
