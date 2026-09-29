import { useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  ArrowUUpLeftIcon,
  CheckIcon,
  LinkSimpleIcon,
  LockSimpleIcon,
  SealCheckIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import type { Artifact, Builds, Project } from "../../api/types";
import { completeness, list, type Coverage, type GateCriterion, type Requirement } from "../../api/artifacts";
import { AGENT_META, STATION_META } from "../../lib/pipeline";
import { documentStats, isWip } from "../../lib/documentStats";
import { displayName, initials } from "../../lib/people";
import { UNDO_MS, useProjectsStore } from "../../store/useProjectsStore";
import { useCurrentUser } from "../../auth/useCurrentUser";
import { AgentFace } from "../agents/AgentFace";
import { Artwork } from "../art/Artwork";
import { Button } from "../ui/Button";
import { TextArea } from "../ui/Field";
import { Spinner } from "../ui/Spinner";
import { Term } from "../ui/Term";
import { cn } from "../../lib/cn";

type Gate = "blueprint_approval" | "review_approval" | "showroom_approval";

/** What approving sets in motion, in plain words - the question approvers ask most. */
const NEXT: Record<Gate, string> = {
  blueprint_approval:
    "Coach turns these requirements into a build plan. You'll approve that plan at Gate 2.",
  review_approval:
    "Ref checks what gets built against the requirements and reports anything missing. You'll approve the build at Gate 3.",
  showroom_approval: "Approving merges the finished code, then Host prepares the demo.",
};

/** One-tap openings for a send-back note, so "what needs to change?" never starts blank. */
const SEND_BACK_STARTERS: Record<Gate, string[]> = {
  blueprint_approval: ["Missing a requirement", "Wrong scope", "Needs a data source", "Unclear wording"],
  review_approval: ["Missing a build task", "Wrong approach", "Too much at once", "Unclear wording"],
  showroom_approval: ["Doesn't meet a requirement", "Something is broken", "Missing a feature", "Needs another look"],
};

/** Under this many words a send-back note rarely gives the agent enough to act on. */
const SPECIFIC_WORDS = 4;

function Countdown({ deadline }: { deadline: number }) {
  const [left, setLeft] = useState(() => Math.max(0, deadline - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, deadline - Date.now())), 250);
    return () => clearInterval(id);
  }, [deadline]);
  return <span className="tabular">{Math.ceil(left / 1000)}s</span>;
}

/** The undo window as a bar that fills, started part-way if the card remounts mid-window.
 * Reduced motion fills it at once; the countdown beside it still carries the time. */
function UndoBar({ deadline }: { deadline: number }) {
  const [elapsed] = useState(() => UNDO_MS - Math.max(0, deadline - Date.now()));
  return (
    <div aria-hidden="true" className="h-1 bg-accent-line/60">
      <div
        className="h-full origin-left bg-accent"
        style={{ animation: `fill-x ${UNDO_MS}ms linear -${elapsed}ms forwards` }}
      />
    </div>
  );
}

/** Copies a link to this gate so someone else can approve it. Notifying them waits for
 * the notifications backend; until then the link is the whole hand-off. */
