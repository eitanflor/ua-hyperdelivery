import { CircleNotchIcon } from "@phosphor-icons/react";
import { cn } from "../../lib/cn";

/** Indeterminate progress. Prefer a skeleton when the shape of the result is known. */
export function Spinner({ className }: { className?: string }) {
  return (
    <CircleNotchIcon
      weight="bold"
      className={cn("size-4 animate-spin", className)}
      aria-hidden="true"
    />
  );
}
