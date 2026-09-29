import type { OpenQuestion } from "../api/artifacts";

/** Picks `option`, or unpicks it; a single-select question keeps only the latest pick. */
export function toggleOption(
  picked: Map<string, string[]>,
  question: OpenQuestion,
  option: string,
): Map<string, string[]> {
  const next = new Map(picked);
  const current = next.get(question.id) ?? [];
  if (current.includes(option)) next.set(question.id, current.filter((o) => o !== option));
  else next.set(question.id, question.multi_select ? [...current, option] : [option]);
  return next;
}

/** Picked options and typed answers as one map, limited to the questions still open. A
 * typed answer counts as one more pick, so it reaches the agent paired with its question. */
export function mergeAnswers(
  questions: OpenQuestion[],
  picked: Map<string, string[]>,
  typed: Map<string, string>,
): Map<string, string[]> {
  return new Map(
    questions.map((q) => {
      const own = typed.get(q.id)?.trim();
      return [q.id, [...(picked.get(q.id) ?? []), ...(own ? [own] : [])]];
    }),
  );
}

/** Turns picked options into one message the agent reads back as answers.
 *
 * Each answer is paired with the question it answers, since the agent starts every
 * invocation from a clean slate and cannot match a bare "Snowflake" to what it asked. */
export function composeAnswers(questions: OpenQuestion[], answers: Map<string, string[]>): string {
  return questions
    .map((question) => {
      const picked = answers.get(question.id) ?? [];
      return picked.length > 0 ? `${question.question}\n${picked.join(", ")}` : null;
    })
    .filter((line): line is string => line !== null)
    .join("\n\n");
}
