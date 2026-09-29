import { ApiError, TurnError } from "../api/client";
import type { ErrorCode, TurnErrorCode } from "../api/errorCodes";

export interface FriendlyError {
  /** What went wrong, in the user's terms. */
  title: string;
  /** Why, and what it means for their work. */
  detail: string;
  /** What they can do about it. `null` means there is no useful action. */
  action: "retry" | "reload" | "signin" | null;
}

type Entry = Omit<FriendlyError, "detail"> & {
  /** Fixed wording; without it the server's own message is the detail. */
  detail?: string;
};

const SESSION: Entry = {
  title: "Your session expired",
  detail: "Sign in again to pick up where you left off. Nothing was lost.",
  action: "signin",
};
const GONE: Entry = {
  title: "That project is gone",
  detail: "It was deleted, or the link points at something that no longer exists.",
  action: "reload",
};
const MOVED_ON: Entry = {
  title: "This project moved on without you",
  detail:
    "Someone else advanced it, or the line is now driven by the state machine. " +
    "Reload to see where it actually is.",
  action: "reload",
};
const NOT_SET_UP: Entry = { title: "This isn't set up on the server", action: null };

/** What each code the server sends means to the person who hit it. A status alone cannot say:
 * a 409 is "someone else moved it on" and also "GITHUB_PAT is not configured". */
const BY_CODE: Partial<Record<ErrorCode, Entry>> = {
  not_authenticated: SESSION,
  token_invalid: SESSION,
  project_not_found: GONE,
  artifact_not_found: {
    title: "That document isn't there yet",
    detail: "The stage that writes it has not finished. Check back once it has.",
    action: "reload",
  },
  build_not_found: { title: "That build isn't part of this project", action: null },
  state_machine_active: MOVED_ON,
  not_at_agent_station: MOVED_ON,
  not_awaiting_approval: MOVED_ON,
  not_at_merge_gate: MOVED_ON,
  no_pending_question: MOVED_ON,
  project_already_exists: { title: "That project already exists", action: null },
  showroom_not_ready: { title: "The demo script isn't finished", action: null },
  no_builds_recorded: { title: "There are no builds to merge yet", action: null },
  builds_in_progress: { title: "Builds are still running", action: "retry" },
  merge_failed: { title: "GitHub could not merge", action: "retry" },
  preview_pull_failed: { title: "The preview could not update", action: "retry" },
  sign_in_not_configured: NOT_SET_UP,
  streams_not_configured: NOT_SET_UP,
  storage_not_configured: NOT_SET_UP,
  preview_not_configured: NOT_SET_UP,
  github_not_configured: NOT_SET_UP,
  state_machine_required: NOT_SET_UP,
  name_required: { title: "Give it a name", action: null },
  invalid_project_id: { title: "That project link is not valid", action: null },
  upload_too_large: { title: "That file is too large", action: null },
  unsupported_file_type: { title: "That file type isn't supported", action: null },
  project_missing: { title: "That change did not save", action: "retry" },
};

/** What each code an agent turn can fail with means to the person waiting on it. */
const BY_TURN_CODE: Partial<Record<TurnErrorCode, Entry>> = {
  agent_timeout: {
    title: "The agent took too long",
    detail: "It ran for over ten minutes and was stopped. Try a narrower request.",
    action: "retry",
  },
  agent_output_limit: {
    title: "The document was too big to finish",
    detail: "The model ran out of room. Ask for less at a time, such as one section.",
    action: null,
  },
  agent_no_result: { title: "The agent finished without an answer", action: "retry" },
  agent_failed: { title: "The agent could not finish", action: "retry" },
  turn_failed: { title: "The run stopped before it was saved", action: "retry" },
  invalid_prompt: { title: "Say what you want first", action: null },
  invalid_project: { title: "That project link is not valid", action: null },
};

/** Why a turn failed, as one sentence: the code's own wording, or the server's message. */
export function turnFailureText(code: TurnErrorCode | null | undefined, message: string): string {
  return (code && BY_TURN_CODE[code]?.detail) || message;
}

/** Turns a thrown value into something that diagnoses, explains and offers recovery.
 * Raw API strings like "409 conflict" fail all three. */
export function describeError(err: unknown): FriendlyError {
  if (err instanceof TurnError) {
    const entry = err.code ? BY_TURN_CODE[err.code] : undefined;
    if (entry) return { ...entry, detail: entry.detail ?? err.message };
  }
  if (err instanceof ApiError) {
    const entry = err.code ? BY_CODE[err.code] : undefined;
    if (entry) return { ...entry, detail: entry.detail ?? err.message };
    switch (err.status) {
      case 401:
      case 403:
        return {
          title: "Your session expired",
          detail: "Sign in again to pick up where you left off. Nothing was lost.",
          action: "signin",
        };
      case 404:
        return {
          title: "That project is gone",
          detail: "It was deleted, or the link points at something that no longer exists.",
          action: "reload",
        };
      case 409:
        return {
          title: "This project moved on without you",
          detail:
            "Someone else advanced it, or the line is now driven by the state machine. " +
            "Reload to see where it actually is.",
          action: "reload",
        };
      case 429:
        return {
          title: "Too many requests",
          detail: "The line is busy. Wait a moment and try again.",
          action: "retry",
        };
      default:
        if (err.status >= 500) {
          return {
            title: "The agent could not finish",
            detail: err.message || "The service failed partway through. Nothing was saved.",
            action: "retry",
          };
        }
        return { title: "That did not work", detail: err.message, action: "retry" };
    }
  }

  if (err instanceof DOMException && err.name === "AbortError") {
    return { title: "Stopped", detail: "The run was canceled before it finished.", action: null };
  }

  if (err instanceof TypeError) {
    return {
      title: "Lost connection",
      detail: "The console could not reach the API. Check your network, then try again.",
      action: "retry",
    };
  }

  return {
    title: "Something failed",
    detail: err instanceof Error ? err.message : String(err),
    action: "retry",
  };
}
