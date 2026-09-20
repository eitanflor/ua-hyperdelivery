"""Project endpoints: create, inspect, and record gate decisions."""

import json
import logging
import uuid
from collections.abc import AsyncIterator
from typing import Any, Literal, cast

from anyio.to_thread import run_sync
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import StreamingResponse
from pydantic import ValidationError

from api.auth import get_current_user
from api.schemas.project import (
    AdvanceRequest,
    AnswerRequest,
    ArtifactResponse,
    BuildResponse,
    BuildsResponse,
    CreateProjectRequest,
    DecisionRequest,
    MergeBuildResponse,
    PreviewResponse,
    ProjectResponse,
    RenameProjectRequest,
    StreamTicketResponse,
    UploadDocumentResponse,
)
from config.settings import get_settings
from core.domain.project import AGENT_STATIONS, APPROVAL_STATIONS, Artifact, Project, Station
from core.domain.review import ReviewReport
from core.prompting import context_section
from core.validation import evaluate_artifact
from infrastructure.local_preview import (
    PreviewTarget,
    pull_default_branch,
    start_preview,
    stop_preview,
)
from infrastructure.repositories.project_repository import (
    ProjectAlreadyExistsError,
    ProjectRepository,
)
from orchestration.project_namer import ProjectNamer, heuristic_name
from providers.documents.parsing import SUPPORTED_EXTENSIONS
from providers.github.merge import resolve_and_merge
from providers.github.pull_requests import read_pull_request
from providers.storage.s3 import UploadedDocument, put_uploaded_document

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/projects", tags=["projects"], dependencies=[Depends(get_current_user)])


def _orchestration_mode(request: Request) -> Literal["local", "deployed"]:
    """Which turn-advancing path the console UI should use for this deployment.

    "local" means the console UI's `/advance/stream` composer flow works (no state
    machine deployed); "deployed" means turns are driven by Step Functions instead, and
    the frontend must poll + use `/answer` rather than expecting a live stream - see
    docs/decisions.md, "console UI polling for the deployed orchestration path".
    """
    return "local" if request.app.state.state_machine_client is None else "deployed"


def _to_response(
    project: Project, orchestration_mode: Literal["local", "deployed"]
) -> ProjectResponse:
    return ProjectResponse(
        id=project.id,
        name=project.name,
        station=project.station,
        pending_question=project.pending_question,
        orchestration_mode=orchestration_mode,
        created_at=project.created_at.isoformat(),
        updated_at=project.updated_at.isoformat(),
    )


def _get_review_report(repo: ProjectRepository, project_id: str) -> ReviewReport | None:
    """Read and validate the Review artifact, or `None` if it is missing or stale-shaped."""
    artifact = repo.get_artifact(project_id, Station.REVIEW.value)
    if artifact is None:
        return None
    try:
        return ReviewReport.model_validate(artifact.content)
    except ValidationError:
        # same rule as core.validation.artifacts: an artifact written before the contract
        # gained a field is absent, not an error
        logger.warning("stored review artifact does not match ReviewReport - no builds")
        return None


def _merge_all_builds_or_fail(repo: ProjectRepository, project_id: str) -> None:
    """Auto-merge every build Review opened, before a G3 approval is allowed to complete.

    Approving is the PM's only involvement in getting a build live - they are not
    expected to fix a stuck branch by hand. A build that is merely behind its base is
    brought up to date and merged with no one watching. A build with a real, unresolved
    conflict fails the whole approval instead of recording one the demo can't actually
    show: the audit trail must never claim success the state machine can't deliver.
    """
    report = _get_review_report(repo, project_id)
    if report is None or report.repository is None or not report.builds:
        return
    token = get_settings().github_pat
    if token is None:
        return
    secret = token.get_secret_value()
    wip_builds = [
        build.number
        for build in report.builds
        if (pull := read_pull_request(secret, report.repository, build.number)) is not None
        and pull.state not in {"merged", "closed"}
        and pull.title.lstrip().lower().startswith("[wip]")
    ]
    if wip_builds:
        numbers = ", ".join(f"#{number}" for number in wip_builds)
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"approval blocked - builds still in progress: {numbers}",
        )
    failures = [
        f"PR #{build.number}: {result.message}"
        for build in report.builds
        if not (result := resolve_and_merge(secret, report.repository, build.number)).merged
    ]
    if failures:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail="approval blocked - could not merge every build: " + "; ".join(failures),
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
    Station.SHOWROOM.value: [Station.DISTILL.value, Station.BLUEPRINT.value, Station.REVIEW.value],
}

