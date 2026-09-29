import { useEffect, useRef, useState } from "react";
import { ArrowClockwiseIcon, ArrowDownIcon } from "@phosphor-icons/react";
import type { Artifact, Station } from "../../api/types";
import { list, openQuestions, type Coverage } from "../../api/artifacts";
import {
  closeProjectSocket,
  ensureProjectSocket,
  useProjectsStore,
} from "../../store/useProjectsStore";
import { AGENT_META, AGENT_STATIONS, PIPELINE, STATION_META, stationIndex } from "../../lib/pipeline";
import { planSteps, questionsFromToolCalls } from "../../lib/plan";
import { Button } from "../ui/Button";
import { Shipped } from "../moments/Shipped";
import { BuildBoard } from "./BuildBoard";
import { Composer } from "./Composer";
import { GateConsole } from "./GateConsole";
import { SignedCheckpoint, StationBand } from "./StationBand";
import { AgentTurn, IdleStage, ParkedTurn, StreamingTurn, UserTurn } from "./Turns";

const NO_ARTIFACTS: Artifact[] = [];

/** Within this many pixels of the end counts as reading the latest - so a stray wheel
 * tick does not stop the thread following the stream. */
const PINNED_SLACK = 120;

/** How long to wait for a project's documents and decisions before showing what there is. */
const READY_TIMEOUT_MS = 4000;

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
  const decisions = useProjectsStore((s) => s.decisionsByProject[projectId]);
  const viewMode = useProjectsStore((s) => s.viewMode);
  const failedRun = useProjectsStore((s) => s.failedRun);
  const retryFailedRun = useProjectsStore((s) => s.retryFailedRun);
  const builds = useProjectsStore((s) => s.buildsByProject[projectId]);
  const watchBuilds = useProjectsStore((s) => s.watchBuilds);
  const preview = useProjectsStore((s) => s.previewByProject[projectId]);
  const startPreview = useProjectsStore((s) => s.startPreview);
  const running = useProjectsStore((s) => s.runningProjectId === projectId);
  const cancelRun = useProjectsStore((s) => s.cancelRun);
  const advanceProject = useProjectsStore((s) => s.advanceProject);
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const [behind, setBehind] = useState(false);
  const artifactsLoaded = useProjectsStore((s) => s.artifactsByProject[projectId] !== undefined);
  const decisionsLoaded = useProjectsStore((s) => s.decisionsByProject[projectId] !== undefined);
  // A failed load leaves these undefined for good, so waiting is bounded: better a thread
  // that fills in late than a skeleton that never goes away.
  const [gaveUpOn, setGaveUpOn] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setGaveUpOn(projectId), READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [projectId]);

  // One connection for as long as this project's thread is on screen, not one per turn
  // (see `ensureProjectSocket`) - a no-op in local mode/builds with no WebSocket API
  // configured, since `api.openProjectStream` resolves `null` there. Adopts the
  // connection `createProjectFromMessage` already started opening for a brand-new
  // project rather than opening a second one.
  useEffect(() => {
    if (project?.orchestration_mode !== "deployed") return;
    void ensureProjectSocket(projectId);
    return () => closeProjectSocket(projectId);
  }, [projectId, project?.orchestration_mode]);

  // polls only while this project's thread is on screen - a build that settles after the
  // tab closes is caught by the first poll on the way back in. Not once the project is
  // off the line: `announceBuildsSettled` posts a follow-up turn for whatever station
  // is current, and a `done` project has none left to advance - the state machine had
  // already moved it there, so that late post 409s as "someone else moved this on".
  useEffect(() => {
    if (project?.station === "done") return;
    return watchBuilds(projectId);
  }, [projectId, project?.station, watchBuilds]);

  // No click required: the backend already starts this on the G3 approval/merge path,
  // but that's a fire-and-forget background task with nowhere to report success - this
  // is the same idempotent call, made once the console can actually show the result.
  useEffect(() => {
    if (project?.station === "done") void startPreview(projectId);
  }, [projectId, project?.station, startPreview]);

  const lastUserTurnId = conversation?.findLast((t) => t.role === "user")?.id;
  const loaded = project !== undefined;
  // The gate is the last thing in the thread, so painting it before the turns and signed
  // checkpoints above it makes it jump down a screen when they arrive. Hold everything
  // until the documents and decisions it is built from are in.
  const ready = loaded && ((artifactsLoaded && decisionsLoaded) || gaveUpOn === projectId);

  const toLatest = () => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
    pinned.current = true;
    setBehind(false);
  };

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < PINNED_SLACK;
    if (pinned.current) setBehind(false);
  };

  // sending a message is a request to watch the reply, wherever the reader had scrolled
  useEffect(() => {
    pinned.current = true;
  }, [lastUserTurnId]);

  // follow the conversation as it grows, but only while the reader is at the end - pulling
  // someone back down while they reread the requirements is worse than no follow at all.
  // Watching the content's height rather than particular state means every source of growth
  // is covered: streamed text, tool calls, and the documents and signatures that land after
  // the first paint (which is what used to leave a gate below the fold on open). Instant
  // rather than smooth: a smooth scroll's own intermediate positions read as the reader
  // scrolling away.
  useEffect(() => {
    const el = scroller.current;
    const inner = content.current;
    if (!el || !inner) return;
    const observer = new ResizeObserver(() => {
      if (pinned.current) el.scrollTop = el.scrollHeight;
      else setBehind(true);
    });
    observer.observe(inner);
    return () => observer.disconnect();
  }, [ready]);

  if (!ready || !project) {
    return (
      <div className="mx-auto w-full max-w-[48rem] px-6 py-6">
        <Skeleton />
      </div>
    );
  }

  const currentIdx = stationIndex(project.station);
  const artifactByAgent = new Map(artifacts.map((a) => [a.agent, a]));
  const signatureFor = (station: Station) => signatures?.find((s) => s.station === station);
  const decisionFor = (station: Station) => decisions?.findLast((d) => d.station === station);
  // only an agent station (not a gate/"done") holds a live composer.
  const activeAgent = AGENT_STATIONS.includes(project.station) ? project.station : null;
  // the plan belongs to the turn in flight, or to the last one until the next starts -
  // a finished turn's plan is settled, since a run that produced an artifact is done
  const latestAgentTurn = conversation
    ?.filter((t) => t.agent === activeAgent && t.role === "agent")
    .at(-1);
  const plan = planSteps(latestAgentTurn?.toolCalls, !latestAgentTurn?.streaming);
  // the latest turn's own `ask_clarifying_questions` call is the freshest source - it is
  // the only one a questions-only turn (no draft, so no artifact update) ever has. Then the
  // question the server parked for this project, which is all a browser that never saw
  // the turn has; then the persisted artifact's `completeness.questions`.
  const fromTurn = questionsFromToolCalls(latestAgentTurn?.toolCalls);
  const pendingQuestions = activeAgent
    ? fromTurn.length > 0
      ? fromTurn
      : (project.pending_question?.questions ??
        openQuestions(artifactByAgent.get(activeAgent)?.content ?? {}))
    : [];
  const coverage = list<Coverage>(artifactByAgent.get("review")?.content ?? {}, "coverage");
  const unmet = coverage.filter((c) => !c.met).length;

  return (
    // fixed-height column, not scrolled itself - the message list below owns its own
    // scroll region so the composer footer stays put instead of riding the content down.
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto">
        {/* one readable measure whether or not the side panel is open, so the column
            never jumps when the panel opens and never stretches past comfortable reading */}
        <div ref={content} className="mx-auto flex w-full max-w-[48rem] flex-col gap-5 px-6 py-6">
          {PIPELINE.map((station) => {
            const meta = STATION_META[station];
            const index = stationIndex(station);

            if (meta.kind === "done") {
              return project.station === "done" ? (
                <Shipped
                  key={station}
                  projectId={project.id}
                  shippedAt={project.updated_at}
                  unmet={unmet}
                  total={coverage.length}
                >
                  <p>
                    {unmet > 0
                      ? `All four stages done, but the build check found ${unmet} of ${coverage.length} requirements not met. The quality report lists them.`
                      : "All four stages done and all three gates approved. The demo script is in the documents panel."}
                  </p>
                  {preview && (
                    <p className="mt-1.5 text-fg-subtle">
                      {preview.message}
                      {preview.running && preview.frontend_url && (
                        <>
                          {" "}
                          <a
                            href={preview.frontend_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="font-medium text-success underline hover:no-underline"
                          >
                            Open frontend
                          </a>
                        </>
                      )}
                      {preview.running && preview.backend_url && (
                        <>
                          {" · "}
                          <a
                            href={preview.backend_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="font-medium text-success underline hover:no-underline"
                          >
                            Backend
                          </a>
                        </>
                      )}
                    </p>
                  )}
                </Shipped>
              ) : null;
            }

            if (meta.kind === "gate") {
              if (project.station === station) {
                return (
                  <GateConsole
                    key={station}
                    project={project}
                    artifacts={artifacts}
                    builds={builds}
                    onViewArtifact={onViewArtifact}
                  />
                );
              }
              if (index < currentIdx) {
                return (
                  <SignedCheckpoint
                    key={station}
                    station={station}
                    decision={decisionFor(station)}
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
                          startedAt={turn.createdAt}
                          toolCalls={turn.toolCalls ?? []}
                          viewMode={viewMode}
                          // only a local run can actually be stopped; a deployed one
                          // has no cancel endpoint yet, so offering Stop would lie
                          onStop={
                            running && project.orchestration_mode === "local"
                              ? cancelRun
                              : undefined
                          }
                        />
                      ) : (
                        <AgentTurn
                          key={turn.id}
                          agent={turn.agent}
                          content={
                            turn.content ??
                            // a turn rebuilt from the server's record has no document, only what it
                            // said - the station's document is what its last reply produced, unless
                            // that reply only asked questions
                            (turn.id === turns.findLast((t) => t.role === "agent")?.id &&
                            questionsFromToolCalls(turn.toolCalls).length === 0
                              ? artifact?.content
                              : undefined) ??
                            {}
                          }
                          text={turn.text}
                          toolCalls={turn.toolCalls}
                          usage={turn.usage}
                          durationMs={turn.durationMs}
                          error={turn.error}
                          onViewArtifact={onViewArtifact}
                          viewMode={viewMode}
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
                        viewMode={viewMode}
                      />
                    )}

                {isCurrent && turns.length === 0 && project.pending_question && (
                  <ParkedTurn agent={station} pending={project.pending_question} />
                )}

                {isCurrent &&
                  station !== "distill" &&
                  project.orchestration_mode !== "deployed" &&
                  !running &&
                  !artifact &&
                  turns.length === 0 &&
                  !project.pending_question &&
                  failedRun?.projectId !== projectId && (
                    <IdleStage
                      agent={station}
                      since={project.updated_at}
                      onStart={() =>
                        void advanceProject(projectId, station, `${AGENT_META[station]?.name ?? station} may begin.`)
                      }
                    />
                  )}

                {/* stays up through Review's own gate, not just while Review is the
                    current station - a human deciding G3 needs to see build state, not
                    have it vanish the moment Review hands off */}
                {(isCurrent || (station === "review" && project.station === "showroom_approval")) &&
                  builds &&
                  builds.builds.length > 0 && (
                    <BuildBoard
                      repository={builds.repository}
                      builds={builds.builds}
                      watching={builds.watching}
                      reviewComplete={!isCurrent}
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
        </div>
      </div>

      {behind && (
        <button
          type="button"
          onClick={toLatest}
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 animate-rise items-center gap-1.5 rounded-full border border-line bg-overlay px-3 py-1.5 text-xs font-medium text-fg shadow-overlay transition-colors hover:bg-sunken"
        >
          <ArrowDownIcon className="size-3.5" />
          Jump to latest
        </button>
      )}
      </div>

      {activeAgent && (
        <div className="mx-auto w-full max-w-[48rem] px-6 pb-6">
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
