import { useState } from "react";
import {
  ArrowSquareOutIcon,
  CaretRightIcon,
  CheckIcon,
  CircleDashedIcon,
  FileTextIcon,
} from "@phosphor-icons/react";
import type { ToolCallEvent } from "../../api/client";
import { hasContent } from "../../api/artifacts";
import { AGENT_META } from "../../lib/pipeline";
import { artifactStats, composeReply } from "../../lib/formatArtifact";
import { Markdown } from "../../lib/markdown";
import { cn } from "../../lib/cn";
import { AgentAvatar } from "./AgentAvatar";
import { Spinner } from "../ui/Spinner";

/** The shared planning tool (see src/tools/planning.py) - rendered as a plan, not a call. */
const PLAN_TOOL = "track_plan";

export function UserTurn({ text }: { text: string }) {
  return (
    <div className="flex animate-rise justify-end">
      <div className="max-w-[80%] rounded-md rounded-br-sm bg-sunken px-3.5 py-2.5">
        <p className="text-xs leading-relaxed whitespace-pre-wrap text-fg">{text}</p>
      </div>
    </div>
  );
}

function Attribution({ agent, state }: { agent: string; state?: "idle" | "working" | "done" }) {
  const meta = AGENT_META[agent];
  return (
    <div className="mb-1 flex items-center gap-2">
      <AgentAvatar agent={agent} state={state} />
      <span className="stencil text-2xs text-fg-muted">{meta?.name ?? agent}</span>
      {meta && <span className="tabular font-mono text-2xs text-fg-subtle">{meta.number}</span>}
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
  onViewArtifact,
}: {
  agent: string;
  content: Record<string, unknown>;
  text?: string;
  toolCalls?: ToolCallEvent[];
  onViewArtifact: (agent: string) => void;
}) {
  const { plan, rest } = splitPlan(toolCalls);
  return (
    <div className="animate-rise">
      <Attribution agent={agent} />
      <div className="pl-9">
        {(plan || text?.trim() || rest.length > 0) && (
          <div className="mb-2 flex flex-col gap-1">
            {plan && <PlanList steps={plan} />}
            {text?.trim() && <ReasoningRow text={text} />}
            {rest.map((toolCall) => (
              <ToolCallRow key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}
        <div className="text-xs leading-relaxed text-fg">
          <Markdown text={composeReply(content)} />
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
  toolCalls,
}: {
  agent: string;
  text: string;
  toolCalls: ToolCallEvent[];
}) {
  const { plan, rest } = splitPlan(toolCalls);
  return (
    <div className="animate-rise">
      <Attribution agent={agent} state="working" />
      <div className="pl-9">
        {(plan || rest.length > 0) && (
          <div className="mb-2 flex flex-col gap-1">
            {plan && <PlanList steps={plan} />}
            {rest.map((toolCall) => (
              <ToolCallRow key={toolCall.id} toolCall={toolCall} />
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
          {text ? (
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
        </div>
      </div>
    </div>
  );
}

/** The agent's plan, as a todo list that updates in place.
 *
 * `track_plan` is called once per step, so rendering each call as its own tool row buries
 * the actual work under near-identical entries. Only the latest call is the plan. */
function PlanList({ steps }: { steps: [string, string][] }) {
  return (
    <ol className="flex flex-col gap-1 rounded-sm border border-line/60 bg-sunken/60 px-2 py-1.5">
      {steps.map(([title, status]) => (
        <li key={title} className="flex items-center gap-1.5 text-2xs">
          {status === "done" ? (
            <CheckIcon weight="bold" className="size-3 shrink-0 text-success" />
          ) : status === "in_progress" ? (
            <Spinner className="size-3 shrink-0 text-accent-text" />
          ) : (
            <CircleDashedIcon className="size-3 shrink-0 text-fg-subtle" />
          )}
          <span
            className={cn(
              status === "done" && "text-fg-subtle line-through",
              status === "in_progress" && "text-fg",
              status === "pending" && "text-fg-muted",
            )}
          >
            {title}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Splits the plan out of a turn's tool calls: the last `track_plan` result is the
 * current plan, and every earlier one is a superseded snapshot of it. */
function splitPlan(toolCalls: ToolCallEvent[] | undefined): {
  plan: [string, string][] | null;
  rest: ToolCallEvent[];
} {
  const rest = (toolCalls ?? []).filter((tc) => tc.name !== PLAN_TOOL);
  const latest = (toolCalls ?? []).filter((tc) => tc.name === PLAN_TOOL).at(-1);
  const steps = (latest?.result as { steps?: unknown } | undefined)?.steps;
  if (!steps || typeof steps !== "object" || Array.isArray(steps)) return { plan: null, rest };
  const entries = Object.entries(steps).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string",
  );
  return { plan: entries.length > 0 ? entries : null, rest };
}

/** What the agent said while working, kept after the run finishes. The summary below
 * is derived from the artifact and can't mention what the agent couldn't do (a table it
 * had no access to, a source it fell back from), so the narrative stays reachable. */
function ReasoningRow({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-sm border border-line/60 bg-sunken/60">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-1.5 px-2 py-1 text-left text-2xs text-fg-muted transition-colors hover:text-fg"
      >
        <CaretRightIcon
          className={cn("size-3 shrink-0 transition-transform", expanded && "rotate-90")}
        />
        <span className="truncate">Reasoning</span>
      </button>
      {expanded && (
        <div className="border-t border-line/60 px-2 py-1.5 text-2xs leading-relaxed text-fg-muted">
          <Markdown text={text} />
        </div>
      )}
    </div>
  );
}

/** One tool call, live: greyed and unexpandable while running, then a minimized
 * "done" row a reader can open to see the raw result - visible without cluttering
 * the reply itself, which is what actually answers the request. */
function ToolCallRow({ toolCall }: { toolCall: ToolCallEvent }) {
  const [expanded, setExpanded] = useState(false);
  const running = toolCall.status === "running";

  return (
    <div className="overflow-hidden rounded-sm border border-line/60 bg-sunken/60">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        disabled={running}
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-center gap-1.5 px-2 py-1 text-left text-2xs transition-colors",
          running ? "text-fg-subtle" : "text-fg-muted hover:text-fg",
        )}
      >
        {running ? (
          <Spinner className="size-3 shrink-0 text-fg-subtle" />
        ) : (
          <CaretRightIcon
            className={cn("size-3 shrink-0 transition-transform", expanded && "rotate-90")}
          />
        )}
        <span className="truncate font-mono">{toolCall.name}</span>
        <span className="ml-auto shrink-0 text-2xs text-fg-subtle">
          {running ? "running…" : "done"}
        </span>
      </button>
      {expanded && !running && (
        <pre className="overflow-x-auto border-t border-line/60 px-2 py-1.5 font-mono text-2xs text-fg-muted">
          {JSON.stringify(toolCall.result ?? null, null, 2)}
        </pre>
      )}
    </div>
  );
}
