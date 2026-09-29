import { ArrowSquareOutIcon, ArrowUUpLeftIcon, SealCheckIcon } from "@phosphor-icons/react";
import type { Artifact, Decision, Project, Station } from "../../api/types";
import { AGENT_META, PIPELINE, STATION_META, stationIndex } from "../../lib/pipeline";
import { withoutPlan } from "../../lib/plan";
import { timeAgo } from "../../lib/time";
import { personName } from "../../lib/people";
import { cn } from "../../lib/cn";
import { useProjectsStore, type ChatTurn } from "../../store/useProjectsStore";
import { ThoughtLine } from "../thread/ThoughtLine";
import { IsoLine } from "../art/IsoLine";
import { StatusMark } from "../ui/StatusMark";

const NO_TURNS: ChatTurn[] = [];
const NO_DECISIONS: Decision[] = [];

function lower(text: string | undefined, fallback: string): string {
  return (text ?? fallback).toLowerCase();
}

/** Where the project is, as one sentence a requester can repeat to someone else. */
function headline(project: Project, running: boolean, hasDocument: boolean): string {
  const meta = STATION_META[project.station];
  if (meta.kind === "done") return "Shipped. All four stages are done.";
  if (meta.kind === "gate") return `Waiting for approval at ${meta.full}.`;
  const agent = AGENT_META[meta.agent!];
  if (running) return `${agent?.name ?? "The crew"} is working on the ${lower(agent?.output, "document")}.`;
  const asked = project.pending_question?.questions?.length ?? 0;
  if (asked > 0) {
    return `${agent?.name ?? "The crew"} has ${asked === 1 ? "a question" : `${asked} questions`} before going on. Answer below the thread.`;
  }
  if (!hasDocument && meta.agent !== "distill") {
    return `${agent?.name ?? "The next stage"} hasn't started on the ${lower(agent?.output, "document")} yet.`;
  }
  return `With ${agent?.name ?? "the crew"}. Reply in the chat to keep it moving.`;
}

/** What the current station leads to - the question people ask most while they wait. */
function nextStep(station: Station): string | null {
  const meta = STATION_META[station];
  if (meta.kind === "done") return null;
  if (meta.kind === "gate") {
    const reviewed = AGENT_META[meta.reviewing!];
    const unlocked = AGENT_META[meta.unlocks!];
    return `Once someone approves the ${lower(reviewed?.output, "document")}, ${unlocked?.name ?? "the next stage"} starts on the ${lower(unlocked?.output, "next document")}.`;
  }
  const agent = AGENT_META[meta.agent!];
  const following = PIPELINE[stationIndex(station) + 1];
  if (!following || STATION_META[following].kind === "done") {
    return `When ${agent?.name ?? "this stage"} finishes the ${lower(agent?.output, "document")}, the project is shipped.`;
  }
  return `When ${agent?.name ?? "this stage"} finishes, a person approves the ${lower(agent?.output, "document")} at ${STATION_META[following].label}. Nothing moves on until then.`;
}

/** The side panel's first tab: the whole line at a glance, what is happening now, and
 * what happens next - so the panel is useful before the first document exists instead
 * of an empty box. */
