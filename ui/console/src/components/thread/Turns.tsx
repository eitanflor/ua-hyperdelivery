import { useEffect, useRef, useState } from "react";
import { ArrowSquareOutIcon, CaretRightIcon, FileTextIcon } from "@phosphor-icons/react";
import type { ToolCallEvent, UsageEvent } from "../../api/client";
import { hasContent } from "../../api/artifacts";
import { AGENT_META } from "../../lib/pipeline";
import { questionsFromToolCalls, withoutPlan } from "../../lib/plan";
import { toolLabel } from "../../lib/toolLabels";
import { artifactStats, composeReply } from "../../lib/formatArtifact";
import { Markdown } from "../../lib/markdown";
import { cn } from "../../lib/cn";
import type { ViewMode } from "../../store/useProjectsStore";
import { AgentAvatar } from "./AgentAvatar";
import { Spinner } from "../ui/Spinner";
import { Tooltip } from "../ui/Tooltip";

const compactTokens = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function UserTurn({ text }: { text: string }) {
  return (
    <div className="flex animate-rise justify-end">
      <div className="max-w-[80%] rounded-md rounded-br-sm bg-sunken px-3.5 py-2.5">
        <p className="text-xs leading-relaxed whitespace-pre-wrap text-fg">{text}</p>
      </div>
    </div>
  );
}

/** What the turn cost, in the same mono register as the station number beside it.
 *
 * Accumulated across every model call the agent made, so a turn that looped through six
 * tool calls reads higher than the artifact alone would suggest - which is the point.
 * The breakdown names cached tokens separately because they are most of the total and
 * almost none of the cost: without them "8 in" against a six-figure total reads as a bug. */
function TokenCount({ usage }: { usage: UsageEvent }) {
  const cached = usage.cache_read_tokens + usage.cache_write_tokens;
  const parts = [
    `${usage.input_tokens.toLocaleString()} in`,
    ...(cached > 0 ? [`${cached.toLocaleString()} cached`] : []),
    `${usage.output_tokens.toLocaleString()} out`,
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
}: {
  agent: string;
  state?: "idle" | "working" | "done";
  usage?: UsageEvent;
}) {
  const meta = AGENT_META[agent];
  return (
    <div className="mb-1 flex items-center gap-2">
      <AgentAvatar agent={agent} state={state} />
      <span className="stencil text-2xs text-fg-muted">{meta?.name ?? agent}</span>
      {meta && <span className="tabular font-mono text-2xs text-fg-subtle">{meta.number}</span>}
      {usage && <TokenCount usage={usage} />}
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
      className="mt-2.5 flex w-full items-center gap-3 rounded-md border border-line-subtle bg-surface px-3 py-2.5 text-left transition-colors hover:border-line hover:bg-sunken"
    >
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
    </button>
  );
}

