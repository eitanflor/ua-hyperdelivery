import { useMemo } from "react";
import { AGENT_META } from "../../lib/pipeline";
import { parsePartialJson } from "../../lib/partialJson";
import { StatusMark, type Status } from "../ui/StatusMark";

/** The sections worth naming while each document is written, in the order the model
 * writes them (its output schema's field order, see src/core/domain/). Titles match the
 * finished document's views so the outline and the result read as the same thing. */
const SECTIONS: Record<string, { key: string; title: string }[]> = {
  distill: [
    { key: "requirements", title: "Requirements" },
    { key: "open_questions", title: "Open questions" },
    { key: "acceptance_criteria", title: "Acceptance criteria" },
    { key: "business_value", title: "Business value" },
  ],
  blueprint: [
    { key: "architecture_summary", title: "Architecture" },
    { key: "components", title: "Components" },
    { key: "integration_points", title: "Integration points" },
    { key: "units_of_work", title: "Build tasks" },
  ],
  review: [
    { key: "findings", title: "Findings" },
    { key: "coverage", title: "Requirement coverage" },
    { key: "assignments", title: "Copilot assignments" },
  ],
  showroom: [
    { key: "summary", title: "Summary" },
    { key: "demo_data", title: "Seed data" },
    { key: "talk_track", title: "Talk track" },
  ],
};

/** Simple mode's view of a document being written: its outline filling in, section by
 * section, instead of raw JSON or a single "writing" line.
 *
 * Which section is current is read from where its key last appears in the raw text - the
 * parsed object says what exists, not what is still being added to. Hidden from assistive
 * tech for the same reason the JSON is: the working line already announces the write. */
export function DocumentSkeleton({ agent, draft }: { agent: string; draft: string }) {
  const sections = SECTIONS[agent] ?? [];
  const parsed = useMemo(() => parsePartialJson(draft), [draft]);

  const positions = sections.map((s) => draft.lastIndexOf(`"${s.key}"`));
  const currentPos = Math.max(-1, ...positions);
  const title = typeof parsed?.title === "string" ? parsed.title : null;

  return (
    <div aria-hidden="true" className="mt-2.5 rounded-md border border-line-subtle bg-surface px-3.5 py-3">
      <p className="text-2xs font-medium tracking-wide text-fg-subtle uppercase">
        {AGENT_META[agent]?.output ?? "Document"}
      </p>
      <p className="mt-0.5 min-h-5 truncate text-sm font-medium text-fg">
        {title ?? <span className="inline-block h-2.5 w-1/2 animate-pulse rounded-full bg-sunken align-middle" />}
      </p>
      {sections.length > 0 && (
        <ul className="mt-2.5 flex flex-col gap-1.5">
          {sections.map((section, i) => {
            const pos = positions[i] ?? -1;
            const status: Status =
              pos === -1 ? "pending" : pos === currentPos ? "running" : "done";
            const value = parsed?.[section.key];
            return (
              <li key={section.key} className="flex items-center gap-2 text-xs">
                <StatusMark status={status} />
                <span className={status === "pending" ? "text-fg-subtle" : "text-fg-muted"}>
                  {section.title}
                </span>
                {Array.isArray(value) && value.length > 0 && (
                  <span className="tabular text-fg-subtle">{value.length}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
