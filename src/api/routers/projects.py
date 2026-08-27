"""Project endpoints: create, inspect, and record gate decisions."""

import uuid

from fastapi import APIRouter, HTTPException, Request, status

from api.schemas.project import CreateProjectRequest, DecisionRequest, ProjectResponse
from core.domain.project import APPROVAL_STATIONS, Project, Station

router = APIRouter(prefix="/projects", tags=["projects"])


def _to_response(project: Project) -> ProjectResponse:
    return ProjectResponse(
        id=project.id,
        name=project.name,
        station=project.station,
        created_at=project.created_at.isoformat(),
        updated_at=project.updated_at.isoformat(),
    )


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(payload: CreateProjectRequest, request: Request) -> ProjectResponse:
    """Create a project and, once the state machine exists, start its execution."""
    repo = request.app.state.project_repository
    project = repo.create_project(project_id=str(uuid.uuid4()), name=payload.name)
    if (sfn := request.app.state.state_machine_client) is not None:
        sfn.start_execution(project.id)
    return _to_response(project)


@router.get("/pending/{station}", response_model=list[ProjectResponse])
def list_pending(station: Station, request: Request) -> list[ProjectResponse]:
    """List the projects that owe a decision at `station`."""
    repo = request.app.state.project_repository
    return [_to_response(p) for p in repo.list_pending(station)]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, request: Request) -> ProjectResponse:
    """Return one project's current position on the line."""
    repo = request.app.state.project_repository
    project = repo.get_project(project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="project not found")
    return _to_response(project)


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
