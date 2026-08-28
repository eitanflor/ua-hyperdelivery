import { useEffect, useState } from "react";
import { BracketsCurlyIcon, XIcon } from "@phosphor-icons/react";
import type { Artifact } from "../../api/types";
import { artifactKind, str } from "../../api/artifacts";
import { AGENT_META } from "../../lib/pipeline";
import { AgentFace } from "../agents/AgentFace";
import { IconButton } from "../ui/IconButton";
import { cn } from "../../lib/cn";
import { BlueprintView, DemoView, GenericView, ReviewView, SpecView } from "./views";

function Body({ artifact, raw }: { artifact: Artifact; raw: boolean }) {
  if (raw) return <GenericView content={artifact.content} />;
  switch (artifactKind(artifact.agent)) {
    case "spec":
      return <SpecView content={artifact.content} />;
    case "blueprint":
      return <BlueprintView content={artifact.content} />;
    case "review":
      return <ReviewView content={artifact.content} />;
    case "demo":
      return <DemoView content={artifact.content} />;
    default:
      return <GenericView content={artifact.content} />;
  }
}

/** The structured output of each station, rendered by a view that knows what it is
 * looking at. A spec, a plan, a gap report and a demo package are different documents
 * and no longer share one generic field walk. */
export function Inspector({
  artifacts,
  selectedAgent,
  onSelectAgent,
  onClose,
}: {
  artifacts: Artifact[];
  selectedAgent: string | null;
  onSelectAgent: (agent: string) => void;
  onClose: () => void;
}) {
  const [raw, setRaw] = useState(false);
  const selected = artifacts.find((a) => a.agent === selectedAgent) ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside
      aria-label="Artifacts"
      className="flex w-[22rem] shrink-0 flex-col border-l border-line-subtle bg-canvas 2xl:w-[26rem]"
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line-subtle px-3">
        <h2 className="text-2xs font-semibold tracking-wide text-fg-subtle uppercase">Artifacts</h2>
        <IconButton
          label="Close artifacts"
          size="sm"
          icon={<XIcon className="size-4" />}
          onClick={onClose}
          className="ml-auto"
        />
      </div>

      {artifacts.length === 0 ? (
        <p className="p-5 text-xs leading-relaxed text-fg-subtle">
          Each station hands its work over here as it finishes — the scouting report from
          Scout, the call sheet from Coach, the grade sheet from Ref, and the run of show
          from Host.
        </p>
      ) : (
        <>
          <div className="flex gap-1 overflow-x-auto border-b border-line-subtle p-2">
            {artifacts.map((a) => {
              const meta = AGENT_META[a.agent];
              const active = a.agent === selectedAgent;
              return (
                <button
                  key={a.agent}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectAgent(a.agent)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-2xs font-medium transition-colors",
                    active
                      ? cn(meta?.bg, meta?.fg)
                      : "text-fg-subtle hover:bg-sunken hover:text-fg-muted",
                  )}
                >
                  {meta && <AgentFace agent={meta.face} className="size-4" />}
                  {meta?.name ?? a.agent}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-sm font-semibold text-fg">
                {str(selected.content, "title") ?? AGENT_META[selected.agent]?.output ?? selected.agent}
              </h3>
              <p className="tabular mt-0.5 mb-4 text-2xs text-fg-subtle">
                {new Date(selected.created_at).toLocaleString()}
              </p>

              <Body artifact={selected} raw={raw} />

              <button
                type="button"
                onClick={() => setRaw((v) => !v)}
                className="mt-5 flex items-center gap-1.5 text-2xs text-fg-subtle transition-colors hover:text-fg-muted"
              >
                <BracketsCurlyIcon className="size-3.5" />
                {raw ? "Show formatted view" : "View raw JSON"}
              </button>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
