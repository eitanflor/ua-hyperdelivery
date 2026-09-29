import {
  CheckCircleIcon,
  CircleDashedIcon,
  MinusCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

export type Status = "pending" | "running" | "done" | "failed" | "stopped";

const LABEL: Record<Status, string> = {
  pending: "Not started",
  running: "In progress",
  done: "Done",
  failed: "Failed",
  stopped: "Stopped",
};

/** One mark for a step's whole lifecycle, so a row changes state in place rather than
 * swapping between unrelated icons (detail.design `motion-22`). The key remount replays
 * the pop on every change, which reduced motion flattens to an instant swap. */
export function StatusMark({ status, className }: { status: Status; className?: string }) {
  const size = cn("size-3.5 shrink-0", className);
  return (
    <span key={status} role="img" aria-label={LABEL[status]} className="inline-flex animate-pop">
      {status === "running" && <Spinner className={cn(size, "text-fg-subtle")} />}
      {status === "pending" && <CircleDashedIcon className={cn(size, "text-fg-subtle")} />}
      {status === "done" && <CheckCircleIcon weight="fill" className={cn(size, "text-success")} />}
      {status === "failed" && <XCircleIcon weight="fill" className={cn(size, "text-danger")} />}
      {status === "stopped" && <MinusCircleIcon className={cn(size, "text-fg-subtle")} />}
    </span>
  );
}
