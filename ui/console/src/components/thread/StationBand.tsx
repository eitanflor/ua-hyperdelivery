import { SealCheckIcon } from "@phosphor-icons/react";
import type { Station } from "../../api/types";
import { AGENT_META, STATION_META } from "../../lib/pipeline";
import { AgentFace } from "../agents/AgentFace";
import type { Signature } from "../../store/useProjectsStore";

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

/** A cleared gate.
 *
 * This used to be the quietest row in the app - 12px muted text and a glyph - marking
 * the single most consequential event in the product. It is now the strongest rule in
 * the thread, and it carries the signature when this browser is the one that signed.
 * The durable, cross-user trail needs the decisions read endpoint (docs/console-redesign.md). */
export function SignedCheckpoint({
  station,
  signature,
}: {
  station: Station;
  signature?: Signature;
}) {
  const meta = STATION_META[station];
  const rejected = signature?.approved === false;

  return (
    <div className="animate-rise py-1">
      <div className="flex items-center gap-3 rounded-md border border-success/25 bg-success-bg px-3.5 py-2.5">
        <SealCheckIcon weight="fill" className="size-5 shrink-0 text-success" />
        <div className="min-w-0 flex-1">
          <p className="stencil text-xs text-fg">
            {meta.full} · {rejected ? "sent back" : "cleared"}
          </p>
          <p className="tabular mt-0.5 text-2xs text-fg-muted">
            {signature
              ? `${rejected ? "Returned" : "Signed"} by ${signature.signer} · ${new Date(
                  signature.at,
                ).toLocaleString()}`
              : "Signed before this session"}
          </p>
          {signature?.comment && (
            <p className="mt-1.5 border-l-2 border-success/30 pl-2 text-2xs leading-relaxed text-fg-muted italic">
              {signature.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
