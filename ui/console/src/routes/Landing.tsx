import { useRef, useState, type DragEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { UploadSimpleIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import { useProjectsStore } from "../store/useProjectsStore";
import { AGENT_META, AGENT_STATIONS, STATION_META } from "../lib/pipeline";
import { ACCEPTED_EXTENSIONS } from "../lib/attachments";
import { STARTERS, starterById, type Starter } from "../lib/starters";
import { cn } from "../lib/cn";
import { AgentFace } from "../components/agents/AgentFace";
import { Artwork } from "../components/art/Artwork";
import { Button } from "../components/ui/Button";
import { TextArea } from "../components/ui/Field";

type Mode = "guided" | "free";

/** The plan's structured intake (docs/hyperdelivery-plan.md): scope, who it is for, the
 * data involved, and what success looks like. Only the problem is required - Scout asks
 * about the rest if it is missing. */
const FIELDS = [
  { key: "problem", label: "What problem should this solve?", brief: "Problem", hint: "Required. A sentence or two is enough." },
  { key: "users", label: "Who will use it?", brief: "Who will use it", hint: "Teams or roles, and how often." },
  { key: "data", label: "What data or systems are involved?", brief: "Data and systems", hint: "Name them if you know. Scout asks if you don't." },
  { key: "success", label: "How will you know it worked?", brief: "Success looks like", hint: "What changes for the people using it." },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

const EMPTY_FIELDS: Record<FieldKey, string> = { problem: "", users: "", data: "", success: "" };
const ACCEPTED = new Set(ACCEPTED_EXTENSIONS.split(","));
const ACCEPTED_LABEL = "PDF, Word, PowerPoint, Excel, text or images";

function composeBrief(starter: Starter | undefined, fields: Record<FieldKey, string>): string {
  const lines = FIELDS.map(({ key, brief }) => fields[key].trim() && `${brief}: ${fields[key].trim()}`)
    .filter(Boolean)
    .join("\n");
  return [starter?.lead, lines].filter(Boolean).join("\n\n");
}

function isAccepted(file: File): boolean {
  const dot = file.name.lastIndexOf(".");
  return dot >= 0 && ACCEPTED.has(file.name.slice(dot).toLowerCase());
}

/** Start a project: pick the closest starting point, describe it guided or in your own
 * words, drop in any documents. Also the demo's opening frame, so the crew is introduced
 * here too. */
export function Landing() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const starter = starterById(params.get("starter"));
  const examples = (starter ?? STARTERS[0]!).examples;

  const [mode, setMode] = useState<Mode>("guided");
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [problemError, setProblemError] = useState<string>();
  const [warnedNoFile, setWarnedNoFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createProjectFromMessage = useProjectsStore((s) => s.createProjectFromMessage);
  const loading = useProjectsStore((s) => s.loading);

  const written = mode === "guided" ? Object.values(fields).join(" ") : text;
  const hasContent = mode === "guided" ? fields.problem.trim().length > 0 : text.trim().length > 0;
  // detail.design interactivity-27: "I've attached" with nothing attached is caught here,
  // not after Scout has already started without it.
  const missingFile =
    files.length === 0 && (starter?.id === "fsd" || /\battached\b|\battachments?\b/i.test(written));

  const addFiles = (list: FileList | null) => {
    const incoming = list ? [...list] : [];
    setFiles((prev) => [...prev, ...incoming.filter(isAccepted)]);
    setSkipped(incoming.filter((file) => !isAccepted(file)).map((file) => file.name));
    setWarnedNoFile(false);
  };

  const switchMode = (next: Mode) => {
    if (next === "free" && !text.trim()) setText(composeBrief(starter, fields));
    setMode(next);
  };

  const send = async () => {
    if (loading) return;
    if (!hasContent) {
      if (mode === "guided") {
        setProblemError("Describe the problem in a sentence or two so Scout knows where to start.");
      }
      // the first field is the one that is missing, in either mode
      requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>("main textarea")?.focus());
      return;
    }
    if (missingFile && !warnedNoFile) {
      setWarnedNoFile(true);
      return;
    }
    const message = mode === "guided" ? composeBrief(starter, fields) : text.trim();
    const project = await createProjectFromMessage(message, files);
    if (useProjectsStore.getState().error) return;
    void navigate(`/projects/${project.id}`, { state: { justCreated: true } });
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <h1 className="stencil text-2xl tracking-tight text-fg">What are we building?</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fg-muted">
          Scout turns what you write here into a requirements brief, and the line takes it from
          there - stopping at three gates for a person to approve.
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-5">
            <div
              role="radiogroup"
              aria-label="Starting point"
              className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
            >
              {STARTERS.map((option) => {
                const selected = option.id === starter?.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setParams({ starter: option.id }, { replace: true })}
                    className={cn(
                      "flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors",
                      selected
                        ? "border-fg-muted bg-sunken"
                        : "border-line-subtle bg-surface hover:border-line-strong",
                    )}
                  >
                    <option.icon
                      weight="duotone"
                      className={cn(
                        "mt-0.5 size-5 shrink-0",
                        selected ? "text-fg" : "text-fg-muted",
                      )}
                    />
                    <span>
                      <span className="block text-sm text-fg">{option.label}</span>
                      <span className="mt-0.5 block text-xs text-fg-muted">
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              role="radiogroup"
              aria-label="How to describe it"
              className="flex w-fit items-center rounded-sm border border-line p-0.5"
            >
              {(
                [
                  ["guided", "Guided"],
                  ["free", "In my own words"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={mode === value}
                  onClick={() => switchMode(value)}
                  className={cn(
                    "rounded-[3px] px-2.5 py-1 text-xs font-medium transition-colors",
                    mode === value ? "bg-sunken text-fg" : "text-fg-subtle hover:text-fg-muted",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "guided" ? (
              <div className="grid gap-4 md:grid-cols-2">
                {FIELDS.map((field) => (
                  <div
                    key={field.key}
                    className={field.key === "problem" || field.key === "success" ? "md:col-span-2" : ""}
                  >
                    <TextArea
                      label={field.label}
                      hint={field.hint}
                      error={field.key === "problem" ? problemError : undefined}
                      rows={field.key === "problem" ? 3 : 2}
                      autoFocus={field.key === "problem"}
                      placeholder={`e.g. ${examples[field.key]}`}
                      value={fields[field.key]}
                      onChange={(e) => {
                        setFields((prev) => ({ ...prev, [field.key]: e.target.value }));
                        if (field.key === "problem") setProblemError(undefined);
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-line bg-surface transition-colors focus-within:border-accent">
                <label htmlFor="landing" className="sr-only">
                  Describe what you want to build
                </label>
                <textarea
                  id="landing"
                  autoFocus
                  className="w-full resize-none rounded-md bg-transparent px-4 pt-3.5 pb-2 text-sm leading-relaxed text-fg placeholder:text-fg-subtle focus:outline-none"
                  rows={9}
                  placeholder={`e.g. ${examples.problem}`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" || e.shiftKey || e.metaKey || e.ctrlKey) return;
                    if (e.nativeEvent.isComposing) return;
                    e.preventDefault();
                    void send();
                  }}
                />
                <p className="px-4 pb-3 text-2xs text-fg-subtle">
                  Enter to send, Shift + Enter for a new line
                </p>
              </div>
            )}
          </div>

          <aside aria-label="Documents and start" className="flex flex-col gap-4 lg:sticky lg:top-0 lg:self-start">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={onDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md border border-dashed px-4 py-6 text-center transition-colors",
                dragging ? "border-accent bg-accent-bg" : "border-line-strong bg-surface",
              )}
            >
              <UploadSimpleIcon className="size-5 text-fg-subtle" />
              <p className="text-sm text-fg">
                Drop documents here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-accent-text underline-offset-2 hover:underline"
                >
                  browse
                </button>
              </p>
              <p className="text-2xs text-fg-subtle">{ACCEPTED_LABEL}. Scout reads them first.</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_EXTENSIONS}
                // opened by the drop zone's browse button
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {files.length > 0 && (
              <ul aria-label="Attached documents" className="-mt-1 flex flex-wrap gap-1.5">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex max-w-full items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-fg-muted"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                      aria-label={`Remove ${file.name}`}
                      className="hit-area shrink-0 rounded-full p-0.5 hover:bg-canvas"
                    >
                      <XIcon className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {skipped.length > 0 && (
              <p className="-mt-1 text-xs text-warning">
                Skipped {skipped.join(", ")} - Scout can read {ACCEPTED_LABEL}.
              </p>
            )}

            {warnedNoFile && missingFile && (
              <p
                role="alert"
                className="flex gap-2 rounded-sm border border-warning/25 bg-warning-bg px-3 py-2 text-xs leading-relaxed text-warning"
              >
                <WarningIcon weight="fill" className="mt-0.5 size-3.5 shrink-0" />
                Nothing is attached yet. Drop the document above, or start anyway and Scout will
                work from your description.
              </p>
            )}

            <Button
              variant="primary"
              size="lg"
              loading={loading}
              onClick={() => void send()}
              className="w-full"
            >
              {warnedNoFile && missingFile ? "Start anyway" : "Start the project"}
            </Button>
            <p className="-mt-2 text-center text-xs text-fg-subtle" aria-live="polite">
              {loading ? "Naming it and starting Scout…" : "Scout asks about anything missing."}
            </p>

            <section
              aria-labelledby="next-heading"
              className="rounded-md border border-line-subtle bg-surface p-4"
            >
              <Artwork id="a4-brief" className="mb-3 block h-auto w-full" />
              <h2
                id="next-heading"
                className="mb-3 text-2xs font-semibold tracking-wide text-fg-subtle uppercase"
              >
                What happens next
              </h2>
              <ol className="flex flex-col gap-2.5">
                {AGENT_STATIONS.map((station, index) => {
                  const meta = AGENT_META[STATION_META[station].agent!]!;
                  return (
                    <li key={station} className="flex items-start gap-2.5 text-xs text-fg-muted">
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full",
                          meta.bg,
                          meta.fg,
                        )}
                      >
                        <AgentFace agent={meta.face} className="size-4" />
                      </span>
                      <span className="leading-relaxed">
                        <span className="font-medium text-fg">{meta.name}</span> writes the{" "}
                        {meta.output.toLowerCase()}
                        {index < AGENT_STATIONS.length - 1 && ", then you approve it"}.
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
