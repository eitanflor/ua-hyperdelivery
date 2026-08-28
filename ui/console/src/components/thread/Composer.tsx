import { useState } from "react";
import { ArrowUpIcon } from "@phosphor-icons/react";
import { useProjectsStore } from "../../store/useProjectsStore";
import { AGENT_META } from "../../lib/pipeline";
import { Spinner } from "../ui/Spinner";
import { cn } from "../../lib/cn";

/** Composer for the station currently holding the project. */
export function Composer({ projectId, agent }: { projectId: string; agent: string }) {
  const [text, setText] = useState("");
  const advanceProject = useProjectsStore((s) => s.advanceProject);
  const running = useProjectsStore((s) => s.runningProjectId === projectId);
  const label = AGENT_META[agent]?.name ?? agent;

  const send = async () => {
    const submitted = text.trim();
    if (!submitted || running) return;
    setText("");
    await advanceProject(projectId, agent, submitted);
    if (useProjectsStore.getState().error) setText(submitted);
  };

  return (
    <div
      className={cn(
        "relative rounded-md border bg-surface transition-colors",
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
        placeholder={`Message ${label}…`}
        value={text}
        disabled={running}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send();
        }}
      />
      <span className="pointer-events-none absolute bottom-2.5 left-3.5 text-2xs text-fg-subtle">
        {running ? (
          <span className="flex items-center gap-1.5">
            <Spinner className="size-3" /> {label} is working…
          </span>
        ) : (
          "⌘/Ctrl + Enter to send"
        )}
      </span>
      <button
        type="button"
        onClick={() => void send()}
        disabled={running || !text.trim()}
        aria-label={`Send to ${label}`}
        className="absolute right-2 bottom-2 flex size-7 items-center justify-center rounded-full bg-accent text-fg-on-accent transition-all hover:bg-accent-hover active:scale-95 disabled:opacity-35"
      >
        <ArrowUpIcon weight="bold" className="size-4" />
      </button>
    </div>
  );
}