# A build can be merged once Review has produced its report and the G3 gate has been
# reached - not before (nothing to merge yet) and station never moves backwards past it.
_MERGEABLE_STATIONS = {Station.SHOWROOM_APPROVAL, Station.SHOWROOM, Station.DONE}


def _predecessor_contents(
    repo: ProjectRepository, project_id: str, agent: str
) -> dict[str, dict[str, Any]]:
    """Fetch each upstream station's latest artifact, skipping the ones that haven't run."""
    return {
        predecessor: artifact.content
        for predecessor in _PREDECESSOR_ARTIFACTS.get(agent, [])
        if (artifact := repo.get_artifact(project_id, predecessor)) is not None
    }


def _build_prompt(
    predecessors: dict[str, dict[str, Any]],
    previous_draft: dict[str, Any] | None,
    user_prompt: str,
    context: str = "",
) -> str:
    """Ground the agent in the system's standing context, predecessors and last draft.

    Every invocation starts from an empty message list (see agent_runtime.factory), so a
    retry after an open gap would otherwise redraft from scratch instead of closing it.
    `context` is whatever a human has written to the system-wide standing context - repo,
    database, design system, conventions - and comes first since it applies regardless
    of which predecessor artifacts exist yet; see `_context_section` for why it may be a
    preview.
    """
    sections: list[str] = []
    if (section := context_section(context)) is not None:
        sections.append(section)
    sections += [
        f"# {predecessor}'s output\n```json\n{json.dumps(content, indent=2)}\n```"
        for predecessor, content in predecessors.items()
    ]
    if previous_draft is not None:
        sections.append(
            "# your previous draft\nRevise this to close the gaps listed in its "
            "`completeness`, keeping the ids and content that were already correct.\n"
            f"```json\n{json.dumps(previous_draft, indent=2)}\n```"
        )
    return "\n\n".join([*sections, user_prompt])


def _scored(
    result: dict[str, Any], agent: str, predecessors: dict[str, dict[str, Any]]
) -> dict[str, Any]:
    """Replace the agent's self-reported `completeness` with the deterministic verdict.

    The in-loop `@tool` validators are scored on ids the same model chose to hand them,
    so they can only ever be advisory. This runs against the real artifact and its real
    predecessors, and it is what `_has_open_gaps` - and therefore the gate - reads.
    """
    return {**result, "completeness": evaluate_artifact(agent, result, predecessors).model_dump()}


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: CreateProjectRequest, request: Request, background_tasks: BackgroundTasks
) -> ProjectResponse:
    """Create a project and, once the state machine exists, start its execution.

    A message-only request gets an instant heuristic name so creation never blocks on the
    naming model call - the console UI navigates to the project immediately. The nicer
    AI-generated name is applied afterward, in the background, via `rename_project`.

    Accepts a caller-supplied `id` (see `CreateProjectRequest`) so the console UI can open
    this project's WebSocket connection before this call even starts the state machine
    execution that will try to broadcast over it.
    """
    name = payload.name
    if not name:
        if not payload.message:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, detail="either name or message is required"
            )
        name = heuristic_name(payload.message)

    if payload.id is not None:
        try:
            uuid.UUID(payload.id)
        except ValueError as err:
            msg = "id must be a valid UUID"
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=msg) from err
    project_id = payload.id or str(uuid.uuid4())
    repo = request.app.state.project_repository
    try:
        project = repo.create_project(project_id=project_id, name=name)
    except ProjectAlreadyExistsError as err:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(err)) from err
    if payload.name is None and payload.message:
        background_tasks.add_task(
            _apply_generated_name,
            repo,
            request.app.state.project_namer,
            project.id,
            payload.message,
        )
    if (sfn := request.app.state.state_machine_client) is not None:
        sfn.start_execution(project.id, message=payload.message or "")
    return _to_response(project, _orchestration_mode(request))


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
    mode = _orchestration_mode(request)
    return [_to_response(p, mode) for p in repo.list_pending(station)]


