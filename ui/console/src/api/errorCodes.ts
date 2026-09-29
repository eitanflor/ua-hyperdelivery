// Why an API request failed, as the server names it. Mirrors `ErrorCode` in
// src/core/errors.py - tests/unit/test_error_codes.py fails if the two drift, so change them
// together. A client branches on the code, never on the message.

export const ERROR_CODES = [
  "not_authenticated",
  "token_invalid",
  "sign_in_not_configured",
  "project_not_found",
  "artifact_not_found",
  "build_not_found",
  "name_required",
  "invalid_project_id",
  "upload_too_large",
  "unsupported_file_type",
  "project_already_exists",
  "not_at_agent_station",
  "not_awaiting_approval",
  "not_at_merge_gate",
  "no_pending_question",
  "state_machine_active",
  "state_machine_required",
  "showroom_not_ready",
  "no_builds_recorded",
  "builds_in_progress",
  "streams_not_configured",
  "storage_not_configured",
  "preview_not_configured",
  "github_not_configured",
  "merge_failed",
  "preview_pull_failed",
  "project_missing",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

// Why an agent turn failed, on the stream's `error` event and the turn's record. Mirrors
// `TurnErrorCode` in src/core/errors.py, and is checked by the same test.
export const TURN_ERROR_CODES = [
  "agent_failed",
  "agent_timeout",
  "agent_output_limit",
  "agent_no_result",
  "invalid_prompt",
  "invalid_project",
  "turn_failed",
] as const;

export type TurnErrorCode = (typeof TURN_ERROR_CODES)[number];
