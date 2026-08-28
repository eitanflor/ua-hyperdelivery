import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/cn";
import {
  completeness,
  isSeverity,
  list,
  SEVERITY_ORDER,
  str,
  type Coverage,
  type DemoSeed,
  type EvidenceLink,
  type Finding,
  type GateCriterion,
  type MachineRule,
  type Requirement,
  type Severity,
  type TalkTrackSection,
  type UnitOfWork,
} from "../../api/artifacts";

type Content = Record<string, unknown>;

export function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line-subtle pt-4 first:border-0 first:pt-0">
      <h3 className="mb-2 flex items-baseline gap-1.5 text-2xs font-semibold tracking-wide text-fg-subtle uppercase">
        {title}
        {count !== undefined && <span className="tabular font-normal">{count}</span>}
      </h3>
      {children}
    </section>
  );
}

function Row({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2 py-1.5 text-xs leading-relaxed text-fg">
      {id && (
        <code className="tabular mt-px shrink-0 self-start rounded-sm bg-sunken px-1 py-0.5 font-mono text-2xs text-fg-muted">
          {id}
        </code>
      )}
      <span className="min-w-0">{children}</span>
    </li>
  );
}

export function CompletenessMeter({ content }: { content: Content }) {
  const score = completeness(content);
  if (!score) return null;
  const pct = Math.round(score.score * 100);
  const tone = pct === 100 ? "text-success" : pct >= 75 ? "text-warning" : "text-danger";
  const bar = pct === 100 ? "bg-success" : pct >= 75 ? "bg-warning" : "bg-danger";

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-2xs font-semibold tracking-wide text-fg-subtle uppercase">
          Completeness
        </span>
        <span className={cn("tabular text-sm font-semibold", tone)}>{pct}%</span>
      </div>
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-sunken"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Spec completeness"
      >
        <div className={cn("h-full rounded-full transition-[width] duration-500", bar)} style={{ width: `${pct}%` }} />
      </div>
      {score.gaps.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {score.gaps.map((gap) => (
            <li
              key={gap}
              className="rounded-sm border border-warning/25 bg-warning-bg px-2.5 py-1.5 text-2xs text-warning"
            >
              Still missing: {gap}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SpecView({ content }: { content: Content }) {
  const requirements = list<Requirement>(content, "requirements");
  const criteria = list<GateCriterion>(content, "gate_criteria");
  const rules = list<MachineRule>(content, "rules");
  const evidence = list<EvidenceLink>(content, "evidence");
  const evidenceFor = new Map(evidence.map((e) => [e.requirement_id, e.evidence]));

  return (
    <div className="flex flex-col gap-5">
      <CompletenessMeter content={content} />

      {criteria.length > 0 && (
        <Section title="Gate criteria" count={criteria.length}>
          <ul className="divide-y divide-line-subtle">
            {criteria.map((c) => (
              <Row key={c.id} id={c.id}>
                {c.description}
              </Row>
            ))}
          </ul>
        </Section>
      )}

      {requirements.length > 0 && (
        <Section title="Requirements" count={requirements.length}>
          <ul className="divide-y divide-line-subtle">
            {requirements.map((r) => (
              <Row key={r.id} id={r.id}>
                {r.description}
                {evidenceFor.has(r.id) && (
                  // the citation is the reason a reviewer can trust the requirement,
                  // so it belongs next to it rather than in a section of its own
                  <span className="mt-1 block text-2xs text-fg-subtle italic">
                    {evidenceFor.get(r.id)}
                  </span>
                )}
              </Row>
            ))}
          </ul>
        </Section>
      )}

      {rules.length > 0 && (
        <Section title="Machine-readable rules" count={rules.length}>
          <ul className="divide-y divide-line-subtle">
            {rules.map((rule) => (
              <Row key={rule.criterion_id} id={rule.criterion_id}>
                <code className="font-mono text-2xs">{rule.rule}</code>
              </Row>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

export function BlueprintView({ content }: { content: Content }) {
  const units = list<UnitOfWork>(content, "units_of_work");
  const summary = str(content, "architecture_summary");
  const titleOf = new Map(units.map((u) => [u.id, u.title]));

  return (
    <div className="flex flex-col gap-5">
      {summary && (
        <Section title="Architecture">
          <p className="text-xs leading-relaxed text-fg">{summary}</p>
        </Section>
      )}

      {units.length > 0 && (
        <Section title="Units of work" count={units.length}>
          <ol className="flex flex-col gap-2">
            {units.map((unit) => (
              <li key={unit.id} className="rounded-sm border border-line-subtle bg-surface p-3">
                <div className="flex items-baseline gap-2">
                  <code className="tabular shrink-0 rounded-sm bg-sunken px-1 py-0.5 font-mono text-2xs text-fg-muted">
                    {unit.id}
                  </code>
                  <h4 className="text-xs font-medium text-fg">{unit.title}</h4>
                </div>
                <p className="mt-1.5 text-2xs leading-relaxed text-fg-muted">
                  {unit.description}
                </p>
                {unit.depends_on.length > 0 && (
                  // dependencies are modeled but were previously invisible - without
                  // them the list reads as unordered work rather than a plan
                  <p className="mt-2 flex flex-wrap items-center gap-1 text-2xs text-fg-subtle">
                    <span>Needs</span>
                    {unit.depends_on.map((dep) => (
                      <span
                        key={dep}
                        title={titleOf.get(dep) ?? dep}
                        className="tabular rounded-sm bg-sunken px-1 py-0.5 font-mono text-fg-muted"
                      >
                        {dep}
                      </span>
                    ))}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </Section>
      )}
    </div>
  );
}

const SEVERITY_TONE: Record<Severity, "danger" | "warning" | "neutral"> = {
  blocker: "danger",
  major: "warning",
  minor: "neutral",
};

export function ReviewView({ content }: { content: Content }) {
  const findings = list<Finding>(content, "findings")
    .filter((f) => isSeverity(f.severity))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  const coverage = list<Coverage>(content, "coverage");
  const met = coverage.filter((c) => c.met).length;

  return (
    <div className="flex flex-col gap-5">
      {coverage.length > 0 && (
        <Section title="Requirement coverage">
          <p className="mb-2 text-xs text-fg-muted">
            <span className="tabular font-semibold text-fg">
              {met}/{coverage.length}
            </span>{" "}
            requirements met
          </p>
          <ul className="flex flex-col gap-0.5">
            {coverage.map((c) => (
              <li
                key={c.requirement_id}
                className="flex items-center gap-2 rounded-sm px-1.5 py-1 text-xs odd:bg-sunken/60"
              >
                {c.met ? (
                  <CheckIcon weight="bold" className="size-3.5 shrink-0 text-success" />
                ) : (
                  <XIcon weight="bold" className="size-3.5 shrink-0 text-danger" />
                )}
                <code className="tabular font-mono text-2xs text-fg-muted">
                  {c.requirement_id}
                </code>
                <span className="ml-auto text-2xs text-fg-subtle">
                  {c.met ? "met" : "not met"}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {findings.length > 0 && (
        <Section title="Findings" count={findings.length}>
          <ul className="flex flex-col gap-2">
            {findings.map((f) => (
              <li key={f.id} className="rounded-sm border border-line-subtle bg-surface p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge tone={SEVERITY_TONE[f.severity]}>{f.severity}</Badge>
                  <code className="tabular font-mono text-2xs text-fg-subtle">{f.id}</code>
                </div>
                <p className="text-xs leading-relaxed text-fg">{f.description}</p>
                {(f.requirement_id ?? f.unit_id) && (
                  <p className="mt-1.5 flex gap-2 text-2xs text-fg-subtle">
                    {f.requirement_id && <span>violates {f.requirement_id}</span>}
                    {f.unit_id && <span>in {f.unit_id}</span>}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

export function DemoView({ content }: { content: Content }) {
  const summary = str(content, "summary");
  const talkTrack = list<TalkTrackSection>(content, "talk_track");
  const seeds = list<DemoSeed>(content, "demo_data");

  return (
    <div className="flex flex-col gap-5">
      {summary && (
        <Section title="Summary">
          <p className="text-xs leading-relaxed text-fg">{summary}</p>
        </Section>
      )}

      {talkTrack.length > 0 && (
        <Section title="Talk track" count={talkTrack.length}>
          <ol className="flex flex-col gap-3">
            {talkTrack.map((section, i) => (
              <li key={section.requirement_id} className="flex gap-3">
                <span className="tabular mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-showroom-bg text-2xs font-semibold text-showroom">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <code className="tabular font-mono text-2xs text-fg-subtle">
                    {section.requirement_id}
                  </code>
                  <p className="mt-0.5 text-xs leading-relaxed text-fg">{section.narration}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {seeds.length > 0 && (
        <Section title="Seed data" count={seeds.length}>
          <ul className="divide-y divide-line-subtle">
            {seeds.map((seed) => (
              <Row key={seed.entity} id={seed.entity}>
                {seed.description}
              </Row>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

/** Fallback for an agent we have no renderer for, or an artifact that does not match
 * its model. Better than pretending the generic field walk is a designed view. */
export function GenericView({ content }: { content: Content }) {
  return (
    <pre className="overflow-auto rounded-sm border border-line-subtle bg-sunken p-3 font-mono text-2xs whitespace-pre-wrap text-fg-muted">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}