@router.get("", response_model=list[ProjectResponse])
def list_projects(request: Request) -> list[ProjectResponse]:
    """List every project, most recently updated first - backs the portfolio dashboard."""
    repo = request.app.state.project_repository
    mode = _orchestration_mode(request)
    return [_to_response(p, mode) for p in repo.list_projects()]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, request: Request) -> ProjectResponse:
    """Return one project's current position on the line."""
    repo = request.app.state.project_repository
    project = repo.get_project(project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="project not found")
    return _to_response(project, _orchestration_mode(request))


@router.post("/{project_id}/stream-ticket", response_model=StreamTicketResponse)
def create_stream_ticket(project_id: str, request: Request) -> StreamTicketResponse:
    """Mint a short-lived, one-time credential for a project stream.

    The project may not exist yet: the landing page reserves a random project ID and
    opens its stream before creating the project, so the first agent turn cannot race
    the WebSocket handshake.
    """
    repo = request.app.state.connections_repository
    if repo is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="live project streams are not configured",
        )
    return StreamTicketResponse(ticket=repo.issue_ticket(project_id))


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
    return _to_response(updated, _orchestration_mode(request))


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


_UPLOAD_CHUNK_BYTES = 1024 * 1024


async def _read_within_limit(file: UploadFile, max_bytes: int) -> bytes:
    """Read `file` into memory a chunk at a time, rejecting it as soon as it goes over.

    A single `await file.read()` would buffer the whole body regardless of size, letting
    one request hold an unbounded amount of worker memory - this stops as soon as the cap
    is crossed instead of reading (and discarding) the rest of an oversized upload.
    """
    chunks: list[bytes] = []
    total = 0
    while chunk := await file.read(_UPLOAD_CHUNK_BYTES):
        total += len(chunk)
        if total > max_bytes:
            detail = f"file exceeds the {max_bytes // (1024 * 1024)}MB upload limit"
            raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, detail=detail)
        chunks.append(chunk)
    return b"".join(chunks)


@router.post("/{project_id}/documents", response_model=UploadDocumentResponse)
async def upload_document(
    project_id: str, request: Request, file: UploadFile = File(...)
) -> UploadDocumentResponse:
    """Store a browser-uploaded document in S3 and return its key.

    The console never parses the file itself - a chat turn cites the returned `key` and
    the current station's agent fetches and parses it via `s3_get_document_text`, same
    as any other S3-resident document.
    """
    if request.app.state.project_repository.get_project(project_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="project not found")

    filename = file.filename or ""
    if not filename.lower().endswith(SUPPORTED_EXTENSIONS):
        supported = ", ".join(SUPPORTED_EXTENSIONS)
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"unsupported file type for {filename}; expected one of: {supported}",
        )

    settings = get_settings()
    if not (settings.s3_bucket and settings.s3_region):
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="S3_BUCKET and S3_REGION are not configured"
        )

    data = await _read_within_limit(file, settings.max_upload_bytes)
    key = await run_sync(
        put_uploaded_document,
        settings.s3_bucket,
        UploadedDocument(project_id, filename, data),
        settings.s3_region,
    )
    return UploadDocumentResponse(key=key, filename=filename)


@router.get("/{project_id}/builds", response_model=BuildsResponse)
def list_builds(project_id: str, request: Request) -> BuildsResponse:
    """Return the build pull requests Review opened, with whatever GitHub says now.

    Polled by the console every few seconds while work is in flight, so it reads GitHub
    directly rather than spending a model turn to ask the same question. Reports the
    pull requests with unknown status when there is no token, instead of 404ing - a link
    the human can click is still worth showing.
    """
    repo = request.app.state.project_repository
    report = _get_review_report(repo, project_id)
    if report is None:
        return BuildsResponse()
    if not report.builds:
        return BuildsResponse(repository=report.repository)

    token = get_settings().github_pat
    watching = token is not None and report.repository is not None
    builds: list[BuildResponse] = []
    for build in report.builds:
        state = (
            read_pull_request(token.get_secret_value(), report.repository, build.number)
            if watching and token is not None and report.repository is not None
            else None
        )
        builds.append(
            BuildResponse(
                group_id=build.group_id,
                number=build.number,
                url=build.url,
                title=state.title if state else None,
                unit_ids=build.unit_ids,
                issue_numbers=build.issue_numbers,
                state=state.state if state else None,
                checks=state.checks if state else None,
                draft=state.draft if state else None,
            )
        )
    return BuildsResponse(repository=report.repository, builds=builds, watching=watching)


