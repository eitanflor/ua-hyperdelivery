import { useEffect, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, LinkSimpleIcon } from "@phosphor-icons/react";
import type { OpenQuestion } from "../../api/artifacts";
import { cn } from "../../lib/cn";

/**
 * The station's open questions, one card at a time, sat directly above the composer.
 *
 * Not in the artifact panel: that panel can be closed, which would leave a project held
 * at its station with no visible reason why. A question is an action, and it belongs
 * where the answer gets typed. Fully controlled by the caller: picking an option or
 * typing an answer here only stages it - the caller's own send is the one place a turn
 * goes out, so every answer lands in one message rather than one per question.
 */
export function QuestionPrompt({
  asker,
  questions,
  disabled,
  picked,
  typed,
  onToggle,
  onType,
  askLink,
}: {
  asker: string;
  questions: OpenQuestion[];
  disabled: boolean;
  picked: Map<string, string[]>;
  typed: Map<string, string>;
  onToggle: (question: OpenQuestion, option: string) => void;
  onType: (question: OpenQuestion, text: string) => void;
  /** A link someone else can answer from. Absent where the reader already is that someone. */
  askLink?: string;
}) {
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);

  if (questions.length === 0) return null;
  const at = Math.min(index, questions.length - 1);
  const question = questions[at]!;
  const selected = picked.get(question.id) ?? [];
  const ownWords = typed.get(question.id) ?? "";
  const isAnswered = (q: OpenQuestion) =>
    (picked.get(q.id)?.length ?? 0) > 0 || Boolean(typed.get(q.id)?.trim());
  const answered = questions.filter(isAnswered).length;
  const last = at === questions.length - 1;

  return (
    <section
      aria-label={`${asker}'s questions`}
      className="mb-2 rounded-md border border-line bg-surface px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <p className="text-2xs font-semibold tracking-wide text-fg-muted uppercase">
          {questions.length === 1 ? `${asker} has a question` : `${asker} has ${questions.length} questions`}
        </p>
        {questions.length > 1 && (
          <div className="ml-auto flex items-center gap-2">
            <span aria-hidden="true" className="flex gap-1">
              {questions.map((q, i) => (
                <span
                  key={q.id}
                  className={cn(
                    "size-1.5 rounded-full",
                    i === at ? "bg-accent" : isAnswered(q) ? "bg-success" : "bg-line-strong",
                  )}
                />
              ))}
            </span>
            <span className="tabular text-2xs text-fg-subtle">
              {at + 1} of {questions.length}
            </span>
          </div>
        )}
      </div>

      <div key={question.id} className="animate-fade">
        <p className="mt-2 text-sm leading-relaxed text-fg">{question.question}</p>
        {question.options.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
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
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50",
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
        )}
        {question.multi_select && (
          <p className="mt-1 text-2xs text-fg-subtle italic select-none">Pick any that apply.</p>
        )}
        <label className="mt-2.5 block">
          <span className="sr-only">Answer in your own words</span>
          <input
            type="text"
            disabled={disabled}
            value={ownWords}
            placeholder={question.options.length > 0 ? "Or answer in your own words" : "Your answer"}
            onChange={(e) => onType(question, e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.nativeEvent.isComposing || last) return;
              e.preventDefault();
              setIndex(at + 1);
            }}
            className="h-8 w-full rounded-sm border border-line bg-canvas px-2.5 text-xs text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none disabled:opacity-50"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {questions.length > 1 && (
          <button
            type="button"
            disabled={at === 0}
            onClick={() => setIndex(at - 1)}
            className="flex h-7 items-center gap-1 rounded-sm px-2 text-2xs font-medium text-fg-muted transition-colors hover:bg-sunken hover:text-fg disabled:opacity-35"
          >
            <ArrowLeftIcon className="size-3" />
            Back
          </button>
        )}
        {askLink && (
          <button
            type="button"
            onClick={() =>
              void navigator.clipboard.writeText(askLink).then(
                () => setCopied(true),
                () => undefined,
              )
            }
            title="Copies a link that shows only these questions"
            className="flex h-7 items-center gap-1 rounded-sm px-2 text-2xs font-medium text-fg-muted transition-colors hover:bg-sunken hover:text-fg"
          >
            {copied ? <CheckIcon weight="bold" className="size-3" /> : <LinkSimpleIcon className="size-3" />}
            {copied ? "Link copied - send it to whoever knows" : "I don't know - ask someone"}
          </button>
        )}
        <span className="sr-only" aria-live="polite">
          {copied ? "Link copied" : ""}
        </span>
        {last ? (
          <p className="ml-auto text-2xs text-fg-subtle">
            {answered === questions.length
              ? "All answered - send when ready."
              : `${answered} of ${questions.length} answered. Send when ready; ${asker} can ask again about any you skip.`}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setIndex(at + 1)}
            className="ml-auto flex h-7 items-center gap-1 rounded-sm border border-line px-2.5 text-2xs font-medium text-fg transition-colors hover:border-line-strong hover:bg-sunken"
          >
            {isAnswered(question) ? "Next" : "Skip"}
            <ArrowRightIcon className="size-3" />
          </button>
        )}
      </div>
    </section>
  );
}
