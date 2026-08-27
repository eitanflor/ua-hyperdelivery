from pydantic import BaseModel

from core.domain.project import Station


class CreateProjectRequest(BaseModel):
    name: str


class ProjectResponse(BaseModel):
    id: str
    name: str
    station: Station
    created_at: str
    updated_at: str


class DecisionRequest(BaseModel):
    approved: bool
    signer: str
    comment: str | None = None
