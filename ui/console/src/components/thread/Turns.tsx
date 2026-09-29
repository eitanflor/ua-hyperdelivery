import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowSquareOutIcon, CaretRightIcon, FileTextIcon, PlayIcon, WrenchIcon, XCircleIcon } from "@phosphor-icons/react";
import type { ToolCallEvent, UsageEvent } from "../../api/client";
import type { PendingQuestion } from "../../api/types";
import { hasContent } from "../../api/artifacts";
import { AGENT_META } from "../../lib/pipeline";
import { questionsFromToolCalls, withoutPlan } from "../../lib/plan";
import { toolLabel } from "../../lib/toolLabels";
import { callSources, summarizeCalls, toolCallLabel } from "../../lib/narration";
import { formatDuration } from "../../lib/time";
import { artifactStats, composeReply } from "../../lib/formatArtifact";
import { Markdown } from "../../lib/markdown";
import { cn } from "../../lib/cn";
import type { ViewMode } from "../../store/useProjectsStore";
import { AgentFace } from "../agents/AgentFace";
import { AgentAvatar } from "./AgentAvatar";
import { ToolTile } from "./ToolTile";
import { DocumentSkeleton } from "./DocumentSkeleton";
import { ThoughtLine } from "./ThoughtLine";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { StatusMark, type Status } from "../ui/StatusMark";
import { Tooltip } from "../ui/Tooltip";

const compactTokens = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function UserTurn({ text }: { text: string }) {
  return (
    <div className="flex animate-rise justify-end">
      <div className="max-w-[80%] rounded-md rounded-br-sm bg-sunken px-3.5 py-2.5">
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-fg">{text}</p>
      </div>
    </div>
  );
}

/** What the turn cost, in the same mono register as the station number beside it.
 *
 * Accumulated across every model call the agent made, so a turn that looped through six
 * tool calls reads higher than the artifact alone would suggest - which is the point.
 * The breakdown names cached tokens separately because they are most of the total and
 * almost none of the cost: without them "8 in" against a six-figure total reads as a bug.
 * The tooltip also carries what the thread itself has no room for: how long the turn
 * took and which model produced it. */
function TokenCount({
  usage,
  durationMs,
  model,
}: {
  usage: UsageEvent;
  durationMs?: number;
  model?: string;
}) {
  const cached = usage.cache_read_tokens + usage.cache_write_tokens;
  const parts = [
    `${usage.input_tokens.toLocaleString()} in`,
    ...(cached > 0 ? [`${cached.toLocaleString()} cached`] : []),
    `${usage.output_tokens.toLocaleString()} out`,
    ...(durationMs !== undefined ? [formatDuration(durationMs)] : []),
    ...(model ? [model] : []),
  ];
  return (
    <Tooltip content={parts.join(" · ")}>
      <span className="tabular cursor-default font-mono text-2xs text-fg-subtle">
        {compactTokens.format(usage.total_tokens)} tok
      </span>
    </Tooltip>
  );
}

function Attribution({
  agent,
  state,
  usage,
  durationMs,
  note,
}: {
  agent: string;
  state?: "idle" | "working" | "done";
  usage?: UsageEvent;
  durationMs?: number;
  /** Simple mode's plain summary in place of the token count. */
  note?: string;
}) {
  const meta = AGENT_META[agent];
  return (
    <div className="mb-1 flex items-center gap-2">
      <AgentAvatar agent={agent} state={state} />
      <span className="stencil text-2xs text-fg-muted">{meta?.name ?? agent}</span>
      {meta && <span className="tabular font-mono text-2xs text-fg-subtle">{meta.number}</span>}
      {usage && <TokenCount usage={usage} durationMs={durationMs} model={meta?.model} />}
      {note && <span className="tabular text-2xs text-fg-subtle">{note}</span>}
    </div>
  );
}

/** The station's output as something you can look at and click, rather than a link
 * buried under the reply - the document is the point of the turn. */
