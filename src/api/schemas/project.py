"""Wire-format DTOs for the project endpoints.

Separate from `core.domain.project` on purpose: the API contract can stay stable while
the domain model changes, and timestamps cross the wire as ISO strings.
"""

from typing import Any, Literal

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
    # Lets a caller open a WebSocket connection for this project (and wait for it to
    # actually connect) before the execution that will broadcast over it even starts -
    # otherwise the two race, see docs/decisions.md. Server-generated when omitted, so
    # existing callers (SDK, local mode) are unaffected.
    id: str | None = None


class ProjectResponse(BaseModel):
    """A project as returned to the console."""

    id: str
    name: str
    station: Station
    # Set while Distill is waiting on an answer instead of drafting - see
    # orchestration.persist_question. None the rest of the time.
    pending_question: dict[str, Any] | None = None
    # Tells the console UI which turn-advancing path to use - see
    # api.routers.projects._orchestration_mode.
    orchestration_mode: Literal["local", "deployed"]
    created_at: str
    updated_at: str


class DecisionRequest(BaseModel):
    """Body for `POST /projects/{id}/decisions`.

    There is no signer field: the signer is the authenticated caller. A `signer` sent by
    an older client is ignored rather than rejected, so it cannot claim someone else.
    """

    approved: bool
    comment: str | None = None


class DecisionResponse(BaseModel):
    """One recorded gate decision, as returned by `GET /projects/{id}/decisions`."""

    station: Station
    approved: bool
    signer: str
    comment: str | None = None
    decided_at: str


class ToolCallResponse(BaseModel):
    """One tool call in a recorded turn, its result already cut down (see core.domain.turn)."""

    id: str
    name: str
    status: str
    input: dict[str, Any] | None = None
    result: Any = None


class TurnResponse(BaseModel):
    """One recorded agent turn, as returned by `GET /projects/{id}/turns`."""

    agent: str
    started_at: str
    message: str | None = None
    duration_ms: int | None = None
    text: str
    tool_calls: list[ToolCallResponse]
    usage: dict[str, int] | None = None
    error: str | None = None
    error_code: str | None = None


class AnswerRequest(BaseModel):
    """Body for `POST /projects/{id}/answer`, resuming Distill's elicitation wait."""

    answer: str


class StreamTicketResponse(BaseModel):
    """A short-lived, one-time credential for opening a project's WebSocket."""

    ticket: str


class RenameProjectRequest(BaseModel):
    """Body for `PATCH /projects/{id}`."""

    name: str


class ArtifactResponse(BaseModel):
    """An agent's artifact as returned to the console."""

    agent: str
    content: dict[str, Any]
    version: int = 1
    created_at: str


class StoredDocumentResponse(BaseModel):
    """One document uploaded to a project, as listed by `GET /projects/{id}/documents`."""

    key: str
    filename: str
    size: int
    uploaded_at: str | None = None


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

    # The person's own words for this turn, kept on its record so the conversation can be
    # rebuilt on any machine. `prompt` is the console's transcript, not what they typed.
    message: str | None = None


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
