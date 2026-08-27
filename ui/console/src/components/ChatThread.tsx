import { useEffect } from "react";
import { useProjectsStore, type ChatTurn } from "../store/useProjectsStore";
import type { Artifact, Station } from "../api/types";
import { AGENT_STATIONS, PIPELINE, stationIndex } from "../lib/pipeline";
import { AgentMessage } from "./AgentMessage";
import { DecisionComposer } from "./DecisionComposer";
import { Checkpoint } from "./Checkpoint";
import { PipelineStepper } from "./PipelineStepper";
import { RunAgentPrompt } from "./RunAgentPrompt";
import { StreamingMessage } from "./StreamingMessage";
import { UserMessage } from "./UserMessage";

// stable references - a fresh `[]` fallback on every selector call would make
// useSyncExternalStore see a "new" snapshot each render and loop forever.
const NO_ARTIFACTS: Artifact[] = [];
const NO_TURNS: ChatTurn[] = [];

export function ChatThread({
  projectId,
  onViewArtifact,
  onOpenArtifacts,
}: {
  projectId: string;
  onViewArtifact?: (agent: string) => void;
  onOpenArtifacts?: () => void;
}) {
  const project = useProjectsStore((s) => s.projects[projectId]);
  const artifacts = useProjectsStore((s) => s.artifactsByProject[projectId] ?? NO_ARTIFACTS);
  const conversation = useProjectsStore((s) => s.conversationByProject[projectId] ?? NO_TURNS);
  const error = useProjectsStore((s) => s.error);
  const loadProject = useProjectsStore((s) => s.loadProject);
  const loadArtifacts = useProjectsStore((s) => s.loadArtifacts);

  useEffect(() => {
    void loadProject(projectId);
    void loadArtifacts(projectId);
  }, [projectId, loadProject, loadArtifacts]);

  if (!project) {
    if (error) return <p className="p-6 text-sm text-ua-red">{error}</p>;
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-ua-steel">
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ua-steel [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ua-steel [animation-delay:160ms]" />
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ua-steel [animation-delay:320ms]" />
      </div>
    );
  }

  const artifactByAgent = new Map(artifacts.map((a) => [a.agent, a]));
  const currentIdx = stationIndex(project.station);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-8">
      <div className="sticky top-0 z-10 -mx-6 flex items-center justify-between border-b border-black/5 bg-white/85 px-6 pb-4 pt-2 backdrop-blur-md">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-ua-black">{project.name}</h2>
          <PipelineStepper station={project.station} />
        </div>
        <div className="flex items-center gap-2">
          {onOpenArtifacts && (
            <button
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-ua-steel transition-colors hover:bg-black/5 hover:text-ua-black"
              onClick={onOpenArtifacts}
            >
              Show artifacts
            </button>
          )}
          <span className="rounded-full border border-black/10 bg-ua-cloud px-3 py-1 text-xs font-semibold tracking-wide text-ua-steel uppercase">
            {project.station.replace("_", " ")}
          </span>
        </div>
      </div>

      {error && (
        <p className="animate-fade-in-up rounded-lg border border-ua-red/20 bg-ua-red/10 px-3 py-2 text-sm text-ua-red">
          {error}
        </p>
      )}

      {PIPELINE.map((station) => {
        if (station === "done") {
          return project.station === "done" ? (
            <div
              key={station}
              className="animate-fade-in-up flex items-center gap-2 pl-11 text-sm font-medium text-emerald-400"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-[10px]">
                ✓
              </span>
              Project complete.
            </div>
          ) : null;
        }

        if (AGENT_STATIONS.includes(station)) {
          const stationTurns = conversation.filter((t) => t.agent === station);
          const artifact = artifactByAgent.get(station);
          const isCurrent = project.station === station;

          return (
            <div key={station} className="flex flex-col gap-4">
              {stationTurns.length > 0
                ? stationTurns.map((turn) =>
                    turn.role === "user" ? (
                      <UserMessage key={turn.id} text={turn.text ?? ""} />
                    ) : turn.streaming ? (
                      <StreamingMessage key={turn.id} text={turn.text ?? ""} />
                    ) : (
                      <AgentMessage
                        key={turn.id}
                        artifact={{ agent: turn.agent, content: turn.content ?? {}, created_at: turn.createdAt }}
                        onViewArtifact={onViewArtifact}
                      />
                    ),
                  )
                : // no local turn history (e.g. fresh page load) - fall back to the
                  // persisted artifact so a finished station still shows its result.
                  artifact && <AgentMessage artifact={artifact} onViewArtifact={onViewArtifact} />}
              {isCurrent && <RunAgentPrompt projectId={project.id} agent={station} />}
            </div>
          );
        }

        // approval stations
        if (project.station === station) {
          return <DecisionComposer key={station} projectId={project.id} station={station} />;
        }
        if (stationIndex(station as Station) < currentIdx) {
          return <Checkpoint key={station} label={`Approved at ${station.replace("_", " ")}`} />;
        }
        return null;
      })}
    </div>
  );
}