@router.post("/{project_id}/builds/{number}/merge", response_model=MergeBuildResponse)
def merge_build(
    project_id: str, number: int, request: Request, background_tasks: BackgroundTasks
) -> MergeBuildResponse:
    """Merge one build pull request Review opened - a human action, not an agent one.

    No agent tool can call this: `tools/github.py` deliberately excludes
    `merge_pull_request` from every station's GitHub toolset (see AGENTS.md, "do not
    remove or bypass a human approval gate"). This endpoint exists only for a human to
    trigger explicitly from the console, at or after the G3 gate, and only for a pull
    request Review itself already recorded against this project - never an arbitrary
    number a caller supplies.
    """
    repo = request.app.state.project_repository
    project = repo.get_project(project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="project not found")
    if project.station not in _MERGEABLE_STATIONS:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"project has not reached the G3 gate yet (at {project.station.value})",
        )

    report = _get_review_report(repo, project_id)
    if report is None or report.repository is None:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="no review builds recorded yet")
    if not any(build.number == number for build in report.builds):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="not a build of this project")

    token = get_settings().github_pat
    if token is None:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="GITHUB_PAT is not configured")

    result = resolve_and_merge(token.get_secret_value(), report.repository, number)
    if not result.merged:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=result.message)
    background_tasks.add_task(_auto_preview)
    return MergeBuildResponse(
        merged=True,
        sha=result.sha,
        message=result.message,
        next_step=(
            "the preview is starting automatically"
            if get_settings().preview_checkout_path
            else (
                f"pull {report.repository}'s default branch locally, then run "
                "`make preview` (or that repo's own preview script) in that checkout "
                "to show the demo"
            )
        ),
    )


def _auto_preview() -> None:
    """Best-effort: pull and start the local preview after a merge, no click required.

    Silent no-op without `PREVIEW_CHECKOUT_PATH` configured, or if git/the script fails -
    this rides on top of an already-completed merge and must never surface as an error on
    a response that already told the human the merge itself succeeded.
    """
    settings = get_settings()
    path = settings.preview_checkout_path
    if path is None:
        return
    pulled = pull_default_branch(path)
    if not pulled.ok:
        logger.warning("auto-preview: could not pull %s: %s", path, pulled.message)
        return
    target = PreviewTarget(
        path,
        settings.preview_command,
        settings.preview_backend_port,
        settings.preview_frontend_port,
    )
    start_preview(target)


@router.post(
    "/{project_id}/preview",
    response_model=PreviewResponse,
    responses={409: {"description": "Local preview is not configured"}},
)
def preview_project(project_id: str, request: Request) -> PreviewResponse:
    """Pull the merged default branch locally and start the target repo's own preview script.

    A laptop-demo convenience: the console API and the checkout must be the same machine
    (`PREVIEW_CHECKOUT_PATH`). A merge already triggers this in the background - this
    endpoint is for re-running it by hand, e.g. after a later merge.
    """
    if request.app.state.project_repository.get_project(project_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="project not found")

    settings = get_settings()
    path = settings.preview_checkout_path
    if path is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="PREVIEW_CHECKOUT_PATH is not configured"
        )

    pulled = pull_default_branch(path)
    if not pulled.ok:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=f"could not pull: {pulled.message}")

    healthy = start_preview(
        PreviewTarget(
            path,
            settings.preview_command,
            settings.preview_backend_port,
            settings.preview_frontend_port,
        )
    )
    return PreviewResponse(
        running=True,
        backend_url=f"http://localhost:{settings.preview_backend_port}",
        frontend_url=f"http://localhost:{settings.preview_frontend_port}",
        message=(
            "preview is live"
            if healthy
            else "started, but not responding yet - give it a few more seconds"
        ),
    )


