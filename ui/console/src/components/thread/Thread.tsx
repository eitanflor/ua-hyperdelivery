import { useEffect, useRef } from "react";
import { ArrowClockwiseIcon, ConfettiIcon } from "@phosphor-icons/react";
import type { Artifact, Station } from "../../api/types";
import { openQuestions } from "../../api/artifacts";
import { useProjectsStore } from "../../store/useProjectsStore";
import { AGENT_STATIONS, PIPELINE, STATION_META, stationIndex } from "../../lib/pipeline";
import { planSteps } from "../../lib/plan";
import { Button } from "../ui/Button";
import { BuildBoard } from "./BuildBoard";
import { Composer } from "./Composer";
import { GateConsole } from "./GateConsole";
import { SignedCheckpoint, StationBand } from "./StationBand";
import { AgentTurn, StreamingTurn, UserTurn } from "./Turns";

const NO_ARTIFACTS: Artifact[] = [];

function Skeleton() {
  return (
    <div className="flex flex-col gap-4" aria-label="Loading project" role="status">
      {[0, 1].map((i) => (
        <div key={i} className="flex gap-3">
          <span className="size-7 shrink-0 animate-pulse rounded-full bg-sunken" />
          <div className="flex-1 space-y-2 py-1">
            <span className="block h-2.5 w-1/3 animate-pulse rounded-full bg-sunken" />
            <span className="block h-2.5 w-4/5 animate-pulse rounded-full bg-sunken" />
            <span className="block h-2.5 w-2/3 animate-pulse rounded-full bg-sunken" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Thread({
  projectId,
  onViewArtifact,
}: {
  projectId: string;
  onViewArtifact: (agent: string) => void;
}) {
  const project = useProjectsStore((s) => s.projects[projectId]);
  const artifacts = useProjectsStore((s) => s.artifactsByProject[projectId] ?? NO_ARTIFACTS);
  const conversation = useProjectsStore((s) => s.conversationByProject[projectId]);
  const signatures = useProjectsStore((s) => s.signaturesByProject[projectId]);
  const failedRun = useProjectsStore((s) => s.failedRun);
  const retryFailedRun = useProjectsStore((s) => s.retryFailedRun);
  const builds = useProjectsStore((s) => s.buildsByProject[projectId]);
  const watchBuilds = useProjectsStore((s) => s.watchBuilds);
  const bottom = useRef<HTMLDivElement>(null);

  // polls only while this project's thread is on screen - a build that settles after the
  // tab closes is caught by the first poll on the way back in
  useEffect(() => watchBuilds(projectId), [projectId, watchBuilds]);

  const streamingTurn = conversation?.find((t) => t.streaming);

  // follow the conversation as it grows - without this the stream writes off-screen.
  // Tool calls and the draft are tracked as well as the text: a station that goes
  // straight to tools produces no text at all, so keying on that alone left every tool
  // row below the fold, under a composer the plan had just made taller.
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [
    conversation?.length,
    streamingTurn?.text,
    streamingTurn?.toolCalls?.length,
    streamingTurn?.draft?.length,
  ]);

  if (!project) {
    return (
      <div className="mx-auto w-full max-w-[46rem] px-6 py-6">
        <Skeleton />
      </div>
    );
  }

  const currentIdx = stationIndex(project.station);
  const artifactByAgent = new Map(artifacts.map((a) => [a.agent, a]));
  const signatureFor = (station: Station) => signatures?.find((s) => s.station === station);
  // only an agent station (not a gate/"done") holds a live composer.
  const activeAgent = AGENT_STATIONS.includes(project.station) ? project.station : null;
  const pendingQuestions = activeAgent
    ? openQuestions(artifactByAgent.get(activeAgent)?.content ?? {})
    : [];
  // the plan belongs to the turn in flight, or to the last one until the next starts -
  // a finished turn's plan is settled, since a run that produced an artifact is done
  const latestAgentTurn = conversation
    ?.filter((t) => t.agent === activeAgent && t.role === "agent")
    .at(-1);
  const plan = planSteps(latestAgentTurn?.toolCalls, !latestAgentTurn?.streaming);

  return (
    // fixed-height column, not scrolled itself - the message list below owns its own
    // scroll region so the composer footer stays put instead of riding the content down.
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[46rem] flex-col gap-5 px-6 py-6">
          {PIPELINE.map((station) => {
            const meta = STATION_META[station];
            const index = stationIndex(station);

            if (meta.kind === "done") {
              return project.station === "done" ? (
                <div
                  key={station}
                  className="flex animate-rise items-center gap-3 rounded-md border border-success/25 bg-success-bg px-4 py-3"
                >
                  <ConfettiIcon weight="fill" className="size-5 shrink-0 text-success" />
                  <div>
                    <p className="stencil text-xs text-fg">Off the line.</p>
                    <p className="mt-0.5 text-2xs text-fg-muted">
                      Four stations cleared, both gates signed. The run of show is in the
                      artifacts panel.
                    </p>
                  </div>
                </div>
              ) : null;
            }

            if (meta.kind === "gate") {
              if (project.station === station) {
                return <GateConsole key={station} project={project} artifacts={artifacts} />;
              }
              if (index < currentIdx) {
                return (
                  <SignedCheckpoint
                    key={station}
                    station={station}
                    signature={signatureFor(station)}
                  />
                );
              }
              return null;
            }

            if (!AGENT_STATIONS.includes(station) || index > currentIdx) return null;

            const turns = conversation?.filter((t) => t.agent === station) ?? [];
            const artifact = artifactByAgent.get(station);
            const isCurrent = project.station === station;

            return (
              <section key={station} className="flex flex-col gap-4">
                <StationBand station={station} />

                {turns.length > 0
                  ? turns.map((turn) =>
                      turn.role === "user" ? (
                        <UserTurn key={turn.id} text={turn.text ?? ""} />
                      ) : turn.streaming ? (
                        <StreamingTurn
                          key={turn.id}
                          agent={turn.agent}
                          text={turn.text ?? ""}
                          draft={turn.draft}
                          waitingSeconds={turn.waitingSeconds}
                          toolCalls={turn.toolCalls ?? []}
                        />
                      ) : (
                        <AgentTurn
                          key={turn.id}
                          agent={turn.agent}
                          content={turn.content ?? {}}
                          text={turn.text}
                          toolCalls={turn.toolCalls}
                          usage={turn.usage}
                          onViewArtifact={onViewArtifact}
                        />
                      ),
                    )
                  : // no local turns (e.g. this project was opened on another machine) -
                    // fall back to the persisted artifact so a finished station still shows
                    artifact && (
                      <AgentTurn
                        agent={artifact.agent}
                        content={artifact.content}
                        onViewArtifact={onViewArtifact}
                      />
                    )}

                {isCurrent && builds && builds.builds.length > 0 && (
                  <BuildBoard
                    repository={builds.repository}
                    builds={builds.builds}
                    watching={builds.watching}
                  />
                )}

                {isCurrent && failedRun?.projectId === projectId && (
                  <div className="flex animate-rise items-center gap-3 rounded-md border border-danger/25 bg-danger-bg px-3.5 py-2.5">
                    <p className="flex-1 text-xs text-fg">
                      That run did not finish. Nothing was saved.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<ArrowClockwiseIcon className="size-3.5" />}
                      onClick={() => void retryFailedRun()}
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </section>
            );
          })}

          <div ref={bottom} />
        </div>
      </div>

      {activeAgent && (
        <div className="mx-auto w-full max-w-[46rem] px-6 pb-6">
          <Composer
            projectId={projectId}
            agent={activeAgent}
            questions={pendingQuestions}
            plan={plan}
          />
        </div>
      )}
    </div>
  );
}