export function AgentTurn({
  agent,
  content,
  text,
  toolCalls,
  usage,
  viewMode = "developer",
  onViewArtifact,
}: {
  agent: string;
  content: Record<string, unknown>;
  text?: string;
  toolCalls?: ToolCallEvent[];
  usage?: UsageEvent;
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
  return (
    <div className="animate-rise">
      <Attribution agent={agent} usage={usage} />
      <div className="pl-9">
        {/* the tool-call trace is how the agent got there, not what it found - a PM
            reading for the outcome does not need every lookup it took along the way */}
        {!isPm && toolRows.length > 0 && (
          // one rule down the whole trace, so what the agent did reads as a margin note
          // against what it said rather than as a stack of separate controls
          <div className="mb-2 flex flex-col border-l border-line-subtle pl-3">
            {groupToolCalls(toolRows).map((group) => (
              <ToolCallGroup key={group[0]?.id} calls={group} />
            ))}
          </div>
        )}
        <div className="text-xs leading-relaxed text-fg">
          {/* what the agent actually said, in the position and voice it streamed in - the
              summary below is derived from the artifact and cannot mention what the agent
              could not do (a table it had no access to, a source it fell back from) */}
          {!isPm && text?.trim() && <Markdown text={text} />}
          <Markdown text={composeReply(content, askedViaTool)} />
        </div>
        {hasContent(content) && (
          <ArtifactCard agent={agent} content={content} onOpen={() => onViewArtifact(agent)} />
        )}
      </div>
    </div>
  );
}

export function StreamingTurn({
  agent,
  text,
  draft,
  waitingSeconds,
  toolCalls,
  viewMode = "developer",
}: {
  agent: string;
  text: string;
  draft?: string;
  waitingSeconds?: number;
  toolCalls: ToolCallEvent[];
  viewMode?: ViewMode;
}) {
  const toolRows = withoutPlan(toolCalls);
  const isPm = viewMode === "pm";
  return (
    <div className="animate-rise">
      <Attribution agent={agent} state="working" />
      <div className="pl-9">
        {!isPm && toolRows.length > 0 && (
          <div className="mb-2 flex flex-col border-l border-line-subtle pl-3">
            {groupToolCalls(toolRows).map((group) => (
              <ToolCallGroup key={group[0]?.id} calls={group} />
            ))}
          </div>
        )}
        {/* the only live region in the thread: without it the stream is silent to a
            screen reader, which is the one thing here that changes with no user action */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="false"
          className="text-xs leading-relaxed text-fg"
        >
          <Markdown text={text} />
          {draft ? (
            <DraftStream agent={agent} draft={draft} />
          ) : text ? (
            <span className="ml-0.5 inline-block h-3.5 w-px animate-caret bg-accent align-middle" />
          ) : (
            <span className="flex items-center gap-1" aria-label="Working">
              {[0, 160, 320].map((delay) => (
                <span
                  key={delay}
                  className="size-1.5 animate-drift rounded-full bg-fg-subtle"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
          )}
          {waitingSeconds !== undefined && (
            <span className="ml-2 align-middle text-2xs tabular-nums text-fg-subtle">
              thinking {Math.round(waitingSeconds)}s
            </span>
          )}
        </div>
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
          Writing {(AGENT_META[agent]?.output ?? "the output").toLowerCase()}
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

/** The one argument worth showing beside a tool's name, so eighteen reads of the same
 * tool list the files they touched instead of repeating the tool. Ordered by how well
 * each key identifies a call; a tool whose arguments say nothing useful gets no label. */
const LABEL_KEYS = ["path", "query", "branch", "ref", "title", "name"];

function toolCallLabel(input: Record<string, unknown> | undefined): string | null {
  for (const key of LABEL_KEYS) {
    const value = input?.[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
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

/** A fan-out as a single counted row, expanding to the individual calls. */
function ToolCallGroup({ calls }: { calls: ToolCallEvent[] }) {
  const [expanded, setExpanded] = useState(false);
  const [first, ...rest] = calls;

  if (!first) return null;
  if (rest.length === 0) return <ToolCallRow toolCall={first} />;

  const running = calls.some((call) => call.status === "running");

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        disabled={running}
        aria-expanded={expanded}
        className={cn(
          "group flex w-full items-center gap-1.5 py-0.5 text-left text-2xs transition-colors",
          running ? "text-fg-subtle" : "text-fg-muted hover:text-fg",
        )}
      >
        {running ? (
          <Spinner className="size-2.5 shrink-0 text-fg-subtle" />
        ) : (
          <TraceCaret expanded={expanded} />
        )}
        <span className="shrink-0">{toolLabel(first.name)}</span>
        <span className="tabular shrink-0 font-mono text-fg-subtle">×{calls.length}</span>
      </button>
      {expanded && (
        <div className="flex flex-col pl-4">
          {calls.map((call) => (
            <ToolCallRow key={call.id} toolCall={call} />
          ))}
        </div>
      )}
    </div>
  );
}

/** One tool call: a bare row, no frame and no status label - the name is the whole
 * message, and a spinner is the only thing that needs to say "still going". Expands to
 * the raw result, which is worth having but never worth the space by default. */
function ToolCallRow({ toolCall }: { toolCall: ToolCallEvent }) {
  const [expanded, setExpanded] = useState(false);
  const running = toolCall.status === "running";
  const interrupted = toolCall.status === "interrupted";
  const label = toolCallLabel(toolCall.input);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        disabled={running}
        aria-expanded={expanded}
        className={cn(
          "group flex w-full items-center gap-1.5 py-0.5 text-left text-2xs transition-colors",
          running ? "text-fg-subtle" : "text-fg-muted hover:text-fg",
        )}
      >
        {running ? (
          <Spinner className="size-2.5 shrink-0 text-fg-subtle" />
        ) : (
          <TraceCaret expanded={expanded} />
        )}
        <span className="shrink-0">{toolLabel(toolCall.name)}</span>
        {label && <span className="truncate font-mono text-fg-subtle">{label}</span>}
        {interrupted && <span className="shrink-0 text-fg-subtle">no result</span>}
      </button>
      {expanded && !running && (
        <div className="my-1 pl-4">
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