function ArtifactCard({
  agent,
  content,
  onOpen,
}: {
  agent: string;
  content: Record<string, unknown>;
  onOpen: () => void;
}) {
  const meta = AGENT_META[agent];
  const stats = artifactStats(content);
  const title = typeof content.title === "string" ? content.title : (meta?.output ?? agent);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative mt-2.5 mb-2 block w-full rounded-md text-left"
    >
      {/* two sheets under the card that fan out on hover: it is a document, with pages, and
          lifting is the one place the design lets depth show */}
      <span
        aria-hidden="true"
        className="absolute inset-x-3 inset-y-0 translate-y-1.5 rounded-md border border-line-subtle bg-sunken transition-transform duration-200 ease-out group-hover:translate-y-2.5 group-focus-visible:translate-y-2.5"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-1.5 inset-y-0 translate-y-[3px] rounded-md border border-line-subtle bg-surface transition-transform duration-200 ease-out group-hover:translate-y-[5px] group-focus-visible:translate-y-[5px]"
      />
      <span className="relative flex w-full items-center gap-3 rounded-md border border-line-subtle bg-surface px-3 py-2.5 transition-[translate,border-color,box-shadow] duration-200 ease-out group-hover:-translate-y-px group-hover:border-line group-hover:shadow-raised group-focus-visible:-translate-y-px">
        <FileTextIcon className={cn("size-5 shrink-0", meta?.fg ?? "text-fg-subtle")} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-fg">{title}</span>
          <span className="mt-0.5 block text-2xs text-fg-subtle">
            {meta?.output ?? "Output"}
            {stats.length > 0 && " · "}
            {stats.map((s) => `${s.value} ${s.label}`).join(" · ")}
          </span>
        </span>
        <ArrowSquareOutIcon className="size-3.5 shrink-0 text-fg-subtle" />
      </span>
    </button>
  );
}

/** A finished trace collapsed to one line of chips - how many calls, and what most of them
 * did - with the full trace a click away (Beautiful UI Tool Chips). The trace explains how
 * the agent got there; most readers only want to know that it looked. */
function ToolChips({ calls }: { calls: ToolCallEvent[] }) {
  const [open, setOpen] = useState(false);
  const top = summarizeCalls(calls).slice(0, 3);
  const failed = calls.filter((call) => call.status === "failed").length;
  return (
    <div className="mb-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="group flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-2xs font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
        >
          <WrenchIcon className="size-3" />
          <span className="tabular">{calls.length}</span> tool call{calls.length === 1 ? "" : "s"}
          <TraceCaret expanded={open} />
        </button>
        {!open &&
          top.map(({ label, count }) => (
            <span
              key={label}
              className="rounded-full bg-sunken px-2 py-0.5 text-2xs text-fg-subtle"
            >
              {label}
              {count > 1 && <span className="tabular"> ×{count}</span>}
            </span>
          ))}
        {/* a failure is the one thing in a collapsed trace worth seeing without opening it */}
        {failed > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-2xs text-danger">
            <XCircleIcon weight="fill" className="size-3" />
            <span className="tabular">{failed}</span> failed
          </span>
        )}
      </div>
      {open && (
        <TraceList className="mt-2 animate-fade">
          {groupToolCalls(calls).map((group) => (
            <ToolCallGroup key={group[0]?.id} calls={group} />
          ))}
        </TraceList>
      )}
    </div>
  );
}

/** The documents a reply rests on, named - so a reader can see what was actually read
 * without opening the trace (Beautiful UI Streaming Text sources). */
