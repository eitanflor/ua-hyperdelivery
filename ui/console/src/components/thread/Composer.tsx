import { useRef, useState } from "react";
import { ArrowUpIcon, PaperclipIcon, StopIcon, XIcon } from "@phosphor-icons/react";
import { useProjectsStore } from "../../store/useProjectsStore";
import { api, ApiError } from "../../api/client";
import type { OpenQuestion } from "../../api/artifacts";
import type { PlanStep } from "../../lib/plan";
import { AGENT_META } from "../../lib/pipeline";
import { composeAnswers, mergeAnswers, toggleOption } from "../../lib/composeAnswers";
import { Spinner } from "../ui/Spinner";
import { cn } from "../../lib/cn";
import { ACCEPTED_EXTENSIONS, withAttachments, type Attachment } from "../../lib/attachments";
import { PlanPanel } from "./PlanPanel";
import { QuestionPrompt } from "./QuestionPrompt";

/** Composer for the station currently holding the project. */
export function Composer({
  projectId,
  agent,
  questions,
  plan,
}: {
  projectId: string;
  agent: string;
  questions: OpenQuestion[];
  plan: PlanStep[] | null;
}) {
  const text = useProjectsStore((s) => s.composerDrafts[projectId] ?? "");
  const setComposerDraft = useProjectsStore((s) => s.setComposerDraft);
  const setText = (value: string) => setComposerDraft(projectId, value);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pickedAnswers, setPickedAnswers] = useState<Map<string, string[]>>(new Map());
  const [typedAnswers, setTypedAnswers] = useState<Map<string, string>>(new Map());
  // answering is what closes the card: the artifact it came from is only rewritten once
  // the station finishes, so without this the questions sit there through the whole run
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const advanceProject = useProjectsStore((s) => s.advanceProject);
  const cancelRun = useProjectsStore((s) => s.cancelRun);
  const running = useProjectsStore((s) => s.runningProjectId === projectId);
  const label = AGENT_META[agent]?.name ?? agent;

  const openQuestions = questions.filter((q) => !answeredIds.has(q.id));
  // limited to the questions still being asked, so an answer to one that has closed
  // cannot count towards `answeredCount` and enable send with nothing current selected
  const liveAnswers = mergeAnswers(openQuestions, pickedAnswers, typedAnswers);
  const answeredCount = [...liveAnswers.values()].filter((answers) => answers.length > 0).length;

  const toggleAnswer = (question: OpenQuestion, option: string) =>
    setPickedAnswers((prev) => toggleOption(prev, question, option));

  const typeAnswer = (question: OpenQuestion, answer: string) =>
    setTypedAnswers((prev) => new Map(prev).set(question.id, answer));

  const submit = async (
    message: string,
    sentAttachments: Attachment[],
    picked: Map<string, string[]>,
    typed: Map<string, string>,
  ) => {
    const closingIds = openQuestions.map((q) => q.id);
    const combined = [composeAnswers(openQuestions, mergeAnswers(openQuestions, picked, typed)), message.trim()]
      .filter(Boolean)
      .join("\n\n");
    if ((!combined && sentAttachments.length === 0) || running) return;
    setText("");
    setAttachments([]);
    setPickedAnswers(new Map());
    setTypedAnswers(new Map());
    if (closingIds.length > 0) setAnsweredIds((prev) => new Set([...prev, ...closingIds]));
    await advanceProject(projectId, agent, withAttachments(combined, sentAttachments));
    if (useProjectsStore.getState().error) {
      setText(message);
      setAttachments(sentAttachments);
      setPickedAnswers(picked);
      setTypedAnswers(typed);
      if (closingIds.length > 0) {
        setAnsweredIds((prev) => {
          const next = new Set(prev);
          for (const id of closingIds) next.delete(id);
          return next;
        });
      }
    }
  };

  const send = () => submit(text, attachments, pickedAnswers, typedAnswers);

  const pickFile = () => fileInputRef.current?.click();

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be picked again after a removal/retry
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const uploaded = await api.uploadDocument(projectId, file);
      setAttachments((prev) => [...prev, uploaded]);
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (key: string) =>
    setAttachments((prev) => prev.filter((a) => a.key !== key));

  return (
    // a fixed footer, not part of the scrolled thread - Thread.tsx renders this
    // outside the message list's own scroll region so it never moves as it streams.
    <div className="border-t border-line-subtle bg-canvas pt-3">
      {plan && (
        <PlanPanel steps={plan} running={running} questionsOpen={questions.length > 0} />
      )}
      <QuestionPrompt
        key={openQuestions.map((q) => q.id).join()}
        asker={label}
        questions={openQuestions}
        disabled={running}
        picked={pickedAnswers}
        typed={typedAnswers}
        onToggle={toggleAnswer}
        onType={typeAnswer}
        askLink={`${window.location.origin}/answer/${projectId}`}
      />
      {(attachments.length > 0 || uploading || uploadError) && (
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {attachments.map((a) => (
            <span
              key={a.key}
              className="flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-1 text-2xs text-fg-subtle"
            >
              {a.filename}
              <button
                type="button"
                onClick={() => removeAttachment(a.key)}
                aria-label={`Remove ${a.filename}`}
                className="hit-area rounded-full p-0.5 hover:bg-canvas"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
          {uploading && (
            <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-1 text-2xs text-fg-subtle">
              <Spinner className="size-3" /> Uploading…
            </span>
          )}
          {uploadError && (
            <span className="flex items-center rounded-full border border-line bg-surface px-2 py-1 text-2xs text-danger">
              {uploadError}
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "group relative rounded-md border bg-surface transition-colors",
          "border-line focus-within:border-accent",
        )}
      >
        <label htmlFor="composer" className="sr-only">
          Message {label}
        </label>
        <textarea
          id="composer"
          className="w-full resize-none rounded-md bg-transparent px-3.5 pt-3 pr-12 pb-7 text-xs leading-relaxed text-fg placeholder:text-fg-subtle focus:outline-none"
          rows={3}
          placeholder={questions.length > 0 ? `Add a note for ${label} (optional)` : `Message ${label}…`}
          value={text}
          disabled={running}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.shiftKey || e.metaKey || e.ctrlKey) return;
            if (e.nativeEvent.isComposing) return;
            e.preventDefault();
            void send();
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          // opened by the attach button; a second, unlabeled "Choose File" stop only confuses
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(e) => void onFileSelected(e)}
        />
        <div className="pointer-events-none absolute bottom-2.5 left-3.5 flex items-center gap-2 text-2xs text-fg-subtle">
          {running ? (
            <span className="flex items-center gap-1.5">
              <Spinner className="size-3" /> {label} is working…
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={pickFile}
                disabled={uploading}
                aria-label="Attach a document"
                className="hit-area pointer-events-auto rounded p-0.5 text-fg-subtle transition-colors hover:text-fg disabled:opacity-35"
              >
                <PaperclipIcon className="size-3.5" />
              </button>
              <span className="opacity-0 transition-opacity group-focus-within:opacity-100">
                Enter to send, ⇧ + Enter for a new line
              </span>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => (running ? cancelRun() : void send())}
          disabled={!running && !text.trim() && attachments.length === 0 && answeredCount === 0}
          aria-label={running ? `Stop ${label}` : `Send to ${label}`}
          className="absolute right-2 bottom-2 flex size-7 items-center justify-center rounded-full bg-accent text-fg-on-accent transition-all hover:bg-accent-hover active:scale-95 disabled:bg-sunken disabled:text-fg-subtle"
        >
          {running ? (
            <StopIcon weight="bold" className="size-3.5" />
          ) : (
            <ArrowUpIcon weight="bold" className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}
