import type { OpenQuestion } from "../api/artifacts";

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