function RequestSignOff({ projectId }: { projectId: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const url = `${window.location.origin}/projects/${projectId}`;
  useEffect(() => {
    if (state !== "copied") return;
    const timer = setTimeout(() => setState("idle"), 2500);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <>
      <Button
        variant="ghost"
        icon={
          state === "copied" ? (
            <CheckIcon weight="bold" className="size-3.5" />
          ) : (
            <LinkSimpleIcon className="size-3.5" />
          )
        }
        onClick={() =>
          void navigator.clipboard.writeText(url).then(
            () => setState("copied"),
            () => setState("failed"),
          )
        }
        className="sm:ml-auto"
      >
        {state === "copied" ? "Link copied" : "Copy link for another approver"}
      </Button>
      <span className="sr-only" aria-live="polite">
        {state === "copied" ? "Link copied" : ""}
      </span>
      {state === "failed" && (
        <p className="w-full text-2xs text-fg-muted">
          Copy this link and send it to the approver: <span className="break-all text-fg">{url}</span>
        </p>
      )}
    </>
  );
}

/** The gate.
 *
 * The gates are the product, so this is the loudest, most deliberate surface in the
 * console. Deliberateness comes from construction rather than an "are you sure?" modal:
 * the criteria have to be acknowledged, the signer is the authenticated user rather
 * than a typed string, sending back requires a reason, and every decision is undoable
 * for a few seconds before it is dispatched. Top to bottom it answers what you are
 * approving, what must be true, what is still missing and what happens next
 * (docs/design/patterns/approval-cards.md).
 */
export function GateConsole({
  project,
  artifacts,
  builds,
  onViewArtifact,
}: {
  project: Project;
  artifacts: Artifact[];
  builds?: Builds;
  onViewArtifact: (agent: string) => void;
}) {
  const meta = STATION_META[project.station];
  const gate = project.station as Gate;
  const reviewingAgent = meta.reviewing ? AGENT_META[meta.reviewing] : undefined;
  const unlocksAgent = meta.unlocks ? AGENT_META[meta.unlocks] : undefined;
  const artifact = artifacts.find((a) => a.agent === meta.reviewing);

  const criteria = artifact ? list<GateCriterion>(artifact.content, "gate_criteria") : [];
  const gaps = artifact ? (completeness(artifact.content)?.gaps ?? []) : [];
  const stats = artifact ? documentStats(artifact.agent, artifact.content, builds) : [];
  const openWipBuilds = (builds?.builds ?? []).filter(isWip);
  const coverage = meta.reviewing === "review" && artifact ? list<Coverage>(artifact.content, "coverage") : [];
  const unmet = coverage.filter((c) => !c.met);
  const requirementText = new Map(
    list<Requirement>(artifacts.find((a) => a.agent === "distill")?.content ?? {}, "requirements").map((r) => [
      r.id,
      r.description,
    ]),
  );

  const user = useCurrentUser();
  const decide = useProjectsStore((s) => s.decide);
  const undoDecision = useProjectsStore((s) => s.undoDecision);
  const pending = useProjectsStore((s) => s.pendingDecision);
  const showIds = useProjectsStore((s) => s.viewMode === "developer");

  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [sendingBack, setSendingBack] = useState(false);
  const [nudged, setNudged] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);

  const isPendingHere = pending?.projectId === project.id && pending.station === project.station;

  if (isPendingHere) {
    const approved = pending.decision.approved;
    const destination = approved ? unlocksAgent : reviewingAgent;
    const name = destination?.name ?? (approved ? "the next stage" : "the previous stage");
    return (
      <div className="animate-rise overflow-hidden rounded-md border border-accent-line bg-accent-bg">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          {pending.committing ? (
            <Spinner className="size-5 shrink-0 text-accent-text" />
          ) : destination ? (
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full",
                destination.bg,
                destination.fg,
              )}
            >
              <AgentFace agent={destination.face} state="working" className="size-4.5" />
            </span>
          ) : (
            <SealCheckIcon weight="fill" className="size-5 shrink-0 text-accent-text" />
          )}
          <p className="flex-1 text-sm text-fg">
            <span className="font-semibold">{approved ? "Approved." : "Sending back."}</span>{" "}
            {approved ? `Handing to ${name}` : `Returning to ${name} with your notes`}
            {pending.committing ? (
              "…"
            ) : (
              <>
                {" in "}
                <Countdown deadline={pending.deadline} />.
              </>
            )}
          </p>
          {!pending.committing && (
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowUUpLeftIcon className="size-3.5" />}
              onClick={undoDecision}
            >
              Undo
            </Button>
          )}
        </div>
        {!pending.committing && <UndoBar key={pending.deadline} deadline={pending.deadline} />}
      </div>
    );
  }

  const allAcknowledged = criteria.every((c) => acknowledged.includes(c.id));
  const buildsLoaded = project.station !== "showroom_approval" || builds !== undefined;
  const canSign = user !== null && allAcknowledged && buildsLoaded && openWipBuilds.length === 0;
  const canSendBack = user !== null && comment.trim().length > 0;
  const words = comment.trim().split(/\s+/).filter(Boolean).length;
  const tooShort = words < SPECIFIC_WORDS;
  const remaining = criteria.length - criteria.filter((c) => acknowledged.includes(c.id)).length;

  const submit = (approved: boolean) => {
    if (!user) return;
    decide(project.id, project.station, { approved, comment: comment.trim() || null }, user.email);
    setComment("");
    setAcknowledged([]);
    setSendingBack(false);
    setNudged(false);
  };

  // a short note gets one nudge for specifics; the second press sends it as written
  const sendBack = () => {
    if (tooShort && !nudged) {
      setNudged(true);
      return;
    }
    submit(false);
  };

  const startNote = (starter: string) => {
    setComment((prev) => (prev.trim() ? `${starter}: ${prev.trim()}` : `${starter}: `));
    const field = noteRef.current?.querySelector("textarea");
    field?.focus();
    requestAnimationFrame(() => field?.setSelectionRange(field.value.length, field.value.length));
  };

  return (
    <section
      aria-label={meta.full}
      className="animate-rise overflow-hidden rounded-md border border-accent-line bg-surface"
    >
      <header className="border-b border-accent-line bg-accent-bg">
        {/* the one place the factory's hazard stripe is earned: work stops here until a
            person signs */}
        <div className="hazard h-1 opacity-70" aria-hidden="true" />
        <div className="flex items-start gap-3 px-4 py-3">
          <Artwork
            id="a3-gate"
            fallback={<LockSimpleIcon weight="fill" className="mt-0.5 size-5 shrink-0 text-accent-text" />}
            className="h-8 w-12 shrink-0 object-contain"
          />
          <div className="min-w-0 flex-1">
            <h2 className="stencil text-sm text-fg">
              <Term term="Gate">{meta.full}</Term>
            </h2>
            <p className="mt-0.5 text-sm text-fg-muted">
              {reviewingAgent?.name} is done. {unlocksAgent?.name} starts when you approve.
            </p>
          </div>
          {reviewingAgent && unlocksAgent && (
            <div aria-hidden="true" className="hidden shrink-0 items-center gap-1.5 sm:flex">
              <span className={cn("flex size-7 items-center justify-center rounded-full", reviewingAgent.bg, reviewingAgent.fg)}>
                <AgentFace agent={reviewingAgent.face} state="done" className="size-4.5" />
              </span>
              <span className="stencil px-1 text-2xs text-accent-text">Your call</span>
              <ArrowRightIcon className="size-3 text-fg-subtle" />
              <span className={cn("flex size-7 items-center justify-center rounded-full", unlocksAgent.bg, unlocksAgent.fg)}>
                <AgentFace agent={unlocksAgent.face} className="size-4.5" />
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-5 px-4 py-4">
        {stats.length > 0 && meta.reviewing && (
          <section aria-labelledby={`${project.id}-approving`}>
            <div className="mb-2 flex items-center gap-3">
              <h3
                id={`${project.id}-approving`}
                className="text-2xs font-semibold tracking-wide text-fg-subtle uppercase"
              >
                What you're approving
              </h3>
              <button
                type="button"
                onClick={() => onViewArtifact(meta.reviewing!)}
                className="ml-auto flex items-center gap-1 text-2xs font-medium text-accent-text hover:underline"
              >
                Open the {reviewingAgent?.output.toLowerCase() ?? "document"}
                <ArrowRightIcon className="size-3" />
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col-reverse rounded-sm border border-line-subtle bg-canvas px-3 py-2"
                >
                  <dt className="text-2xs text-fg-muted">{stat.label}</dt>
                  <dd
                    className={cn(
                      "tabular text-lg font-semibold",
                      stat.tone === "danger" ? "text-danger" : stat.tone === "warning" ? "text-warning" : "text-fg",
                    )}
                  >
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {criteria.length > 0 && (
          <fieldset>
            <legend className="mb-2 flex w-full items-center text-2xs font-semibold tracking-wide text-fg-subtle uppercase">
              Confirm before signing
              <span className="tabular ml-auto font-normal tracking-normal normal-case">
                {criteria.length - remaining} of {criteria.length} confirmed
              </span>
            </legend>
            <ul className="flex flex-col gap-1">
              {criteria.map((c) => {
                const on = acknowledged.includes(c.id);
                return (
                  <li key={c.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer gap-2.5 rounded-sm px-2 py-1.5 text-sm leading-relaxed transition-colors",
                        on ? "text-fg" : "text-fg-muted hover:bg-sunken",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() =>
                          setAcknowledged((prev) =>
                            prev.includes(c.id)
                              ? prev.filter((id) => id !== c.id)
                              : [...prev, c.id],
                          )
                        }
                        className="mt-1 size-3.5 shrink-0 accent-[var(--color-accent)]"
                      />
                      <span>
                        {c.description}
                        {showIds && (
                          <code className="ml-1.5 font-mono text-2xs text-fg-subtle">{c.id}</code>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        )}

        {criteria.length === 0 && (
          <p className="rounded-sm border border-line-subtle bg-sunken px-3 py-2 text-2xs text-fg-muted">
            {reviewingAgent?.name} did not publish gate criteria for this stage. You are
            approving the {reviewingAgent?.output.toLowerCase()} on its own.
          </p>
        )}

        {unmet.length > 0 && (
          <div role="note" className="rounded-sm border border-danger/25 bg-danger-bg px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-danger">
              <WarningIcon weight="fill" className="size-3.5" />
              {unmet.length === coverage.length
                ? `None of the ${coverage.length} requirements are met yet`
                : `${unmet.length} of ${coverage.length} requirements are not met yet`}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">
              Approving hands the build to {unlocksAgent?.name ?? "the next stage"} as it stands, and
              the project ships with these open. To have them finished first, send it back.
            </p>
            <ul className="mt-1.5 flex flex-col gap-0.5">
              {unmet.slice(0, 5).map((c) => (
                <li key={c.requirement_id} className="flex gap-2 text-xs leading-relaxed text-fg">
                  <code className="tabular shrink-0 font-mono text-2xs text-fg-subtle">{c.requirement_id}</code>
                  <span className="line-clamp-1">{requirementText.get(c.requirement_id) ?? ""}</span>
                </li>
              ))}
              {unmet.length > 5 && (
                <li className="text-2xs text-fg-subtle">and {unmet.length - 5} more in the quality report</li>
              )}
            </ul>
          </div>
        )}

        {gaps.length > 0 && (
          <div className="rounded-sm border border-warning/25 bg-warning-bg px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-warning">
              <WarningIcon weight="fill" className="size-3.5" />
              Still missing
            </p>
            <ul className="mt-1 list-disc pl-5 text-xs leading-relaxed text-warning">
              {gaps.map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
            </ul>
          </div>
        )}

        {gate in NEXT && (
          <p className="text-xs leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">What happens next.</span> {NEXT[gate]}
          </p>
        )}

        {user && (
          <p className="flex items-center gap-2 text-2xs text-fg-subtle">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-2xs font-semibold text-fg-on-accent"
            >
              {initials(user.name)}
            </span>
            {sendingBack ? "Sending back as" : "Approving as"}
            <span className="font-medium text-fg-muted" title={user.email}>
              {displayName(user.name)}
            </span>
            {showIds && <span>· {user.email}</span>}
          </p>
        )}

        <div ref={noteRef} className="flex flex-col gap-2">
          {sendingBack && (
            <div role="group" aria-label="Start your note with" className="flex flex-wrap gap-1.5">
              {SEND_BACK_STARTERS[gate].map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => startNote(starter)}
                  className="rounded-full border border-line px-2.5 py-1 text-2xs text-fg-muted transition-colors hover:border-accent hover:text-fg"
                >
                  {starter}
                </button>
              ))}
            </div>
          )}
          <TextArea
            label={sendingBack ? "What needs to change?" : "Comment (optional)"}
            hint={
              sendingBack
                ? `Required. ${reviewingAgent?.name ?? "The crew"} works from this, so be specific.`
                : "Recorded with your approval."
            }
            rows={sendingBack ? 3 : 2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {sendingBack && nudged && tooShort && (
            <p role="status" className="text-xs text-warning">
              That is quite short. {reviewingAgent?.name ?? "The crew"} has only this note to go
              on - which part, and what should change? Or send it as written.
            </p>
          )}
        </div>

        {sendingBack && reviewingAgent && (
          <p className="flex items-center gap-2 text-xs text-fg-muted">
            <AgentFace agent={reviewingAgent.face} className={cn("size-4", reviewingAgent.fg)} />
            Returning to {reviewingAgent.name} with your notes.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {sendingBack ? (
            <>
              <Button variant="primary" disabled={!canSendBack} onClick={sendBack}>
                {nudged && tooShort ? "Send anyway" : `Send back to ${reviewingAgent?.name}`}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSendingBack(false);
                  setNudged(false);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                icon={<SealCheckIcon weight="fill" className="size-4" />}
                disabled={!canSign}
                onClick={() => submit(true)}
              >
                Approve and hand to {unlocksAgent?.name}
              </Button>
              <Button variant="secondary" onClick={() => setSendingBack(true)}>
                Send back
              </Button>
              <RequestSignOff projectId={project.id} />
            </>
          )}
        </div>

        {openWipBuilds.length > 0 && !sendingBack && (
          <p className="text-2xs text-fg-subtle">
            Copilot is still working on{" "}
            {openWipBuilds.length === 1 ? "1 build" : `${openWipBuilds.length} builds`}. Wait for
            it to finish before approving. You can send it back without waiting.
          </p>
        )}

        {remaining > 0 && !sendingBack && (
          <p className="text-2xs text-fg-subtle">
            Confirm the {remaining === 1 ? "last criterion" : `${remaining} remaining criteria`} to
            approve. You can send it back without confirming them.
          </p>
        )}
      </div>
    </section>
  );
}
