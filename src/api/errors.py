"""One shape for every API failure: an HTTP status, a stable code, and a message.

A route raises `ApiError(ErrorCode.X)`; the status and default message come from `CATALOG`, so
the same code can never answer with two different statuses. The body is
`{"detail": "...", "code": "..."}` - `detail` is unchanged from before codes existed, so a
client that only reads it keeps working.
"""

from typing import Final, NamedTuple

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from core.errors import ErrorCode


class ErrorResponse(BaseModel):
    """The body of a failed request, as documented in the OpenAPI schema."""

    detail: str
    code: ErrorCode | None = None


class _Entry(NamedTuple):
    status: int
    message: str


CATALOG: Final[dict[ErrorCode, _Entry]] = {
    ErrorCode.NOT_AUTHENTICATED: _Entry(status.HTTP_401_UNAUTHORIZED, "Missing sign-in token."),
    ErrorCode.TOKEN_INVALID: _Entry(
        status.HTTP_401_UNAUTHORIZED, "Invalid or expired sign-in token."
    ),
    ErrorCode.SIGN_IN_NOT_CONFIGURED: _Entry(
        status.HTTP_401_UNAUTHORIZED, "Sign-in is not configured on this server."
    ),
    ErrorCode.PROJECT_NOT_FOUND: _Entry(status.HTTP_404_NOT_FOUND, "project not found"),
    ErrorCode.ARTIFACT_NOT_FOUND: _Entry(status.HTTP_404_NOT_FOUND, "artifact not found"),
    ErrorCode.BUILD_NOT_FOUND: _Entry(status.HTTP_404_NOT_FOUND, "not a build of this project"),
    ErrorCode.NAME_REQUIRED: _Entry(status.HTTP_400_BAD_REQUEST, "name must not be empty"),
    ErrorCode.INVALID_PROJECT_ID: _Entry(status.HTTP_400_BAD_REQUEST, "id must be a valid UUID"),
    ErrorCode.UPLOAD_TOO_LARGE: _Entry(status.HTTP_413_CONTENT_TOO_LARGE, "file is too large"),
    ErrorCode.UNSUPPORTED_FILE_TYPE: _Entry(
        status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "unsupported file type"
    ),
    ErrorCode.PROJECT_ALREADY_EXISTS: _Entry(status.HTTP_409_CONFLICT, "project already exists"),
    ErrorCode.NOT_AT_AGENT_STATION: _Entry(
        status.HTTP_409_CONFLICT, "project is not at an agent station"
    ),
    ErrorCode.NOT_AWAITING_APPROVAL: _Entry(
        status.HTTP_409_CONFLICT, "project is not awaiting approval"
    ),
    ErrorCode.NOT_AT_MERGE_GATE: _Entry(
        status.HTTP_409_CONFLICT, "project has not reached the G3 gate yet"
    ),
    ErrorCode.NO_PENDING_QUESTION: _Entry(
        status.HTTP_409_CONFLICT, "project is not waiting on a Distill question"
    ),
    ErrorCode.STATE_MACHINE_ACTIVE: _Entry(
        status.HTTP_409_CONFLICT, "not available once the state machine is deployed"
    ),
    ErrorCode.STATE_MACHINE_REQUIRED: _Entry(
        status.HTTP_409_CONFLICT, "not available without a state machine"
    ),
    ErrorCode.SHOWROOM_NOT_READY: _Entry(
        status.HTTP_409_CONFLICT, "Host hasn't produced a finished demo script yet"
    ),
    ErrorCode.NO_BUILDS_RECORDED: _Entry(status.HTTP_409_CONFLICT, "no review builds recorded yet"),
    ErrorCode.BUILDS_IN_PROGRESS: _Entry(
        status.HTTP_409_CONFLICT, "approval blocked - builds still in progress"
    ),
    ErrorCode.STREAMS_NOT_CONFIGURED: _Entry(
        status.HTTP_409_CONFLICT, "live project streams are not configured"
    ),
    ErrorCode.STORAGE_NOT_CONFIGURED: _Entry(
        status.HTTP_409_CONFLICT, "S3_BUCKET and S3_REGION are not configured"
    ),
    ErrorCode.PREVIEW_NOT_CONFIGURED: _Entry(
        status.HTTP_409_CONFLICT, "PREVIEW_CHECKOUT_PATH is not configured"
    ),
    ErrorCode.GITHUB_NOT_CONFIGURED: _Entry(
        status.HTTP_409_CONFLICT, "GITHUB_PAT is not configured"
    ),
    ErrorCode.MERGE_FAILED: _Entry(status.HTTP_502_BAD_GATEWAY, "could not merge"),
    ErrorCode.PREVIEW_PULL_FAILED: _Entry(status.HTTP_502_BAD_GATEWAY, "could not pull"),
    ErrorCode.PROJECT_MISSING: _Entry(
        status.HTTP_500_INTERNAL_SERVER_ERROR, "project missing after the update"
    ),
}

# What every route can answer with besides its own success, for the OpenAPI schema.
ERROR_RESPONSES: Final[dict[int | str, dict[str, object]]] = {
    code: {"model": ErrorResponse} for code in sorted({entry.status for entry in CATALOG.values()})
}


class ApiError(HTTPException):
    """A failed request that carries its code. `detail` overrides the default message."""

    def __init__(self, code: ErrorCode, detail: str | None = None) -> None:
        """Take the status from the catalog; `detail` adds specifics to the default message."""
        entry = CATALOG[code]
        super().__init__(status_code=entry.status, detail=detail or entry.message)
        self.code = code


async def _handle_api_error(_request: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, ApiError):
        raise exc
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.code.value},
        headers=exc.headers,
    )


def register_error_handlers(app: FastAPI) -> None:
    """Make an `ApiError` answer with `{"detail", "code"}`; other errors keep the default."""
    app.add_exception_handler(ApiError, _handle_api_error)
