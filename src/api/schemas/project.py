"""Wire-format DTOs for the project endpoints.

Separate from `core.domain.project` on purpose: the API contract can stay stable while
the domain model changes, and timestamps cross the wire as ISO strings.
"""

from pydantic import BaseModel

from core.domain.project import Station


class CreateProjectRequest(BaseModel):
    """Body for `POST /projects`."""

    name: str


class ProjectResponse(BaseModel):
    """A project as returned to the console."""

    id: str
    name: str
    station: Station
    created_at: str
    updated_at: str


class DecisionRequest(BaseModel):
    """Body for `POST /projects/{id}/decisions`."""

    approved: bool
    signer: str
    comment: str | None = None
