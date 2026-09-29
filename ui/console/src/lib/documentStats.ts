import type { Build, Builds } from "../api/types";
import { completeness, list, type Coverage, type Finding } from "../api/artifacts";

export interface Stat {
  label: string;
  value: string;
  tone?: "warning" | "danger";
}

/** Copilot leaves "[WIP]" on the title until it is actually done; `draft` alone stays true
 * until merge regardless of progress (see BuildBoard's Status). */
export function isWip(build: Build): boolean {
  return build.state !== "merged" && build.state !== "closed" && /^\s*\[wip\]/i.test(build.title ?? "");
}

/** The real numbers behind a document - what an approver signs against and what the
 * document's cover leads with. Keyed by the agent that wrote it. */
export function documentStats(agent: string, content: Record<string, unknown>, builds?: Builds): Stat[] {
  const count = (key: string) => list<unknown>(content, key).length;
  switch (agent) {
    case "distill": {
      const score = completeness(content)?.score;
      const open = count("open_questions");
      return [
        { label: "requirements", value: String(count("requirements")) },
        ...(score !== undefined ? [{ label: "complete", value: `${Math.round(score * 100)}%` }] : []),
        {
          label: open === 1 ? "open question" : "open questions",
          value: String(open),
          tone: open > 0 ? ("warning" as const) : undefined,
        },
        { label: "sources cited", value: String(count("evidence")) },
      ];
    }
    case "blueprint":
      return [
        { label: "build tasks", value: String(count("units_of_work")) },
        { label: "components", value: String(count("components")) },
        { label: "integrations", value: String(count("integration_points")) },
        { label: "APIs", value: String(count("api_contracts")) },
      ];
    case "review": {
      const findings = list<Finding>(content, "findings");
      const blockers = findings.filter((f) => f.severity === "blocker").length;
      const coverage = list<Coverage>(content, "coverage");
      const all = builds?.builds ?? [];
      const ready = all.filter((b) => b.state !== "closed" && !isWip(b)).length;
      const met = coverage.filter((c) => c.met).length;
      return [
        {
          label: "must fix",
          value: String(blockers),
          tone: blockers > 0 ? ("danger" as const) : undefined,
        },
        { label: "other findings", value: String(findings.length - blockers) },
        {
          label: "requirements met",
          value: `${met}/${coverage.length}`,
          tone:
            met === coverage.length ? undefined : met === 0 ? ("danger" as const) : ("warning" as const),
        },
        ...(all.length > 0 ? [{ label: "builds ready", value: `${ready}/${all.length}` }] : []),
      ];
    }
    case "showroom":
      return [
        { label: "walkthrough steps", value: String(count("talk_track")) },
        { label: "sample data sets", value: String(count("demo_data")) },
      ];
    default:
      return [];
  }
}
