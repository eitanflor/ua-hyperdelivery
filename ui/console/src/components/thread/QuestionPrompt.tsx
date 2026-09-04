import { useState } from "react";
import { CheckIcon } from "@phosphor-icons/react";
import type { OpenQuestion } from "../../api/artifacts";
import { composeAnswers } from "../../lib/composeAnswers";
import { cn } from "../../lib/cn";

/**
 * The station's open questions, sat directly above the composer.
 *
 * Not in the artifact panel: that panel can be closed, which would leave a project held
 * at its station with no visible reason why. A question is an action, and it belongs
 * where the answer gets typed.
 */
export function QuestionPrompt({
  questions,
  disabled,
  onAnswer,
}: {
  questions: OpenQuestion[];
  disabled: boolean;
  onAnswer: (message: string) => void;
}) {
  const [answers, setAnswers] = useState<Map<string, string[]>>(new Map());
  // answering is what closes the card: the artifact it came from is only rewritten once
  // the station finishes, so without this the questions sit there through the whole run
  const [sent, setSent] = useState<Set<string>>(new Set());

  const open = questions.filter((q) => !sent.has(q.id));
  // picks made against a question that is no longer being asked would otherwise still
  // count towards `answered`, enabling Send with nothing selected on the new set
  const live = new Map([...answers].filter(([id]) => open.some((q) => q.id === id)));
  if (open.length === 0) return null;

  const toggle = (question: OpenQuestion, option: string) => {
    setAnswers((prev) => {
      const next = new Map(prev);
      const picked = next.get(question.id) ?? [];
      if (picked.includes(option)) {
        next.set(
          question.id,
          picked.filter((o) => o !== option),
        );
      } else {
        next.set(question.id, question.multi_select ? [...picked, option] : [option]);
      }
      return next;
    });
  };

  const answered = [...live.values()].filter((picked) => picked.length > 0).length;
  const freeTextOnly = open.every((q) => q.options.length === 0);

  return (
    <div className="mb-2 rounded-md border border-line bg-surface px-3.5 py-3">
      <p className="text-2xs font-semibold tracking-wide text-fg-muted uppercase">
        {open.length === 1 ? "One question before I draft" : `${open.length} questions before I draft`}
      </p>

      <ul className="mt-2.5 flex flex-col gap-3">
        {open.map((question) => {
          const picked = live.get(question.id) ?? [];
          return (
            <li key={question.id}>
              <p className="text-xs leading-relaxed text-fg">{question.question}</p>
              {question.options.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {question.options.map((option) => {
                    const on = picked.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={disabled}
                        aria-pressed={on}
                        onClick={() => toggle(question, option)}
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
                  {question.multi_select && (
                    <span className="self-center text-2xs text-fg-subtle">pick any that apply</span>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-2xs text-fg-subtle">Answer in the box below.</p>
              )}
            </li>
          );
        })}
      </ul>

      {!freeTextOnly && (
        <button
          type="button"
          disabled={disabled || answered === 0}
          onClick={() => {
            onAnswer(composeAnswers(open, live));
            setSent((prev) => new Set([...prev, ...open.map((q) => q.id)]));
            setAnswers(new Map());
          }}
          className="mt-3 rounded-sm bg-accent px-2.5 py-1.5 text-2xs font-medium text-fg-on-accent transition-colors hover:bg-accent-hover disabled:opacity-35"
        >
          Send {answered === open.length ? "answers" : `${answered} of ${open.length}`}
        </button>
      )}
    </div>
  );
}
