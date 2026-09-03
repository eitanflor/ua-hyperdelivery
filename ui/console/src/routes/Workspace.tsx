import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { SidebarSimpleIcon } from "@phosphor-icons/react";
import { useProjectsStore } from "../store/useProjectsStore";
import type { Artifact } from "../api/types";
import { Thread } from "../components/thread/Thread";
import { Inspector } from "../components/inspector/Inspector";
import { Button } from "../components/ui/Button";

const NO_ARTIFACTS: Artifact[] = [];

export function Workspace() {
  const { projectId = "" } = useParams();
  const artifacts = useProjectsStore((s) => s.artifactsByProject[projectId] ?? NO_ARTIFACTS);
  const loadProject = useProjectsStore((s) => s.loadProject);
  const loadArtifacts = useProjectsStore((s) => s.loadArtifacts);

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(artifacts);

  useEffect(() => {
    void loadProject(projectId);
    void loadArtifacts(projectId);
  }, [projectId, loadProject, loadArtifacts]);

  // follow the newest artifact as it lands, but only when a NEW one arrives - so
  // closing the panel or browsing an older tab is not overridden on the next render
  if (artifacts !== seen) {
    setSeen(artifacts);
    if (artifacts.length > seen.length || (selectedAgent === null && artifacts.length > 0)) {
      const newest = [...artifacts].sort((a, b) => a.created_at.localeCompare(b.created_at)).at(-1);
      if (newest) {
        setSelectedAgent(newest.agent);
        setOpen(true);
      }
    }
  }

  const openArtifact = (agent: string) => {
    setSelectedAgent(agent);
    setOpen(true);
  };

  return (
    <div className="flex h-full min-w-0">
      {/* 65-75ch measure floor: the reading column no longer collapses when both
          panels are open on a 13" laptop. Thread owns its own scroll region so the
          composer footer can stay fixed to the bottom instead of scrolling with it. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Thread projectId={projectId} onViewArtifact={openArtifact} />
      </div>

      {open ? (
        <Inspector
          artifacts={artifacts}
          selectedAgent={selectedAgent}
          onSelectAgent={setSelectedAgent}
          onClose={() => setOpen(false)}
        />
      ) : (
        artifacts.length > 0 && (
          <div className="shrink-0 border-l border-line-subtle p-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<SidebarSimpleIcon className="size-3.5 scale-x-[-1]" />}
              onClick={() => setOpen(true)}
            >
              <span className="sr-only">Show </span>Artifacts
            </Button>
          </div>
        )
      )}
    </div>
  );
}
