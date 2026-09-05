import type { ToolCallEvent } from "../api/client";

/** The shared planning tool (see src/tools/planning.py) - shown as a plan, not a call. */
export const PLAN_TOOL = "track_plan";

export interface PlanStep {
  title: string;
  status: string;
}

/** A turn's tool calls with the plan taken out, so it is not also listed as a call. */
export function withoutPlan(toolCalls: ToolCallEvent[] | undefined): ToolCallEvent[] {
  return (toolCalls ?? []).filter((tc) => tc.name !== PLAN_TOOL);
}

/** The `{title: status}` mapping out of one `track_plan` result, or `null` if it has none. */
function planEntries(result: unknown): [string, string][] | null {
  const steps = (result as { steps?: unknown } | undefined)?.steps;
  if (!steps || typeof steps !== "object" || Array.isArray(steps)) return null;
  const entries = Object.entries(steps).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  return entries.length > 0 ? entries : null;
}

/**
 * The current plan for a turn, or `null` if the agent never stated one.
 *
 * `track_plan` is called again after each step, so only the newest call counts - every
 * earlier one is a superseded snapshot of the same plan. Newest *with a result*, though:
 * an update announces itself as a running call carrying nothing, and reading that one
 * would blank the panel every time the plan advanced.
 *
 * `settled` closes out whatever is left open. The agent's final step is writing the
 * artifact itself, so there is no turn left in which to report that step done, and the
 * plan would otherwise sit forever one step short of finished on a run that succeeded.
 */
export function planSteps(
  toolCalls: ToolCallEvent[] | undefined,
  settled = false,
): PlanStep[] | null {
  const plans = (toolCalls ?? []).filter((tc) => tc.name === PLAN_TOOL);
  for (const call of [...plans].reverse()) {
    const entries = planEntries(call.result);
    if (entries) {
      return entries.map(([title, status]) => ({ title, status: settled ? "done" : status }));
    }
  }
  return null;
}
