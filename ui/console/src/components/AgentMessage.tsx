import type { Artifact } from "../api/types";
import { ASSISTANT_META } from "../lib/pipeline";
import { composeReply } from "../lib/formatArtifact";
import { Avatar } from "./Avatar";

/** A finished turn in the chat - the assistant's own reply text (see composeReply),
 * not the artifact itself. The structured output lives in the ArtifactPanel; a "View
 * artifact" link is offered for anyone who wants it, but it's secondary to the reply. */
export function AgentMessage({
  artifact,
  onViewArtifact,
}: {
  artifact: Artifact;
  onViewArtifact?: (agent: string) => void;
}) {
  return (
    <div className="animate-fade-in-up flex gap-3">
      <Avatar label={ASSISTANT_META.initial} gradient={ASSISTANT_META.gradient} />
      <div className="flex-1 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-md">
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-ua-black">
          {composeReply(artifact.content)}
        </p>
        <button
          className="mt-2 text-xs font-medium text-ua-steel transition-colors hover:text-ua-black"
          onClick={() => onViewArtifact?.(artifact.agent)}
        >
          View artifact →
        </button>
      </div>
    </div>
  );
}

