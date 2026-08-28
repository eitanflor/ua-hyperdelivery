import { useEffect, useState } from "react";
import { ArrowUUpLeftIcon, LockSimpleIcon, SealCheckIcon, WarningIcon } from "@phosphor-icons/react";
import type { Artifact, Project } from "../../api/types";
import { completeness, list, type GateCriterion } from "../../api/artifacts";
import { AGENT_META, STATION_META } from "../../lib/pipeline";
import { useProjectsStore } from "../../store/useProjectsStore";
import { useCurrentUser } from "../../auth/useCurrentUser";
import { Button } from "../ui/Button";
import { TextArea } from "../ui/Field";
import { cn } from "../../lib/cn";

function Countdown({ deadline }: { deadline: number }) {
  const [left, setLeft] = useState(() => Math.max(0, deadline - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, deadline - Date.now())), 250);
    return () => clearInterval(id);
  }, [deadline]);
  return <span className="tabular">{Math.ceil(left / 1000)}s</span>;
}

/** The gate.
 *
 * The gates are the product, so this is the loudest, most deliberate surface in the
 * console. Deliberateness comes from construction rather than an "are you sure?" modal:
 * the criteria have to be acknowledged, the signer is the authenticated user rather
 * than a typed string, sending back requires a reason, and every decision is undoable
 * for a few seconds before it is dispatched.
 */
export function GateConsole({ project, artifacts }: { project: Project; artifacts: Artifact[] }) {
  const meta = STATION_META[project.station];
  const reviewingAgent = meta.reviewing ? AGENT_META[meta.reviewing] : undefined;
  const unlocksAgent = meta.unlocks ? AGENT_META[meta.unlocks] : undefined;
  const artifact = artifacts.find((a) => a.agent === meta.reviewing);

  const criteria = artifact ? list<GateCriterion>(artifact.content, "gate_criteria") : [];
  const gaps = artifact ? (completeness(artifact.content)?.gaps ?? []) : [];

  const user = useCurrentUser();
  const decide = useProjectsStore((s) => s.decide);
  const undoDecision = useProjectsStore((s) => s.undoDecision);
  const pending = useProjectsStore((s) => s.pendingDecision);

  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [sendingBack, setSendingBack] = useState(false);

  const isPendingHere = pending?.projectId === project.id && pending.station === project.station;

  if (isPendingHere) {
    const approved = pending.decision.approved;
    return (
      <div className="animate-rise rounded-md border border-accent-line bg-accent-bg px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <SealCheckIcon weight="fill" className="size-5 shrink-0 text-accent-text" />
          <p className="flex-1 text-xs text-fg">
            <span className="font-semibold">
              {approved ? "Signed." : "Sending back."}
            </span>{" "}
            {approved
              ? `Releasing to ${unlocksAgent?.name ?? "the next station"} in `
              : `Returning to ${reviewingAgent?.name ?? "the previous station"} in `}
            <Countdown deadline={pending.deadline} />.
          </p>
          <Button
            variant="secondary"
            size="sm"
            icon={<ArrowUUpLeftIcon className="size-3.5" />}
            onClick={undoDecision}
          >
            Undo
          </Button>
        </div>
      </div>
    );
  }

  const allAcknowledged = criteria.every((c) => acknowledged.includes(c.id));
  const canSign = user !== null && allAcknowledged;
  const canSendBack = user !== null && comment.trim().length > 0;

  const submit = (approved: boolean) => {
    if (!user) return;
    decide(project.id, project.station, {
      approved,
      signer: user.email,
      comment: comment.trim() || null,
    });
    setComment("");
    setAcknowledged([]);
    setSendingBack(false);
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
          <LockSimpleIcon weight="fill" className="mt-0.5 size-5 shrink-0 text-accent-text" />
          <div>
            <h2 className="stencil text-sm text-fg">{meta.full}</h2>
            <p className="mt-0.5 text-xs text-fg-muted">
              {reviewingAgent?.name} is done. {unlocksAgent?.name} starts when you sign.
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 py-4">
        {criteria.length > 0 && (
          <fieldset>
            <legend className="mb-2 text-2xs font-semibold tracking-wide text-fg-subtle uppercase">
              Confirm before signing
            </legend>
            <ul className="flex flex-col gap-1">
              {criteria.map((c) => {
                const on = acknowledged.includes(c.id);
                return (
                  <li key={c.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer gap-2.5 rounded-sm px-2 py-1.5 text-xs leading-relaxed transition-colors",
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
                        className="mt-0.5 size-3.5 shrink-0 accent-[var(--color-accent)]"
                      />
                      <span>
                        <code className="mr-1.5 font-mono text-2xs text-fg-subtle">{c.id}</code>
                        {c.description}
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
            {reviewingAgent?.name} did not publish gate criteria for this station. You are
            signing on the {reviewingAgent?.output.toLowerCase()} alone.
          </p>
        )}

        {gaps.length > 0 && (
          <div className="rounded-sm border border-warning/25 bg-warning-bg px-3 py-2">
            <p className="flex items-center gap-1.5 text-2xs font-semibold text-warning">
              <WarningIcon weight="fill" className="size-3.5" />
              {gaps.length} gap{gaps.length === 1 ? "" : "s"} still open
            </p>
            <ul className="mt-1 list-disc pl-4 text-2xs leading-relaxed text-warning">
              {gaps.map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
            </ul>
          </div>
        )}

        {user && (
          <p className="flex items-center gap-2 text-2xs text-fg-subtle">
            Signing as
            <span className="font-medium text-fg-muted">{user.name}</span>
            <span className="text-fg-subtle">· {user.email}</span>
          </p>
        )}

        <TextArea
          label={sendingBack ? "What needs to change?" : "Comment (optional)"}
          hint={
            sendingBack
              ? "Required. This goes back to the station, so be specific."
              : "Recorded against your signature."
          }
          rows={sendingBack ? 3 : 2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          {sendingBack ? (
            <>
              <Button variant="primary" disabled={!canSendBack} onClick={() => submit(false)}>
                Send back to {reviewingAgent?.name}
              </Button>
              <Button variant="ghost" onClick={() => setSendingBack(false)}>
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
                Sign and release to {unlocksAgent?.name}
              </Button>
              <Button variant="secondary" onClick={() => setSendingBack(true)}>
                Send back
              </Button>
            </>
          )}
        </div>

        {!allAcknowledged && !sendingBack && criteria.length > 0 && (
          <p className="text-2xs text-fg-subtle">
            Confirm all {criteria.length} criteria to sign. You can send it back without
            confirming them.
          </p>
        )}
      </div>
    </section>
  );
}
