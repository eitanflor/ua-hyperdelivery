import { useState } from "react";
import { useProjectsStore } from "../store/useProjectsStore";
import { ASSISTANT_META } from "../lib/pipeline";
import { Avatar } from "./Avatar";
import { Spinner } from "./Spinner";

export function RunAgentPrompt({ projectId, agent }: { projectId: string; agent: string }) {
  const [text, setText] = useState("");
  const advanceProject = useProjectsStore((s) => s.advanceProject);
  const loading = useProjectsStore((s) => s.loading);

  const send = async () => {
    if (!text.trim()) return;
    const submitted = text.trim();
    await advanceProject(projectId, agent, submitted);
    if (!useProjectsStore.getState().error) setText("");
  };

  return (
    <div className="animate-fade-in-up flex gap-3">
      <Avatar label={ASSISTANT_META.initial} gradient={ASSISTANT_META.gradient} />
      <div className="relative flex-1 rounded-2xl border border-black/10 bg-white transition-colors focus-within:border-ua-red/40">
        <textarea
          className="w-full resize-none rounded-2xl bg-transparent px-4 pt-3 pb-8 pr-12 text-sm text-ua-black placeholder:text-ua-steel focus:outline-none"
          rows={3}
          placeholder="Message the assistant..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send();
          }}
        />
        <span className="pointer-events-none absolute bottom-2.5 left-4 right-12 text-[11px] text-ua-steel">
          {loading ? (
            <span className="flex items-center gap-1">
              <Spinner className="h-3 w-3" /> thinking…
            </span>
          ) : (
            "⌘/Ctrl + Enter to send"
          )}
        </span>
        <button
          className="absolute bottom-2 right-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ua-red text-white transition-all hover:bg-ua-red-dark active:scale-[0.94] disabled:opacity-40"
          onClick={() => void send()}
          disabled={loading || !text.trim()}
          aria-label="Send"
        >
          {loading ? (
            <Spinner className="h-3.5 w-3.5" />
          ) : (
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14m0 0-6-6m6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
