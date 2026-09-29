import { useState } from "react";
import { motion } from "motion/react";
import { SealCheckIcon } from "@phosphor-icons/react";
import type { Decision, Station } from "../../api/types";
import { AGENT_META, STATION_META } from "../../lib/pipeline";
import { personName } from "../../lib/people";
import { AgentFace } from "../agents/AgentFace";
import { Handoff } from "../moments/Handoff";
import type { Signature } from "../../store/useProjectsStore";

// A signature this recent was made in this tab moments ago, so the stub arrives stamped
// and the handoff plays; anything older is history and just sits there.
const FRESH_MS = 20_000;

/** Chapter marker. Turns the thread into a line log instead of undifferentiated chat,
 * and gives Station one canonical full-width form. */
export function StationBand({ station }: { station: Station }) {
  const meta = STATION_META[station];
  const agent = meta.agent ? AGENT_META[meta.agent] : undefined;

  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="flex items-center gap-2">
        {agent && <AgentFace agent={agent.face} className={`size-4.5 ${agent.fg}`} />}
        {agent && (
          <span className="tabular font-mono text-2xs text-fg-subtle">{agent.number}</span>
        )}
        <span className="stencil text-2xs tracking-wide text-fg-muted">{meta.label}</span>
      </span>
      <span className="h-px flex-1 bg-line-subtle" />
    </div>
  );
}

/** A cleared gate, as a ticket stub.
 *
 * The single most consequential event in the product, so it is the strongest rule in the
 * thread. It reads the server's decision trail, so it names the signer in any browser; the
 * local echo only fills in until that trail has loaded. */
export function SignedCheckpoint({
  station,
  decision,
  signature,
}: {
  station: Station;
  decision?: Decision;
  signature?: Signature;
}) {
  const meta = STATION_META[station];
  const reviewed = meta.reviewing ? AGENT_META[meta.reviewing]?.output : undefined;
  const record = decision
    ? { signer: decision.signer, approved: decision.approved, comment: decision.comment, at: decision.decided_at }
    : signature;
  const rejected = record?.approved === false;
  const at = record ? new Date(record.at) : null;
  const [fresh] = useState(
    () => signature?.approved === true && Date.now() - new Date(signature.at).getTime() < FRESH_MS,
  );

  return (
    <div className="animate-rise py-1">
      <motion.div
        initial={fresh ? { scale: 1.035, rotate: -0.8, opacity: 0 } : false}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 28 }}
        className="relative flex overflow-hidden rounded-md border border-success/25 bg-success-bg"
      >
        <div className="flex min-w-0 flex-1 items-start gap-3 px-3.5 py-2.5">
          <SealCheckIcon weight="fill" className="mt-0.5 size-5 shrink-0 text-success" />
          <div className="min-w-0 flex-1">
            <p className="stencil text-xs text-fg">
              {meta.label} · {reviewed ? `${reviewed} ` : ""}
              {rejected ? "sent back" : "approved"}
            </p>
            <p className="tabular mt-0.5 truncate text-2xs text-fg-muted" title={record?.signer}>
              {record && at
                ? `${rejected ? "Returned" : "Signed"} by ${personName(record.signer)} · ${at.toLocaleString()}`
                : "Signed before this session"}
            </p>
            {record?.comment && (
              <p className="mt-1.5 border-l-2 border-success/30 pl-2 text-2xs leading-relaxed text-fg-muted italic">
                {record.comment}
              </p>
            )}
          </div>
        </div>
        {/* the perforation: a dashed rule with a notch punched top and bottom */}
        <div aria-hidden="true" className="relative w-0 border-l border-dashed border-success/40">
          <span className="absolute -top-px left-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-success/25 bg-canvas" />
          <span className="absolute -bottom-px left-0 size-3 -translate-x-1/2 translate-y-1/2 rounded-full border border-success/25 bg-canvas" />
        </div>
        <div className="flex w-20 shrink-0 flex-col items-center justify-center px-2 py-2.5 text-center">
          <motion.span
            initial={fresh ? { scale: 1.8, opacity: 0, rotate: -8 } : false}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 600, damping: 22, delay: 0.12 }}
            className="stencil text-2xs text-success"
          >
            {rejected ? "Returned" : "Signed"}
          </motion.span>
          {at && (
            <span className="tabular mt-0.5 text-2xs text-fg-muted">
              {at.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </motion.div>
      {fresh && meta.reviewing && meta.unlocks && <Handoff from={meta.reviewing} to={meta.unlocks} />}
    </div>
  );
}
