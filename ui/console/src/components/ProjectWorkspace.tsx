import { useState } from "react";
import { useProjectsStore } from "../store/useProjectsStore";
import type { Artifact } from "../api/types";
import { ArtifactPanel } from "./ArtifactPanel";
import { ChatThread } from "./ChatThread";

const NO_ARTIFACTS: Artifact[] = [];

/** Owns the split between the conversation (ChatThread) and the structured output of
 * whichever agent produced it (ArtifactPanel) - the two used to be conflated into one
 * inline card per chat turn, which buried the artifact once the conversation moved on. */
export function ProjectWorkspace({ projectId }: { projectId: string }) {
  const artifacts = useProjectsStore((s) => s.artifactsByProject[projectId] ?? NO_ARTIFACTS);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [prevArtifacts, setPrevArtifacts] = useState(artifacts);

  // auto-follow (and pop open for) the newest artifact as it lands (mirrors
  // Claude-style artifacts popping open when finished), adjusted during render rather
  // than in an effect (React's recommended pattern for state that depends on a
  // prop/store change) - but only when a NEW one arrives, so manually closing the
  // panel or browsing an older tab doesn't get overridden
  if (artifacts !== prevArtifacts) {
    setPrevArtifacts(artifacts);
    if (artifacts.length > prevArtifacts.length || (selectedAgent === null && artifacts.length > 0)) {
      const newest = [...artifacts].sort((a, b) => a.created_at.localeCompare(b.created_at)).at(-1);
      if (newest) {
        setSelectedAgent(newest.agent);
        setPanelOpen(true);
      }
    }
  }

  const openArtifact = (agent: string) => {
    setSelectedAgent(agent);
    setPanelOpen(true);
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <ChatThread
          projectId={projectId}
          onViewArtifact={openArtifact}
          onOpenArtifacts={artifacts.length > 0 && !panelOpen ? () => setPanelOpen(true) : undefined}
        />
      </div>
      {panelOpen && (
        <ArtifactPanel
          artifacts={artifacts}
          selectedAgent={selectedAgent}
          onSelectAgent={setSelectedAgent}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </div>
  );
}


