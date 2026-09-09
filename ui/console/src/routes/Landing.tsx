import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowUpIcon, PaperclipIcon, XIcon } from "@phosphor-icons/react";
import { useProjectsStore } from "../store/useProjectsStore";
import { AGENT_META, AGENT_STATIONS, STATION_META } from "../lib/pipeline";
import { ACCEPTED_EXTENSIONS } from "../lib/attachments";
import { AgentFace } from "../components/agents/AgentFace";
import { Spinner } from "../components/ui/Spinner";

/** First run and the demo's opening frame.
 *
 * Doubles as the glossary the console never had: the four stations and the two gates
 * are explained here, in place, rather than left for the user to infer from badges. */
export function Landing() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createProjectFromMessage = useProjectsStore((s) => s.createProjectFromMessage);
  const loading = useProjectsStore((s) => s.loading);

  const send = async () => {
    const message = text.trim();
    if (!message || loading) return;
    const files = pendingFiles;
    const project = await createProjectFromMessage(message, files);
    if (useProjectsStore.getState().error) return;
    setText("");
    setPendingFiles([]);
    void navigate(`/projects/${project.id}`, { state: { justCreated: true } });
  };

  // Uploading needs the project's S3 prefix, which doesn't exist until send() creates
  // the project - so a picked file just sits here as a chip until then.
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) setPendingFiles((prev) => [...prev, file]);
  };

  const removePendingFile = (index: number) =>
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="stencil text-2xl tracking-tight text-fg">What are we building?</h1>
        <p className="mt-2 max-w-lg text-xs leading-relaxed text-fg-muted">
          Describe it in a sentence or a page. Scout writes the scouting report, and the line
          takes it from there — stopping at two gates for a person to sign.
        </p>
      </div>

      {pendingFiles.length > 0 && (
        <div className="-mt-4 flex flex-wrap gap-1.5">
          {pendingFiles.map((file, index) => (
            <span
              key={`${file.name}-${index}`}
              className="flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-1 text-2xs text-fg-subtle"
            >
              {file.name}
              <button
                type="button"
                onClick={() => removePendingFile(index)}
                aria-label={`Remove ${file.name}`}
                className="rounded-full p-0.5 hover:bg-canvas"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative rounded-md border border-line bg-surface transition-colors focus-within:border-accent">
        <label htmlFor="landing" className="sr-only">
          Describe what you want to build
        </label>
        <textarea
          id="landing"
          autoFocus
          className="w-full resize-none rounded-md bg-transparent px-4 pt-3.5 pr-12 pb-8 text-sm leading-relaxed text-fg placeholder:text-fg-subtle focus:outline-none"
          rows={4}
          placeholder="A console that lets our merchandising team draft, review and publish seasonal line plans…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.shiftKey || e.metaKey || e.ctrlKey) return;
            e.preventDefault();
            void send();
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="sr-only"
          onChange={onFileSelected}
        />
        <span className="pointer-events-none absolute bottom-3 left-4 flex items-center gap-2 text-2xs text-fg-subtle">
          {loading ? (
            <span className="flex items-center gap-1.5">
              <Spinner className="size-3" /> Naming it and starting Scout…
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach a document"
                className="pointer-events-auto rounded p-0.5 text-fg-subtle transition-colors hover:text-fg"
              >
                <PaperclipIcon className="size-3.5" />
              </button>
              <span>Enter to send, ⇧/⌘/Ctrl + Enter for a new line</span>
            </>
          )}
        </span>
        <button
          type="button"
          onClick={() => void send()}
          disabled={loading || !text.trim()}
          aria-label="Start project"
          className="absolute right-2.5 bottom-2.5 flex size-8 items-center justify-center rounded-full bg-accent text-fg-on-accent transition-all hover:bg-accent-hover active:scale-95 disabled:opacity-35"
        >
          <ArrowUpIcon weight="bold" className="size-4" />
        </button>
      </div>

      <section aria-label="How the line works">
        <h2 className="mb-3 text-2xs font-semibold tracking-wide text-fg-subtle uppercase">
          The crew
        </h2>
        <ol className="grid gap-2 sm:grid-cols-2">
          {AGENT_STATIONS.map((station) => {
            const meta = AGENT_META[STATION_META[station].agent!];
            return (
              <li
                key={station}
                className="flex gap-2.5 rounded-md border border-line-subtle bg-surface p-3"
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full ${meta.bg} ${meta.fg}`}
                >
                  <AgentFace agent={meta.face} className="size-6" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-baseline gap-2">
                    <span className="tabular font-mono text-2xs text-fg-subtle">
                      {meta.number}
                    </span>
                    <span className="stencil text-xs text-fg">{meta.name}</span>
                    <span className="text-2xs text-fg-subtle">
                      {STATION_META[station].label}
                    </span>
                  </p>
                  <p className="mt-1 text-2xs leading-relaxed text-fg-muted">{meta.role}</p>
                  <p className="mt-1.5 text-2xs text-fg-subtle">Hands over: {meta.output}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-2xs leading-relaxed text-fg-subtle">
          Two gates sit in the line — <span className="text-fg-muted">Gate 1</span> after
          Scout, <span className="text-fg-muted">Gate 2</span> after Coach. Nothing moves
          past either one until a person signs it.
        </p>
      </section>
    </div>
  );
}
