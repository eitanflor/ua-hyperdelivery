import { useState } from "react";
import { CheckCircleIcon, CircleDashedIcon, MinusCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import type { Artifact } from "../../api/types";
import {
  list,
  type Coverage,
  type Finding,
  type Requirement,
  type TalkTrackSection,
  type UnitOfWork,
} from "../../api/artifacts";
import { AGENT_META } from "../../lib/pipeline";
import { cn } from "../../lib/cn";

type Mark = "yes" | "no" | "gap" | "pending";

const ICON: Record<Mark, React.ReactNode> = {
  yes: <CheckCircleIcon weight="fill" className="size-3.5 shrink-0 text-success" />,
  gap: <XCircleIcon weight="fill" className="size-3.5 shrink-0 text-danger" />,
  no: <MinusCircleIcon className="size-3.5 shrink-0 text-fg-subtle" />,
  pending: <CircleDashedIcon className="size-3.5 shrink-0 text-fg-subtle" />,
};

function Step({ mark, label, title }: { mark: Mark; label: string; title?: string }) {
  return (
    <span
      title={title}
      className={cn(
        "flex min-w-0 items-center gap-1.5 rounded-sm px-2 py-1 text-2xs",
        mark === "gap" ? "bg-danger-bg text-danger" : mark === "yes" ? "bg-sunken text-fg" : "text-fg-subtle",
      )}
    >
      {ICON[mark]}
      <span className="truncate">{label}</span>
    </span>
  );
}

/** Every requirement followed across the line: planned by Coach, checked by Ref, shown by
 * Host. The analyst's question - "is everything we asked for actually covered?" - answered
 * without reading four documents. Gaps lead; a stage that has not run yet is pending, not a
 * gap. */
export function TraceView({ artifacts }: { artifacts: Artifact[] }) {
  const [onlyGaps, setOnlyGaps] = useState(false);
  const content = (agent: string) => artifacts.find((a) => a.agent === agent)?.content;
  const spec = content("distill");
  const plan = content("blueprint");
  const review = content("review");
  const demo = content("showroom");

  const requirements = spec ? list<Requirement>(spec, "requirements") : [];
  if (requirements.length === 0) {
    return (
      <div className="flex-1 p-4">
        <p className="text-sm leading-relaxed text-fg-muted">
          Tracing starts once {AGENT_META.distill?.name ?? "Scout"} has written the requirements brief.
        </p>
      </div>
    );
  }

  const units = plan ? list<UnitOfWork>(plan, "units_of_work") : [];
  const coverage = new Map((review ? list<Coverage>(review, "coverage") : []).map((c) => [c.requirement_id, c.met]));
  const findings = review ? list<Finding>(review, "findings") : [];
  const walkthrough = demo ? list<TalkTrackSection>(demo, "talk_track") : [];

  const rows = requirements.map((r) => {
    const tasks = units.filter((u) => (u.requirement_ids ?? []).includes(r.id));
    const met = coverage.get(r.id);
    const step = walkthrough.findIndex((s) => s.requirement_id === r.id);
    const issues = findings.filter((f) => f.requirement_id === r.id);
    const planned: Mark = !plan ? "pending" : tasks.length > 0 ? "yes" : "gap";
    const checked: Mark = !review ? "pending" : met === true ? "yes" : met === false ? "gap" : "no";
    const shown: Mark = !demo ? "pending" : step >= 0 ? "yes" : "no";
    return { r, tasks, issues, step, planned, checked, shown, gap: planned === "gap" || checked === "gap" };
  });
  const gaps = rows.filter((row) => row.gap).length;
  const shownRows = onlyGaps ? rows.filter((row) => row.gap) : [...rows].sort((a, b) => Number(b.gap) - Number(a.gap));

  const summary = [
    `${requirements.length} requirements`,
    ...(plan ? [`${rows.filter((x) => x.planned === "yes").length} planned`] : []),
    ...(review ? [`${rows.filter((x) => x.checked === "yes").length} met`] : []),
    ...(demo ? [`${rows.filter((x) => x.shown === "yes").length} in the demo`] : []),
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <p className="text-sm font-medium text-fg">
        {gaps === 0 ? "Everything asked for is covered so far." : `${gaps} requirement${gaps === 1 ? " has" : "s have"} a gap.`}
      </p>
      <p className="tabular mt-0.5 text-2xs text-fg-subtle">{summary.join(" · ")}</p>

      {gaps > 0 && (
        <div role="radiogroup" aria-label="Show requirements" className="mt-3 flex gap-1.5">
          {(
            [
              [false, `All ${rows.length}`],
              [true, `Gaps ${gaps}`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={onlyGaps === value}
              onClick={() => setOnlyGaps(value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors",
                onlyGaps === value
                  ? "border-fg bg-fg text-canvas"
                  : "border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <ul className="mt-3 flex flex-col gap-2">
        {shownRows.map(({ r, tasks, issues, step, planned, checked, shown, gap }) => (
          <li
            key={r.id}
            className={cn(
              "rounded-md border bg-surface px-3 py-2.5",
              gap ? "border-danger/40" : "border-line-subtle",
            )}
          >
            <p className="flex gap-2 text-xs leading-relaxed text-fg">
              <code className="tabular mt-px shrink-0 font-mono text-2xs text-fg-subtle">{r.id}</code>
              {r.description}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1">
              <Step
                mark={planned}
                label={
                  planned === "pending" ? "Not planned yet" : tasks.length > 0 ? `${tasks.length} build task${tasks.length === 1 ? "" : "s"}` : "Not planned"
                }
                title={tasks.map((t) => t.title).join("\n") || undefined}
              />
              <Step
                mark={checked}
                label={
                  checked === "pending"
                    ? "Not checked yet"
                    : checked === "yes"
                      ? "Met"
                      : checked === "gap"
                        ? `Not met${issues.length > 0 ? ` · ${issues.length}` : ""}`
                        : "Not checked"
                }
                title={issues.map((f) => f.description).join("\n") || undefined}
              />
              <Step
                mark={shown}
                label={shown === "pending" ? "No demo yet" : step >= 0 ? `Demo step ${step + 1}` : "Not in demo"}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