@router.post("/{project_id}/preview/stop", response_model=PreviewResponse)
def stop_preview_project(project_id: str, request: Request) -> PreviewResponse:
    """Free the preview's ports - safe to call even if nothing is running."""
    if request.app.state.project_repository.get_project(project_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="project not found")

    settings = get_settings()
    path = settings.preview_checkout_path
    if path is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="PREVIEW_CHECKOUT_PATH is not configured"
        )

    stop_preview(path, settings.preview_command)
    return PreviewResponse(running=False, message="preview stopped")


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
    previous = repo.get_artifact(project_id, agent)
    finished = _finish_if_requested(repo, project, agent, prompt, previous)
    if finished is not None:
        return _to_response(finished, _orchestration_mode(request))

    predecessors = _predecessor_contents(repo, project_id, agent)
    context = request.app.state.context_repository.get_context().context
    prompt = _build_prompt(predecessors, previous.content if previous else None, prompt, context)
    raw_result = request.app.state.local_agent_client.invoke(
        agent, prompt=prompt, project_id=project_id
    )
    if raw_result is None:
        # a valid outcome, not a failure: the agent chose not to draft anything this
        # turn (e.g. Distill only asked a clarifying question) - see LocalAgentClient.invoke.
        # Nothing to save or gate on, so the project sits exactly where it was.
        return _to_response(project, _orchestration_mode(request))
    result = _scored(raw_result, agent, predecessors)
    repo.save_artifact(project_id, agent, result)

    if not _advances(agent, result):
        return _to_response(project, _orchestration_mode(request))
    updated = repo.advance_after_artifact(project_id, agent)
    return _to_response(updated, _orchestration_mode(request))


def _is_incomplete(result: dict[str, Any]) -> bool:
    raw_completeness = result.get("completeness")
    if not isinstance(raw_completeness, dict):
        return False
    completeness = cast("dict[str, Any]", raw_completeness)
    score = completeness.get("score")
    return bool(completeness.get("gaps")) or (isinstance(score, (int, float)) and score < 1.0)


_FINISH_PHRASE = "project completed"


def _is_finish_phrase(prompt: str) -> bool:
    return prompt.strip().casefold() == _FINISH_PHRASE


def _advances(agent: str, result: dict[str, Any]) -> bool:
    """Whether a finished, gap-free draft should move the project to its next station.

    True for every agent station except Showroom: unlike the others, its next station is
    DONE (shipped) rather than a human approval gate, so completing its own deterministic
    checklist can't be the thing that ships the project - that needs an explicit
    `_is_finish_phrase` message instead (see `_finish_if_requested`).
    """
    return agent != Station.SHOWROOM.value and not _is_incomplete(result)


def _finish_if_requested(
    repo: ProjectRepository,
    project: Project,
    agent: str,
    prompt: str,
    previous: Artifact | None,
) -> Project | None:
    """Advances Showroom to DONE on an explicit "project completed" message.

    `None` for every other station or prompt, so both `/advance` endpoints fall through
    to their normal agent-invocation path unchanged. Raises if Showroom hasn't produced a
    gap-free run of show yet, rather than silently invoking the agent on a phrase it was
    never meant to see.
    """
    if project.station != Station.SHOWROOM or not _is_finish_phrase(prompt):
        return None
    if previous is None or _is_incomplete(previous.content):
        detail = "Host hasn't produced a finished run of show yet"
        raise HTTPException(status.HTTP_409_CONFLICT, detail=detail)
    return repo.advance_after_artifact(project.id, agent)


def _finish_response_or_none(
    repo: ProjectRepository,
    project: Project,
    agent: str,
    prompt: str,
    previous: Artifact | None,
) -> StreamingResponse | None:
    """SSE counterpart of `_finish_if_requested`, for `advance_project_stream`."""
    finished = _finish_if_requested(repo, project, agent, prompt, previous)
    if finished is None:
        return None

    async def finish_stream() -> AsyncIterator[str]:
        # only ever reached via advance_project_stream, which 409s before this if a
        # state machine exists - always "local" here, not worth threading request through.
        yield _sse(
            {"done": True, "project": _to_response(finished, "local").model_dump(mode="json")}
        )

    return StreamingResponse(finish_stream(), media_type="text/event-stream")


