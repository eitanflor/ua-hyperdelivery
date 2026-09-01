import { useState } from "react";
import { ArrowSquareOutIcon, CaretRightIcon, StopIcon } from "@phosphor-icons/react";
import type { ToolCallEvent } from "../../api/client";
import { AGENT_META } from "../../lib/pipeline";
import { composeReply } from "../../lib/formatArtifact";
import { cn } from "../../lib/cn";
import { AgentAvatar } from "./AgentAvatar";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";

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

export function AgentTurn({
  agent,
  content,
  toolCalls,
  onViewArtifact,
}: {
  agent: string;
  content: Record<string, unknown>;
  toolCalls?: ToolCallEvent[];
  onViewArtifact: (agent: string) => void;
}) {
  return (
    <div className="animate-rise">
      <Attribution agent={agent} />
      <div className="pl-9">
        {toolCalls && toolCalls.length > 0 && (
          <div className="mb-2 flex flex-col gap-1">
            {toolCalls.map((toolCall) => (
              <ToolCallRow key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}
        <p className="text-xs leading-relaxed whitespace-pre-wrap text-fg">
          {composeReply(content)}
        </p>
        <button
          type="button"
          onClick={() => onViewArtifact(agent)}
          className="mt-2 inline-flex items-center gap-1.5 text-2xs font-medium text-fg-subtle transition-colors hover:text-accent-text"
        >
          <ArrowSquareOutIcon className="size-3.5" />
          Open the {(AGENT_META[agent]?.output ?? "output").toLowerCase()}
        </button>
      </div>
    </div>
  );
}

export function StreamingTurn({
  agent,
  text,
  toolCalls,
  onStop,
}: {
  agent: string;
  text: string;
  toolCalls: ToolCallEvent[];
  onStop: () => void;
}) {
  return (
    <div className="animate-rise">
      <Attribution agent={agent} state="working" />
      <div className="pl-9">
        {toolCalls.length > 0 && (
          <div className="mb-2 flex flex-col gap-1">
            {toolCalls.map((toolCall) => (
              <ToolCallRow key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}
        {/* the only live region in the thread: without it the stream is silent to a
            screen reader, which is the one thing here that changes with no user action */}
        <p
          role="status"
          aria-live="polite"
          aria-atomic="false"
          className="text-xs leading-relaxed whitespace-pre-wrap text-fg"
        >
          {text}
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
        </p>
        <Button
          variant="ghost"
          size="sm"
          icon={<StopIcon className="size-3.5" />}
          onClick={onStop}
          className="mt-2 -ml-3"
        >
          Stop
        </Button>
      </div>
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