function SourceChips({ calls }: { calls: ToolCallEvent[] }) {
  const sources = callSources(calls);
  if (sources.length === 0) return null;
  const shown = sources.slice(0, 4);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-2xs text-fg-subtle">Read</span>
      {shown.map((name) => (
        <span
          key={name}
          title={name}
          className="flex max-w-56 items-center gap-1 rounded-full border border-line-subtle bg-surface px-2 py-0.5 text-2xs text-fg-muted"
        >
          <FileTextIcon className="size-3 shrink-0" />
          <span className="truncate">{name}</span>
        </span>
      ))}
      {sources.length > shown.length && (
        <span className="tabular text-2xs text-fg-subtle">+{sources.length - shown.length} more</span>
      )}
    </div>
  );
}

export function AgentTurn({
  agent,
  content,
  text,
  toolCalls,
  usage,
  durationMs,
  error,
  viewMode = "developer",
  onViewArtifact,
}: {
  agent: string;
  content: Record<string, unknown>;
  text?: string;
  toolCalls?: ToolCallEvent[];
  usage?: UsageEvent;
  durationMs?: number;
  /** Why the turn stopped, for a run that failed rather than finished. */
  error?: string;
  viewMode?: ViewMode;
  onViewArtifact: (agent: string) => void;
}) {
  // a finished turn has nothing left running, so a chip still in that state (an older
  // transcript, a stream cut mid-call) would spin forever - nothing will ever update it
  const toolRows = withoutPlan(toolCalls).map((call) =>
    call.status === "running" ? { ...call, status: "interrupted" as const } : call,
  );
  const askedViaTool = questionsFromToolCalls(toolCalls).length;
  const isPm = viewMode === "pm";
  const stepCount = groupToolCalls(toolRows).length;
  const failedCount = toolRows.filter((call) => call.status === "failed").length;
  const note = isPm
    ? [
        ...(durationMs !== undefined ? [`finished in ${formatDuration(durationMs)}`] : []),
        ...(stepCount > 0 ? [`${stepCount} step${stepCount === 1 ? "" : "s"}`] : []),
        ...(failedCount > 0 ? [`${failedCount} failed`] : []),
      ].join(" · ")
    : undefined;
  return (
    <div className="animate-rise">
      <Attribution
        agent={agent}
        usage={isPm ? undefined : usage}
        durationMs={durationMs}
        note={note}
      />
      <div className="pl-9">
        {/* the tool-call trace is how the agent got there, not what it found - a PM
            reading for the outcome does not need every lookup it took along the way */}
        {!isPm && toolRows.length > 0 && <ToolChips calls={toolRows} />}
        <div className="text-sm leading-relaxed text-fg">
          {/* what the agent actually said, in the position and voice it streamed in - the
              summary below is derived from the artifact and cannot mention what the agent
              could not do (a table it had no access to, a source it fell back from) */}
          {!isPm && text?.trim() && <Markdown text={text} />}
          {/* when the agent has already said it, the generic "before I draft anything..." line
              only repeats it - it is for a turn that said nothing, or one read in Simple mode */}
          {(isPm || !text?.trim() || hasContent(content)) && !error && (
            <Markdown text={composeReply(content, askedViaTool)} />
          )}
          {error && <p className="text-danger">This run did not finish: {error}</p>}
        </div>
        <SourceChips calls={toolRows} />
        {hasContent(content) && (
          <ArtifactCard agent={agent} content={content} onOpen={() => onViewArtifact(agent)} />
        )}
      </div>
    </div>
  );
}

/** A question the crew parked on the server, for a reader whose browser never saw the
 * turn that asked it - an approver, a subject expert, the requester on another machine.
 * The exchange so far is one collapsed block, not a replayed chat: the server keeps it as
 * a single transcript, not as separate messages. */