def _sse(event: dict[str, Any]) -> str:
    return f"data: {json.dumps(event)}\n\n"


# Relayed to the browser untouched - only `error` and `result` are acted on here. See
# agent_runtime.factory for what each one carries.
_RELAYED_EVENTS = ("chunk", "draft", "tool_call", "thinking", "usage")

# Tool calls that change real state on GitHub (a PR, a Copilot hand-off) rather than
# just reading it - see `_partial_progress_content`, which is why these are worth
# remembering even from a turn that never produced a finished artifact.
_SIDE_EFFECT_TOOLS = ("create_pull_request_with_copilot", "assign_copilot_to_issue")


def _is_finished_side_effect(event: dict[str, Any]) -> bool:
    """Whether `event` is a `tool_call` "done" event for one of `_SIDE_EFFECT_TOOLS`.

    Read-only tools (a file fetch, a search) aren't worth remembering past a failed
    turn - only ones that changed real state on GitHub are.
    """
    call = event.get("tool_call")
    return (
        isinstance(call, dict)
        and call.get("status") == "done"
        and call.get("name") in _SIDE_EFFECT_TOOLS
    )


def _partial_progress_content(
    previous: Artifact | None, side_effects: list[dict[str, Any]], error: str
) -> dict[str, Any]:
    """What to save when a turn fails after a `_SIDE_EFFECT_TOOLS` call already succeeded.

    A turn can time out or error after `create_pull_request_with_copilot` already
    succeeded on GitHub's side - without this, the next turn's grounding (see
    `_build_prompt`) has no local record that happened, and a human reloading the
    console mid-failure sees nothing at all. Layered on top of `previous`'s content
    (if any) rather than replacing it, so a genuinely-valid earlier draft survives an
    unrelated later failure.
    """
    return {
        **(previous.content if previous else {}),
        "tool_calls_before_failure": side_effects,
        "last_turn_error": error,
    }


def _finish_turn(
    repo: ProjectRepository,
    agent: str,
    project: Project,
    predecessors: dict[str, dict[str, Any]],
    result: dict[str, Any] | None,
) -> dict[str, Any]:
    """Score and save a turn's finished draft, advancing the station if it's gap-free.

    `result` is `None` when the agent chose not to draft anything this turn (e.g. a
    clarifying question) - a valid outcome, not a failure, so the project just stays put.
    """
    # only ever reached via advance_project_stream, which 409s before this if a state
    # machine exists - always "local" here, not worth threading request through.
    if result is None:
        return {"done": True, "project": _to_response(project, "local").model_dump(mode="json")}
    scored = _scored(result, agent, predecessors)
    repo.save_artifact(project.id, agent, scored)
    updated = (
        repo.advance_after_artifact(project.id, agent) if _advances(agent, scored) else project
    )
    return {"done": True, "project": _to_response(updated, "local").model_dump(mode="json")}


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
    previous = repo.get_artifact(project_id, agent)
    if (response := _finish_response_or_none(repo, project, agent, prompt, previous)) is not None:
        return response

    predecessors = _predecessor_contents(repo, project_id, agent)
    prompt = _build_prompt(
        predecessors,
        previous.content if previous else None,
        prompt,
        request.app.state.context_repository.get_context().context,
    )
    local_agent_client = request.app.state.local_agent_client

    async def event_stream() -> AsyncIterator[str]:
        result: dict[str, Any] | None = None
        # boxes the raw HTTP response to the agent's dev server, so a disconnect (see
        # below) can close it from here and unblock the `next()` call that's stuck
        # reading it in the worker thread - without this the agent invocation (and any
        # tool call it's mid-way through) just keeps running unseen after "Stop".
        held_response: list[Any] = []
        gen = local_agent_client.stream(
            agent, prompt, project_id=project_id, on_response=held_response.append
        )
        # populated as `tool_call` "done" events for `_SIDE_EFFECT_TOOLS` are relayed below,
        # so a failure partway through the turn still has something to persist - see
        # `_partial_progress_content`.
        side_effects: list[dict[str, Any]] = []

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
                relayed = next((key for key in _RELAYED_EVENTS if key in event), None)
                if relayed is not None:
                    yield _sse({relayed: event[relayed]})
                    if _is_finished_side_effect(event):
                        side_effects.append(event["tool_call"])
                elif "error" in event:
                    if side_effects:
                        content = _partial_progress_content(previous, side_effects, event["error"])
                        repo.save_artifact(project_id, agent, content)
                    yield _sse({"error": event["error"]})
                    return
                elif "result" in event:
                    result = event["result"]

            yield _sse(_finish_turn(repo, agent, project, predecessors, result))
        except Exception as exc:
            # covers the agent stream itself *and* the save-artifact/advance-station
            # calls after it - those run after the HTTP response has already started
            # streaming, so an uncaught exception here would otherwise just kill the
            # connection (client sees a raw network error, not a clean {"error": ...}).
            logger.exception("advance_project_stream failed for %s/%s", project_id, agent)
            if side_effects:
                content = _partial_progress_content(previous, side_effects, str(exc))
                repo.save_artifact(project_id, agent, content)
            yield _sse({"error": str(exc)})
        finally:
            if held_response:
                held_response[0].close()

    return StreamingResponse(event_stream(), media_type="text/event-stream")


