import type { ToolCallEvent } from "../api/client";
import type { OpenQuestion } from "../api/artifacts";

/** The shared planning tool (see src/tools/planning.py) - shown as a plan, not a call. */
export const PLAN_TOOL = "track_plan";

/** Distill's voluntary question tool (see src/tools/distill.py) - shown as a question
 * card, not a call, and never as an artifact: asking never requires a StructuredSpec. */
export const QUESTIONS_TOOL = "ask_clarifying_questions";

export interface PlanStep {
  title: string;
  status: string;
}

/** A turn's tool calls with the plan and the question card taken out, so neither is also
 * listed as a generic call. */
export function withoutPlan(toolCalls: ToolCallEvent[] | undefined): ToolCallEvent[] {
  return (toolCalls ?? []).filter((tc) => tc.name !== PLAN_TOOL && tc.name !== QUESTIONS_TOOL);
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

/**
 * The questions from a turn's `ask_clarifying_questions` call, if it made one.
 *
 * Deliberately independent of the artifact: this tool exists precisely so Distill can
 * ask without first drafting a StructuredSpec, so the question card has to come from
 * the turn's own tool calls rather than from `completeness.questions` on a persisted
 * artifact - see `hasContent`/`openQuestions` in `api/artifacts.ts` for the older,
 * artifact-coupled channel this supplements for a turn that produced no draft at all.
 */
export function questionsFromToolCalls(toolCalls: ToolCallEvent[] | undefined): OpenQuestion[] {
  const call = [...(toolCalls ?? [])].reverse().find((tc) => tc.name === QUESTIONS_TOOL);
  const result = call?.result as { questions?: unknown } | undefined;
  return Array.isArray(result?.questions) ? (result.questions as OpenQuestion[]) : [];
}
