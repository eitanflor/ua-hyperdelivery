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
    repo = request.app.state.project_repository
    project = repo.create_project(project_id=str(uuid.uuid4()), name=payload.name)
    return _to_response(project)


@router.get("/pending/{station}", response_model=list[ProjectResponse])
def list_pending(station: Station, request: Request) -> list[ProjectResponse]:
    repo = request.app.state.project_repository
    return [_to_response(p) for p in repo.list_pending(station)]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str, request: Request) -> ProjectResponse:
    repo = request.app.state.project_repository
    project = repo.get_project(project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="project not found")
    return _to_response(project)


@router.post("/{project_id}/decisions", response_model=ProjectResponse)
def submit_decision(
    project_id: str, payload: DecisionRequest, request: Request
) -> ProjectResponse:
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
    # TODO(ADVA-3015): once the state machine is deployed, resume the paused execution here
    # via stepfunctions.send_task_success/send_task_failure using project.task_token.
    return _to_response(repo.get_project(project_id))