export function ProgressView({
  projectId,
  documents,
  onOpen,
}: {
  projectId: string;
  documents: Artifact[];
  onOpen: (agent: string) => void;
}) {
  const project = useProjectsStore((s) => s.projects[projectId]);
  const conversation = useProjectsStore((s) => s.conversationByProject[projectId] ?? NO_TURNS);
  const running = useProjectsStore((s) => s.runningProjectId === projectId);
  const decisions = useProjectsStore((s) => s.decisionsByProject[projectId] ?? NO_DECISIONS);
  // the picture of the line is for readers who want the gist; Detailed mode skips to the list
  const simple = useProjectsStore((s) => s.viewMode === "pm");

  if (!project) {
    return (
      <div className="flex-1 p-4" role="status" aria-label="Loading progress">
        <span className="block h-2.5 w-2/3 animate-pulse rounded-full bg-sunken" />
      </div>
    );
  }

  const currentIdx = stationIndex(project.station);
  const shipped = project.station === "done";
  const streaming = conversation.find((t) => t.streaming);
  const documentFor = new Set(documents.map((d) => d.agent));
  const next = nextStep(project.station);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {simple && (
        <IsoLine
          current={project.station}
          active={running}
          className="mb-4"
          label={`The line, with this project at ${STATION_META[project.station].full}.`}
        />
      )}
      <p className="text-sm font-medium text-fg">
        {headline(project, running, documents.some((d) => d.agent === project.station))}
      </p>
      {streaming && (
        <ThoughtLine
          agent={streaming.agent}
          startedAt={streaming.createdAt}
          toolCalls={withoutPlan(streaming.toolCalls ?? [])}
          draft={streaming.draft}
        />
      )}

      <ol aria-label="Stages" className="mt-5">
        {PIPELINE.map((station, i) => {
          const meta = STATION_META[station];
          const agent = meta.agent ? AGENT_META[meta.agent] : undefined;
          const done = shipped || i < currentIdx;
          const current = !shipped && i === currentIdx;
          const last = i === PIPELINE.length - 1;
          return (
            <li key={station} className="relative flex gap-3 pb-4 last:pb-0">
              {!last && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-5 bottom-0.5 left-[6.5px] w-px",
                    done ? "bg-success/40" : "bg-line-subtle",
                  )}
                />
              )}
              <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center">
                {done ? (
                  <StatusMark status="done" />
                ) : current && running ? (
                  <StatusMark status="running" />
                ) : current ? (
                  <span
                    role="img"
                    aria-label="Current stage"
                    className="size-3 rounded-full border-2 border-accent bg-accent-bg"
                  />
                ) : (
                  <StatusMark status="pending" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-xs",
                    current ? "font-semibold text-fg" : done ? "text-fg-muted" : "text-fg-subtle",
                  )}
                >
                  {meta.kind === "gate" ? meta.full : meta.label}
                </p>
                {agent && (
                  <p className="mt-0.5 text-2xs text-fg-subtle">
                    {agent.name}, {agent.title.toLowerCase()} · {agent.output}
                  </p>
                )}
              </div>
              {meta.agent && documentFor.has(meta.agent) && (
                <button
                  type="button"
                  onClick={() => onOpen(meta.agent!)}
                  className="hit-area flex shrink-0 items-center gap-1 self-start rounded-sm px-1.5 py-0.5 text-2xs font-medium text-accent-text transition-colors hover:bg-accent-bg"
                >
                  Open
                  <ArrowSquareOutIcon className="size-3" />
                </button>
              )}
            </li>
          );
        })}
      </ol>

      {next && (
        <section
          aria-labelledby="progress-next"
          className="mt-5 rounded-md border border-line-subtle bg-surface p-3"
        >
          <h3
            id="progress-next"
            className="text-2xs font-semibold tracking-wide text-fg-subtle uppercase"
          >
            What happens next
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{next}</p>
        </section>
      )}

      {decisions.length > 0 && (
        <section aria-labelledby="progress-activity" className="mt-5">
          <h3
            id="progress-activity"
            className="text-2xs font-semibold tracking-wide text-fg-subtle uppercase"
          >
            Activity
          </h3>
          <ol className="mt-2.5 flex flex-col gap-3">
            {[...decisions].reverse().map((d) => (
              <li key={`${d.station}-${d.decided_at}`} className="flex gap-2.5">
                {d.approved ? (
                  <SealCheckIcon weight="fill" className="mt-0.5 size-3.5 shrink-0 text-success" />
                ) : (
                  <ArrowUUpLeftIcon className="mt-0.5 size-3.5 shrink-0 text-warning" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-fg">
                    <span className="font-medium">{STATION_META[d.station].label}</span>{" "}
                    {d.approved ? "approved" : "sent back"} by{" "}
                    <span title={d.signer}>{personName(d.signer)}</span>
                  </p>
                  <p className="tabular mt-0.5 text-2xs text-fg-subtle" title={new Date(d.decided_at).toLocaleString()}>
                    {timeAgo(d.decided_at)}
                  </p>
                  {d.comment && (
                    <p className="mt-1 border-l-2 border-line pl-2 text-2xs leading-relaxed text-fg-muted italic">
                      {d.comment}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
