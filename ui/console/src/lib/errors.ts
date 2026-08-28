import { ApiError } from "../api/client";

export interface FriendlyError {
  /** What went wrong, in the user's terms. */
  title: string;
  /** Why, and what it means for their work. */
  detail: string;
  /** What they can do about it. `null` means there is no useful action. */
  action: "retry" | "reload" | "signin" | null;
}

/** Turns a thrown value into something that diagnoses, explains and offers recovery.
 * Raw API strings like "409 conflict" fail all three. */
export function describeError(err: unknown): FriendlyError {
  if (err instanceof ApiError) {
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
