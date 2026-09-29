import { useEffect, useState } from "react";
import { MinusIcon, PlusIcon, TildeIcon } from "@phosphor-icons/react";
import { api } from "../../api/client";
import type { Artifact } from "../../api/types";
import { diffArtifact, type ChangeKind } from "../../lib/diffArtifact";
import { cn } from "../../lib/cn";
import { timeAgo } from "../../lib/time";

const MARK: Record<ChangeKind, { icon: React.ReactNode; tone: string; label: string }> = {
  added: { icon: <PlusIcon weight="bold" className="size-3" />, tone: "text-success bg-success-bg", label: "Added" },
  removed: { icon: <MinusIcon weight="bold" className="size-3" />, tone: "text-danger bg-danger-bg", label: "Removed" },
  changed: { icon: <TildeIcon weight="bold" className="size-3" />, tone: "text-warning bg-warning-bg", label: "Changed" },
};

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** What changed between two drafts of a document, as a table of added, removed and
 * reworded items (Beautiful UI Diff Table). Read-only: the crew revises; people compare. */
export function ChangesView({
  projectId,
  agent,
  since,
}: {
  projectId: string;
  agent: string;
  /** The version to compare against; the one before the latest when absent. */
  since?: number;
}) {
  const [versions, setVersions] = useState<Artifact[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [base, setBase] = useState<number | undefined>(since);

  useEffect(() => {
    let live = true;
    api.listArtifactVersions(projectId, agent).then(
      (result) => live && setVersions(result),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [projectId, agent]);

  if (failed) {
    return <p className="text-sm text-fg-muted">The earlier drafts could not be loaded. Try again in a moment.</p>;
  }
  if (!versions) {
    return (
      <div role="status" aria-label="Loading earlier drafts" className="space-y-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="block h-8 animate-pulse rounded-sm bg-sunken" />
        ))}
      </div>
    );
  }

  const latest = versions.at(-1);
  if (!latest || versions.length < 2) {
    return <p className="text-sm text-fg-muted">This is the first draft - there is nothing to compare it with yet.</p>;
  }
  const earlier = versions.slice(0, -1);
  const from = earlier.find((v) => v.version === base) ?? earlier.at(-1)!;
  const changes = diffArtifact(agent, from.content, latest.content);
  const count = (kind: ChangeKind) => changes.filter((c) => c.kind === kind).length;
  const sections = [...new Set(changes.map((c) => c.section))];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
        <label className="flex items-center gap-2">
          Compare version {latest.version} with
          <select
            value={from.version}
            onChange={(e) => setBase(Number(e.target.value))}
            className="h-7 rounded-sm border border-line bg-surface px-1.5 text-xs text-fg focus:border-accent focus:outline-none"
          >
            {earlier.map((v) => (
              <option key={v.version} value={v.version}>
                version {v.version} ({timeAgo(v.created_at)})
              </option>
            ))}
          </select>
        </label>
      </div>

      {changes.length === 0 ? (
        <p className="text-sm text-fg-muted">No differences in the parts of the document tracked here.</p>
      ) : (
        <>
          <p className="text-sm font-medium text-fg">
            {[
              count("added") && plural(count("added"), "addition"),
              count("removed") && plural(count("removed"), "removal"),
              count("changed") && plural(count("changed"), "change"),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {sections.map((section) => (
            <table key={section} className="w-full text-left text-xs">
              <caption className="mb-1.5 text-left text-2xs font-semibold tracking-wide text-fg-subtle uppercase">
                {section}
              </caption>
              <tbody className="divide-y divide-line-subtle border-y border-line-subtle">
                {changes
                  .filter((c) => c.section === section)
                  .map((change) => {
                    const mark = MARK[change.kind];
                    return (
                      <tr key={`${change.kind}-${change.id}`} className="align-top">
                        <td className="w-7 py-2">
                          <span
                            role="img"
                            aria-label={mark.label}
                            className={cn("flex size-5 items-center justify-center rounded-sm", mark.tone)}
                          >
                            {mark.icon}
                          </span>
                        </td>
                        <td className="py-2 leading-relaxed">
                          {change.kind === "removed" ? (
                            <span className="text-fg-subtle line-through">{change.before}</span>
                          ) : change.kind === "added" ? (
                            <span className="text-fg">{change.after}</span>
                          ) : change.before === change.after ? (
                            <>
                              <span className="text-fg">{change.after}</span>
                              <span className="ml-1.5 text-2xs text-fg-subtle">(details changed)</span>
                            </>
                          ) : (
                            <>
                              <span className="block text-fg-subtle line-through">{change.before}</span>
                              <span className="mt-0.5 block text-fg">{change.after}</span>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          ))}
        </>
      )}
    </div>
  );
}
