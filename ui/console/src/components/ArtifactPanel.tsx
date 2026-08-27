import { useState } from "react";
import type { Artifact } from "../api/types";
import { AGENT_META } from "../lib/pipeline";
import { artifactTitle, humanizeKey, renderListItem } from "../lib/formatArtifact";

function CompletenessBar({ score, gaps }: { score?: number; gaps?: string[] }) {
  if (score === undefined) return null;
  const pct = Math.round(score * 100);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold tracking-wide text-ua-steel uppercase">Completeness</span>
        <span className="font-semibold text-ua-black">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ua-mist">
        <div
          className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-ua-red"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {gaps && gaps.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {gaps.map((gap) => (
            <li
              key={gap}
              className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200"
            >
              Missing: {gap}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FieldBlock({ label, value }: { label: string; value: unknown }) {
  if (typeof value === "string" && value.length > 0) {
    return (
      <div>
        <h3 className="mb-1 text-xs font-semibold tracking-wide text-ua-steel uppercase">{label}</h3>
        <p className="text-sm leading-relaxed text-ua-black">{value}</p>
      </div>
    );
  }
  if (Array.isArray(value) && value.length > 0) {
    return (
      <div>
        <h3 className="mb-2 text-xs font-semibold tracking-wide text-ua-steel uppercase">{label}</h3>
        <ul className="flex flex-col gap-1.5">
          {value.map((item, i) => (
            <li
              key={i}
              className="rounded-lg border border-black/5 bg-ua-cloud/50 px-3 py-2 text-sm leading-relaxed text-ua-black"
            >
              {renderListItem(item)}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
}

function ArtifactBody({ content }: { content: Record<string, unknown> }) {
  const completeness = content.completeness as { score?: number; gaps?: string[] } | undefined;
  const rest = Object.entries(content).filter(([key]) => key !== "title" && key !== "completeness");

  return (
    <div className="flex flex-col gap-5">
      <CompletenessBar score={completeness?.score} gaps={completeness?.gaps} />
      {rest.map(([key, value]) => (
        <FieldBlock key={key} label={humanizeKey(key)} value={value} />
      ))}
    </div>
  );
}

export function ArtifactPanel({
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
  const [rawView, setRawView] = useState(false);
  const selected = artifacts.find((a) => a.agent === selectedAgent) ?? null;

  return (
    <aside className="animate-fade-in-up flex w-96 shrink-0 flex-col border-l border-black/5 bg-ua-cloud/30">
      <div className="flex items-center justify-between border-b border-black/5 p-4">
        <h2 className="text-xs font-semibold tracking-wide text-ua-steel uppercase">Artifacts</h2>
        <button
          className="flex h-6 w-6 items-center justify-center rounded-md text-ua-steel transition-colors hover:bg-black/5 hover:text-ua-black"
          onClick={onClose}
          aria-label="Close artifacts panel"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {artifacts.length === 0 ? (
        <p className="p-5 text-sm text-ua-steel">
          Artifacts will appear here as Distill, Blueprint, Review, and Showroom finish their work.
        </p>
      ) : (
        <>
          <div className="flex gap-1 overflow-x-auto border-b border-black/5 p-3">
            {artifacts.map((a) => {
              const meta = AGENT_META[a.agent];
              return (
                <button
                  key={a.agent}
                  className={
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors " +
                    (a.agent === selectedAgent
                      ? "bg-ua-black text-white"
                      : "text-ua-steel hover:bg-black/5 hover:text-ua-black")
                  }
                  onClick={() => onSelectAgent(a.agent)}
                >
                  {meta?.label ?? a.agent}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="flex-1 overflow-y-auto p-5">
              <h2 className="text-base font-semibold text-ua-black">{artifactTitle(selected)}</h2>
              <p className="mt-0.5 mb-4 text-xs text-ua-steel">
                {new Date(selected.created_at).toLocaleString()}
              </p>

              {rawView ? (
                <pre className="animate-fade-in-up max-h-[65vh] overflow-auto rounded-lg bg-ua-black p-3 text-xs whitespace-pre-wrap text-ua-fog">
                  {JSON.stringify(selected.content, null, 2)}
                </pre>
              ) : (
                <ArtifactBody content={selected.content} />
              )}

              <button
                className="mt-4 flex items-center gap-1 text-xs font-medium text-ua-steel transition-colors hover:text-ua-black"
                onClick={() => setRawView((v) => !v)}
              >
                {rawView ? "Show formatted view" : "View raw JSON"}
              </button>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