export function ParkedTurn({ agent, pending }: { agent: string; pending: PendingQuestion }) {
  const name = AGENT_META[agent]?.name ?? "The crew";
  const asked = pending.questions?.length ?? 0;
  const said =
    pending.status === "chat" && pending.message?.trim()
      ? pending.message
      : composeReply({ completeness: { questions: pending.questions ?? [] } }, asked);
  return (
    <div className="animate-rise">
      <Attribution agent={agent} />
      <div className="pl-9">
        {pending.prior_message?.trim() && (
          <details className="group mb-2 rounded-sm border border-line-subtle bg-surface">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1.5 text-2xs text-fg-muted hover:text-fg">
              <CaretRightIcon className="size-3 transition-transform group-open:rotate-90" />
              What {name} is working from
            </summary>
            <p className="max-h-64 overflow-y-auto border-t border-line-subtle px-2.5 py-2 text-xs leading-relaxed whitespace-pre-wrap text-fg-muted">
              {pending.prior_message.trim()}
            </p>
          </details>
        )}
        <div className="text-sm leading-relaxed text-fg">
          <Markdown text={said} />
        </div>
      </div>
    </div>
  );
}

// long enough that the pause between a gate committing and the next run starting never shows it
const IDLE_MS = 20_000;

/** A stage that should be working and is not - a run that died with the dev server, or one
 * started in a tab that has since closed. Only offered for a local run: a deployed stage is
 * started by the state machine, and the console has no way to restart it. */
export function IdleStage({ agent, since, onStart }: { agent: string; since: string; onStart: () => void }) {
  const meta = AGENT_META[agent];
  const [due, setDue] = useState(() => Date.now() - Date.parse(since) >= IDLE_MS);
  useEffect(() => {
    if (due) return;
    const timer = setTimeout(() => setDue(true), IDLE_MS - (Date.now() - Date.parse(since)));
    return () => clearTimeout(timer);
  }, [due, since]);
  if (!due || !meta) return null;
  return (
    <div role="status" className="flex animate-rise items-center gap-3 rounded-md border border-line bg-surface px-3.5 py-2.5">
      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", meta.bg, meta.fg)}>
        <AgentFace agent={meta.face} className="size-4.5" />
      </span>
      <p className="flex-1 text-xs leading-relaxed text-fg-muted">
        <span className="font-medium text-fg">{meta.name} has not started.</span> The run may have
        stopped with the server, or started in a tab that is closed now.
      </p>
      <Button variant="secondary" size="sm" icon={<PlayIcon weight="fill" className="size-3.5" />} onClick={onStart}>
        Start {meta.name}
      </Button>
    </div>
  );
}

export function StreamingTurn({
  agent,
  text,
  draft,
  startedAt,
  toolCalls,
  viewMode = "developer",
  onStop,
}: {
  agent: string;
  text: string;
  draft?: string;
  startedAt: string;
  toolCalls: ToolCallEvent[];
  viewMode?: ViewMode;
  onStop?: () => void;
}) {
  const toolRows = withoutPlan(toolCalls);
  const isPm = viewMode === "pm";
  return (
    <div className="animate-rise">
      <Attribution agent={agent} state="working" />
      <div className="pl-9">
        {toolRows.length > 0 &&
          (isPm ? (
            <PlainSteps calls={toolRows} />
          ) : (
            <TraceList className="mb-2">
              {groupToolCalls(toolRows).map((group) => (
                <ToolCallGroup key={group[0]?.id} calls={group} />
              ))}
            </TraceList>
          ))}
        {/* the only live region for the reply itself: without it the stream is silent
            to a screen reader, which is the one thing here that changes with no user
            action. The working line below announces activity separately. */}
        {text && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="false"
            className="text-sm leading-relaxed text-fg"
          >
            <Markdown text={text} />
            {!draft && (
              <span className="ml-0.5 inline-block h-3.5 w-px animate-caret bg-accent align-middle" />
            )}
          </div>
        )}
        {draft &&
          (isPm ? (
            <DocumentSkeleton agent={agent} draft={draft} />
          ) : (
            <DraftStream agent={agent} draft={draft} />
          ))}
        <ThoughtLine
          agent={agent}
          startedAt={startedAt}
          toolCalls={toolRows}
          draft={draft}
          onStop={onStop}
        />
      </div>
    </div>
  );
}

