"""The stable, machine-readable names for why an API request failed.

A client branches on the code, never on the message: the message is for a person and may be
reworded. `api.errors` gives each code its HTTP status and default message, and the console
mirrors the list in `ui/console/src/api/errorCodes.ts` (a test fails if they drift).
"""

from enum import StrEnum


class ErrorCode(StrEnum):
    """Why a request failed, grouped by what the caller can do about it."""

    # sign-in
    NOT_AUTHENTICATED = "not_authenticated"
    TOKEN_INVALID = "token_invalid"  # noqa: S105 - a code name, not a credential
    SIGN_IN_NOT_CONFIGURED = "sign_in_not_configured"

    # something asked for is not there
    PROJECT_NOT_FOUND = "project_not_found"
    ARTIFACT_NOT_FOUND = "artifact_not_found"
    BUILD_NOT_FOUND = "build_not_found"

    # the request itself is wrong
    NAME_REQUIRED = "name_required"
    INVALID_PROJECT_ID = "invalid_project_id"
    UPLOAD_TOO_LARGE = "upload_too_large"
    UNSUPPORTED_FILE_TYPE = "unsupported_file_type"

    # the project is not in a state that allows this
    PROJECT_ALREADY_EXISTS = "project_already_exists"
    NOT_AT_AGENT_STATION = "not_at_agent_station"
    NOT_AWAITING_APPROVAL = "not_awaiting_approval"
    NOT_AT_MERGE_GATE = "not_at_merge_gate"
    NO_PENDING_QUESTION = "no_pending_question"
    STATE_MACHINE_ACTIVE = "state_machine_active"
    STATE_MACHINE_REQUIRED = "state_machine_required"
    SHOWROOM_NOT_READY = "showroom_not_ready"
    NO_BUILDS_RECORDED = "no_builds_recorded"
    BUILDS_IN_PROGRESS = "builds_in_progress"

    # this server is not set up for it
    STREAMS_NOT_CONFIGURED = "streams_not_configured"
    STORAGE_NOT_CONFIGURED = "storage_not_configured"
    PREVIEW_NOT_CONFIGURED = "preview_not_configured"
    GITHUB_NOT_CONFIGURED = "github_not_configured"

    # a system we depend on refused, or our own state is inconsistent
    MERGE_FAILED = "merge_failed"
    PREVIEW_PULL_FAILED = "preview_pull_failed"
    PROJECT_MISSING = "project_missing"


class TurnErrorCode(StrEnum):
    """Why an agent turn failed, carried on the stream's `error` event and the turn's record.

    Separate from `ErrorCode`: these are not HTTP responses, so they have no status. The
    console words each in `ui/console/src/lib/errors.ts`.
    """

    AGENT_FAILED = "agent_failed"
    AGENT_TIMEOUT = "agent_timeout"
    AGENT_OUTPUT_LIMIT = "agent_output_limit"
    AGENT_NO_RESULT = "agent_no_result"
    INVALID_PROMPT = "invalid_prompt"
    INVALID_PROJECT = "invalid_project"
    # the run itself finished or failed in the API, after the agent, e.g. saving its artifact
    TURN_FAILED = "turn_failed"
