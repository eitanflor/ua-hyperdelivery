import { useState } from "react";
import { CaretRightIcon, CheckIcon, CircleDashedIcon } from "@phosphor-icons/react";
import type { PlanStep } from "../../lib/plan";
import { cn } from "../../lib/cn";
import { Spinner } from "../ui/Spinner";

/**
 * The agent's plan for the current turn, pinned above the composer.
 *
 * Not in the thread: a plan is the state of the run rather than something the agent
 * said, so it belongs where it can be watched without scrolling away from it. It opens
 * when a turn starts and folds to a single line when the turn finishes or a question
 * needs answering first - both moments where the plan is context and something else is
 * the action. Folding rather than closing keeps the last run's plan one click away.
 */
export function PlanPanel({
  steps,
  running,
  questionsOpen,
}: {
  steps: PlanStep[];
  running: boolean;
  questionsOpen: boolean;
}) {
  const auto = running && !questionsOpen;
  // React's "adjusting state when a prop changes" pattern rather than an effect: the
  // panel follows the run on its own, and a manual fold holds until the next transition
  const [toggled, setToggled] = useState<boolean | null>(null);
  const [lastAuto, setLastAuto] = useState(auto);
  if (lastAuto !== auto) {
    setLastAuto(auto);
    setToggled(null);
  }
  const open = toggled ?? auto;

  const done = steps.filter((s) => s.status === "done").length;
  const current = steps.find((s) => s.status === "in_progress");

  return (
    <div className="mb-2 rounded-md border border-line-subtle bg-surface">
      <button
        type="button"
        onClick={() => setToggled(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-2xs text-fg-muted transition-colors hover:text-fg"
      >
        <CaretRightIcon
          className={cn("size-3 shrink-0 transition-transform", open && "rotate-90")}
        />
        <span className="stencil shrink-0">Plan</span>
        {!open && current && (
          <span className="flex min-w-0 items-center gap-1.5 text-fg-subtle">
            <span aria-hidden="true">·</span>
            {running && <Spinner className="size-3 shrink-0 text-accent-text" />}
            <span className="truncate">{current.title}</span>
          </span>
        )}
        <span className="tabular ml-auto shrink-0 font-mono text-fg-subtle">
          {done} of {steps.length} done
        </span>
      </button>

      {open && (
        <ol className="flex flex-col gap-1.5 border-t border-line-subtle px-3 py-2.5">
          {steps.map(({ title, status }) => (
            <li key={title} className="flex items-center gap-1.5 text-2xs">
              {status === "done" ? (
                <CheckIcon weight="bold" className="size-3 shrink-0 text-success" />
              ) : status === "in_progress" ? (
                <Spinner className="size-3 shrink-0 text-accent-text" />
              ) : (
                <CircleDashedIcon className="size-3 shrink-0 text-fg-subtle" />
              )}
              <span
                className={cn(
                  status === "done" && "text-fg-subtle line-through",
                  status === "in_progress" && "text-fg",
                  status === "pending" && "text-fg-muted",
                )}
              >
                {title}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
