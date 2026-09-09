"""Wire-format DTOs for the project endpoints.

Separate from `core.domain.project` on purpose: the API contract can stay stable while
the domain model changes, and timestamps cross the wire as ISO strings.
"""

from typing import Any

from pydantic import BaseModel

from core.domain.project import Station


class CreateProjectRequest(BaseModel):
    """Body for `POST /projects`.

    Either a name, or a first message to generate one from (see ProjectNamer) - the
    console UI's landing-page chatbox creates a project straight from a message with
    no name typed in.
    """

    name: str | None = None
    message: str | None = None


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


class RenameProjectRequest(BaseModel):
    """Body for `PATCH /projects/{id}`."""

    name: str


class ArtifactResponse(BaseModel):
    """An agent's artifact as returned to the console."""

    agent: str
    content: dict[str, Any]
    created_at: str


class UploadDocumentResponse(BaseModel):
    """Body for `POST /projects/{id}/documents` after a browser upload lands in S3.

    `key` is what a chat turn cites so the current station's agent can fetch and parse
    it itself via `s3_get_document_text` - the console never parses the file.
    """

    key: str
    filename: str


class AdvanceRequest(BaseModel):
    """Body for `POST /projects/{id}/advance(/stream)`.

    Local-dev-only (see orchestration.local_agent_client): the raw material Distill
    (or whichever agent is current) actually needs - falls back to a placeholder if
    omitted, but a real chat turn should always supply one.
    """

    prompt: str | None = None


class BuildResponse(BaseModel):
    """One build pull request as the console sees it.

    `state` and `checks` are `null` when GitHub could not be read, which is not the same
    as a failure - the console says "unknown" rather than inventing a verdict.
    """

    group_id: str
    number: int
    url: str
    title: str | None = None
    unit_ids: list[str] = []
    issue_numbers: list[int] = []
    state: str | None = None
    checks: str | None = None
    draft: bool | None = None


class BuildsResponse(BaseModel):
    """Every build pull request Review handed to a coding agent, with live status."""

    repository: str | None = None
    builds: list[BuildResponse] = []
    #: False when no token is configured - the console links out instead of polling.
    watching: bool = False


class MergeBuildResponse(BaseModel):
    """Body for `POST /projects/{id}/builds/{number}/merge`.

    A human clicked merge - see `api.routers.projects.merge_build` for why this is never
    something an agent can trigger itself.
    """

    merged: bool
    sha: str | None = None
    message: str
    #: Advisory only - the console cannot reach into a human's local checkout to run it.
    next_step: str


class PreviewResponse(BaseModel):
    """Body for `POST /projects/{id}/preview` and its `/stop` counterpart.

    A laptop-demo convenience (`infrastructure/local_preview.py`) - `running=False` with
    no error is a normal response when `PREVIEW_CHECKOUT_PATH` isn't configured, since a
    project must still work end-to-end without this.
    """

    running: bool
    backend_url: str | None = None
    frontend_url: str | None = None
    message: str