/** The artifact as the agent writes it.
 *
 * Raw tool input rather than prose - the station's output is produced as one forced tool
 * call (see agent_runtime/factory.py), so this JSON *is* the generation. Shown so a long
 * run reads as work in progress instead of a stalled spinner; the readable version is the
 * artifact card that replaces it. Hidden from assistive tech: the live region above
 * already announces the turn, and reading JSON aloud helps nobody. */
function DraftStream({ agent, draft }: { agent: string; draft: string }) {
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [draft]);

  return (
    <div aria-hidden="true" className="mt-2 overflow-hidden rounded-sm border border-line/60">
      <div className="flex items-center gap-1.5 border-b border-line/60 bg-sunken/60 px-2 py-1">
        <Spinner className="size-3 shrink-0 text-accent-text" />
        <span className="text-2xs text-fg-muted">
          Writing the {(AGENT_META[agent]?.output ?? "output").toLowerCase()}
        </span>
      </div>
      <pre
        ref={ref}
        className="max-h-36 overflow-hidden font-mono text-2xs leading-relaxed whitespace-pre-wrap text-fg-subtle px-2 py-1.5"
      >
        {draft}
      </pre>
    </div>
  );
}

const PLAIN_STEP_LIMIT = 5;

/** Simple mode's version of the trace: what the agent is doing, in words, without the
 * arguments and raw results a developer reads. Only the latest steps - the point is to
 * show it is moving, not to audit it. */