def _next_distill_message(pending_question: dict[str, Any] | None, answer: str) -> str:
    """Fold a human's answer into the conversation Distill's next turn is grounded in.

    `pending_question["prior_message"]` is the full exchange so far (see
    `orchestration.persist_question`) - without threading it forward, each round would
    only ever carry the latest question, dropping everything answered before it.
    """
    if pending_question is None:
        return answer
    prior_message = pending_question.get("prior_message", "")
    if pending_question.get("status") == "questions":
        asked = "\n".join(f"- {q['question']}" for q in pending_question.get("questions", []))
        exchange = f"You asked:\n{asked}\n\nMy answer: {answer}"
    else:
        exchange = f"You said: {pending_question.get('message', '')}\n\nMy reply: {answer}"
    return f"{prior_message}\n\n{exchange}" if prior_message else exchange


@router.post("/{project_id}/answer", response_model=ProjectResponse)
def answer_question(project_id: str, payload: AnswerRequest, request: Request) -> ProjectResponse:
    """Answer Distill's pending clarifying question(s) and resume the paused execution.

    Only meaningful once a state machine is deployed - Distill's elicitation loop in
    `infra/stacks/orchestration_stack.py` is what pauses on a task token in the first
    place; the LOCAL-only `/advance` path just calls the agent again directly instead.
    """
    repo = request.app.state.project_repository
    project = repo.get_project(project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="project not found")
    if project.station != Station.DISTILL or project.task_token is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="project is not waiting on a Distill question",
        )
    sfn = request.app.state.state_machine_client
    if sfn is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="not available without a state machine"
        )

    next_message = _next_distill_message(project.pending_question, payload.answer)
    # A bare string, not {"message": next_message} - _elicitation_wait's
    # result_path="$.message" puts this task's result directly at $.message, and
    # _agent_task's prompt reads $.message as plain text, not as a wrapper object.
    sfn.send_task_success(project.task_token, next_message)
    repo.clear_pending_question(project_id)

    updated = repo.get_project(project_id)
    if updated is None:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="project missing after answering",
        )
    return _to_response(updated, _orchestration_mode(request))


@router.post("/{project_id}/decisions", response_model=ProjectResponse)
def submit_decision(
    project_id: str, payload: DecisionRequest, request: Request, background_tasks: BackgroundTasks
) -> ProjectResponse:
    """Approve or reject the gate the project is held at, then release the execution.

    An approval at the G3 gate (`SHOWROOM_APPROVAL`) also merges every build Review
    opened before it completes - see `_merge_all_builds_or_fail` - and starts the local
    preview in the background if one is configured, so nothing needs a click after this.
    The decision is written before the task token is released so the audit trail can
    never lag the state machine, and is not written at all if a build's merge fails, so
    it can never claim an approval the demo cannot actually show.
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

    if payload.approved and project.station == Station.SHOWROOM_APPROVAL:
        _merge_all_builds_or_fail(repo, project_id)
        background_tasks.add_task(_auto_preview)

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
    return _to_response(updated, _orchestration_mode(request))
