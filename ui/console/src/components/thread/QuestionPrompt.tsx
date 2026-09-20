import { CheckIcon } from "@phosphor-icons/react";
import type { OpenQuestion } from "../../api/artifacts";
import { cn } from "../../lib/cn";

/**
 * The station's open questions, sat directly above the composer.
 *
 * Not in the artifact panel: that panel can be closed, which would leave a project held
 * at its station with no visible reason why. A question is an action, and it belongs
 * where the answer gets typed. Fully controlled by the composer: picking an option here
 * only stages it - the composer's own send is the one place a turn goes out, whether
 * that turn is a pick, typed text, an attachment, or all three. A second send button
 * here previously meant a pick and a typed answer went out as two separate turns. */
export function QuestionPrompt({
  questions,
  disabled,
  picked,
  onToggle,
}: {
  questions: OpenQuestion[];
  disabled: boolean;
  picked: Map<string, string[]>;
  onToggle: (question: OpenQuestion, option: string) => void;
}) {
  if (questions.length === 0) return null;

  return (
    <div className="mb-2 rounded-md border border-line bg-surface px-3.5 py-3">
      <p className="text-2xs font-semibold tracking-wide text-fg-muted uppercase">
        {questions.length === 1
          ? "One question before I draft"
          : `${questions.length} questions before I draft`}
      </p>

      <ul className="mt-2.5 flex flex-col gap-3">
        {questions.map((question) => {
          const selected = picked.get(question.id) ?? [];
          return (
            <li key={question.id}>
              <p className="text-xs leading-relaxed text-fg">{question.question}</p>
              {question.options.length > 0 && (
                <>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {question.options.map((option) => {
                      const on = selected.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={disabled}
                          aria-pressed={on}
                          onClick={() => onToggle(question, option)}
                          className={cn(
                            "flex items-center gap-1 rounded-full border px-2.5 py-1 text-2xs transition-colors disabled:opacity-50",
                            on
                              ? "border-accent bg-accent text-fg-on-accent"
                              : "border-line bg-surface text-fg-muted hover:border-accent hover:text-fg",
                          )}
                        >
                          {on && <CheckIcon weight="bold" className="size-3" />}
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  {question.multi_select && (
                    <p className="mt-1 text-2xs text-fg-subtle italic select-none">
                      Pick any that apply.
                    </p>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