function PlainSteps({ calls }: { calls: ToolCallEvent[] }) {
  const groups = groupToolCalls(calls);
  const hidden = Math.max(0, groups.length - PLAIN_STEP_LIMIT);
  return (
    <ul className="mb-2 flex flex-col gap-1">
      {hidden > 0 && (
        <li className="pl-5.5 text-2xs text-fg-subtle">
          {hidden} earlier step{hidden === 1 ? "" : "s"}
        </li>
      )}
      {groups.slice(hidden).map((group) => {
        const first = group[0];
        if (!first) return null;
        const status: Status = group.some((c) => c.status === "running")
          ? "running"
          : group.some((c) => c.status === "failed")
            ? "failed"
            : group.every((c) => c.status === "interrupted")
              ? "stopped"
              : "done";
        return (
          <li key={first.id} className="flex items-center gap-2 text-xs text-fg-muted">
            <StatusMark status={status} />
            <span>{toolLabel(first.name)}</span>
            {group.length > 1 && (
              <span className="tabular text-fg-subtle">×{group.length}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** The disclosure caret shared by the trace rows: absent until the row is hovered or
 * open, so a column of them reads as a list rather than a stack of controls. */
function TraceCaret({ expanded }: { expanded: boolean }) {
  return (
    <CaretRightIcon
      className={cn(
        "size-2.5 shrink-0 opacity-0 transition-all group-hover:opacity-100",
        expanded && "rotate-90 opacity-100",
      )}
    />
  );
}

/** Consecutive calls to the same tool, so an eighteen-file fan-out reads as one step.
 *
 * Only consecutive runs collapse: a tool the agent comes back to later in the turn is a
 * separate decision and deserves its own row. */
function groupToolCalls(toolCalls: ToolCallEvent[]): ToolCallEvent[][] {
  return toolCalls.reduce<ToolCallEvent[][]>((groups, call) => {
    const last = groups.at(-1);
    if (last?.[0]?.name === call.name) last.push(call);
    else groups.push([call]);
    return groups;
  }, []);
}

/** The trace as a quiet column under the thread's own left rule, not a box - it is how the
 * agent got there, so it should recede behind the reply. */
function TraceList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col border-l border-line-subtle pl-3", className)}>{children}</div>
  );
}

/** A fan-out as a single counted row, expanding to the individual calls. */
function ToolCallGroup({ calls }: { calls: ToolCallEvent[] }) {
  const [expanded, setExpanded] = useState(false);
  const [first, ...rest] = calls;

  if (!first) return null;
  if (rest.length === 0) return <ToolCallRow toolCall={first} />;

  const running = calls.some((call) => call.status === "running");
  const failed = calls.filter((call) => call.status === "failed").length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        disabled={running}
        aria-expanded={expanded}
        className={cn(
          "group flex w-full items-center gap-2 py-0.5 text-left text-2xs transition-colors",
          running ? "text-fg-subtle" : "text-fg-muted hover:text-fg",
        )}
      >
        <ToolTile name={first.name} failed={failed === calls.length} running={running} />
        <span className="shrink-0">{toolLabel(first.name)}</span>
        <span className="tabular shrink-0 font-mono text-fg-subtle">×{calls.length}</span>
        {failed > 0 && <span className="shrink-0 text-danger">{failed} failed</span>}
        {!running && <TraceCaret expanded={expanded} />}
      </button>
      {expanded && (
        <div className="flex flex-col pl-5.5">
          {calls.map((call) => (
            <ToolCallRow key={call.id} toolCall={call} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Render a compact, expandable tool call row. */
function ToolCallRow({ toolCall }: { toolCall: ToolCallEvent }) {
  const [manual, setManual] = useState<boolean | null>(null);
  const running = toolCall.status === "running";
  const interrupted = toolCall.status === "interrupted";
  const failed = toolCall.status === "failed";
  const label = toolCallLabel(toolCall.input);

  // a result that arrives while the call is still running opens it once; after that the
  // reader's own toggle wins. Set during render rather than in an effect: it is derived state.
  const [autoOpened, setAutoOpened] = useState(false);
  if (running && toolCall.result !== undefined && !autoOpened) setAutoOpened(true);
  // a failure opens on its own: its result is the reason, which is the whole point of the row
  const expanded = manual ?? (autoOpened || failed);

  return (
    <div>
      <button
        type="button"
        onClick={() => setManual(!expanded)}
        disabled={running}
        aria-expanded={expanded}
        className={cn(
          "group flex w-full items-center gap-2 py-0.5 text-left text-2xs transition-colors",
          running ? "text-fg-subtle" : "text-fg-muted hover:text-fg",
        )}
      >
        <ToolTile name={toolCall.name} failed={failed} running={running} />
        <span className="shrink-0">{toolLabel(toolCall.name)}</span>
        {label && <span className="min-w-0 truncate font-mono text-fg-subtle">{label}</span>}
        {failed && <span className="shrink-0 text-danger">failed</span>}
        {interrupted && <span className="shrink-0 text-fg-subtle">no result</span>}
        {!running && !failed && <TraceCaret expanded={expanded} />}
      </button>
      {expanded && (
        <div className="my-1 pl-5.5">
          <ToolCallResult result={toolCall.result} />
        </div>
      )}
    </div>
  );
}

/** A tool's raw result, in whichever form actually reads: several tools (document
 * ingestion, Snowflake queries) return a long markdown/plain-text string, and
 * `JSON.stringify`-ing that turns every newline into a literal `\n`, producing one
 * unreadable line instead of the document it is. Structured results (the common case -
 * most tools return a dict) have no such text to preserve, so JSON stays JSON for them. */
function ToolCallResult({ result }: { result?: unknown }) {
  if (typeof result === "string") {
    return result.trim() ? (
      <div className="mt-1 max-h-64 overflow-y-auto rounded-sm bg-sunken p-2 text-2xs">
        <Markdown text={result} />
      </div>
    ) : (
      <p className="mt-1 font-mono text-2xs text-fg-subtle">(empty)</p>
    );
  }
  return (
    <pre className="mt-1 max-h-64 overflow-auto rounded-sm bg-sunken p-2 font-mono text-2xs text-fg-subtle">
      {JSON.stringify(result ?? null, null, 2)}
    </pre>
  );
}
