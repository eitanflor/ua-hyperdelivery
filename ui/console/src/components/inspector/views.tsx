import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/cn";
import {
  completeness,
  isSeverity,
  list,
  SEVERITY_ORDER,
  str,
  type AcceptanceCriterion,
  type ApiContract,
  type BusinessValue,
  type Component,
  type Coverage,
  type CopilotAssignment,
  type DataEntity,
  type DemoSeed,
  type EvidenceLink,
  type EvidenceSource,
  type FileChange,
  type Finding,
  type GateCriterion,
  type IntegrationPoint,
  type MachineRule,
  type Requirement,
  type RequirementIntent,
  type RequirementIntentKind,
  type RuleCorrelation,
  type Severity,
  type TalkTrackSection,
  type UnitOfWork,
} from "../../api/artifacts";

type Content = Record<string, unknown>;

const INTENT_TONE: Record<RequirementIntentKind, "accent" | "info" | "neutral" | "warning"> = {
  functional: "accent",
  non_functional: "neutral",
  integration: "info",
  reporting: "info",
  compliance: "warning",
  data_migration: "warning",
};

const FILE_CHANGE_TONE: Record<FileChange, "accent" | "neutral" | "warning"> = {
  add: "accent",
  modify: "neutral",
  delete: "warning",
};

// A citation to the submitted document can be re-read; an answer given in chat is only
// as good as who gave it; reference material is a different project's document.
const EVIDENCE_LABEL: Record<EvidenceSource, string> = {
  source_document: "cited",
  stakeholder_answer: "answered",
  reference_material: "reference",
};
const EVIDENCE_TONE: Record<EvidenceSource, "neutral" | "info" | "warning"> = {
  source_document: "neutral",
  stakeholder_answer: "info",
  reference_material: "warning",
};


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
      {score.questions.length > 0 && (
        <p className="mt-3 rounded-sm border border-line bg-surface px-2.5 py-1.5 text-2xs text-fg-muted">
          {score.questions.length === 1
            ? "One question is waiting above the message box."
            : `${score.questions.length} questions are waiting above the message box.`}
        </p>
      )}
    </div>
  );
}

export function SpecView({ content }: { content: Content }) {
  const requirements = list<Requirement>(content, "requirements");
  const criteria = list<GateCriterion>(content, "gate_criteria");
  const rules = list<MachineRule>(content, "rules");
  const correlations = list<RuleCorrelation>(content, "rule_correlations");
  const evidence = list<EvidenceLink>(content, "evidence");
  const acceptanceCriteria = list<AcceptanceCriterion>(content, "acceptance_criteria");
  const businessValue = list<BusinessValue>(content, "business_value");
  const intents = list<RequirementIntent>(content, "intents");

  // grouped, not keyed: a requirement is expected to carry several citations, and the
  // G1 gate reasons about the set of their sources - showing one hides why it scored
  const evidenceFor = new Map<string, EvidenceLink[]>();
  for (const e of evidence) {
    evidenceFor.set(e.requirement_id, [...(evidenceFor.get(e.requirement_id) ?? []), e]);
  }
  const intentFor = new Map(intents.map((i) => [i.requirement_id, i.intent]));
  const businessValueFor = new Map(businessValue.map((b) => [b.requirement_id, b]));
  const acceptanceFor = new Map<string, AcceptanceCriterion[]>();
  for (const ac of acceptanceCriteria) {
    acceptanceFor.set(ac.requirement_id, [...(acceptanceFor.get(ac.requirement_id) ?? []), ac]);
  }
  const ruleById = new Map(rules.map((r) => [r.id, r.rule]));

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
            {requirements.map((r) => {
              const value = businessValueFor.get(r.id);
              const acceptance = acceptanceFor.get(r.id) ?? [];
              const citations = evidenceFor.get(r.id) ?? [];
              const intent = intentFor.get(r.id);
              return (
                <Row key={r.id} id={r.id}>
                  <div className="flex items-baseline gap-1.5">
                    <span>{r.description}</span>
                    {intent && (
                      <Badge tone={INTENT_TONE[intent]} className="shrink-0">
                        {intent.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                  {citations.map((citation, index) => (
                    // the citation is the reason a reviewer can trust the requirement,
                    // so it belongs next to it rather than in a section of its own
                    <span
                      key={`${citation.source}-${index}`}
                      className="mt-1 flex items-baseline gap-1.5"
                    >
                      <Badge tone={EVIDENCE_TONE[citation.source ?? "source_document"]}>
                        {EVIDENCE_LABEL[citation.source ?? "source_document"]}
                      </Badge>
                      <span className="text-2xs text-fg-subtle italic">{citation.evidence}</span>
                    </span>
                  ))}
                  {value && (
                    <p className="mt-1.5 text-2xs leading-relaxed text-fg-muted">
                      <span className="font-semibold text-fg-subtle">{value.use_case}</span>
                      {" — "}
                      {value.roi}
                    </p>
                  )}
                  {acceptance.length > 0 && (
                    <ul className="mt-1.5 flex flex-col gap-0.5">
                      {acceptance.map((ac) => (
                        <li
                          key={ac.id}
                          className="flex gap-1.5 text-2xs leading-relaxed text-fg-muted"
                        >
                          <CheckIcon
                            weight="bold"
                            className="mt-0.5 size-3 shrink-0 text-fg-subtle"
                          />
                          {ac.description}
                        </li>
                      ))}
                    </ul>
                  )}
                </Row>
              );
            })}
          </ul>
        </Section>
      )}

      {rules.length > 0 && (
        <Section title="Machine-readable rules" count={rules.length}>
          <ul className="divide-y divide-line-subtle">
            {rules.map((rule) => (
              <Row key={rule.id} id={rule.criterion_id}>
                <code className="font-mono text-2xs">{rule.rule}</code>
              </Row>
            ))}
          </ul>
        </Section>
      )}

      {correlations.length > 0 && (
        <Section title="Rule correlations" count={correlations.length}>
          <ul className="flex flex-col gap-2">
            {correlations.map((corr) => (
              <li key={corr.id} className="rounded-sm border border-line-subtle bg-surface p-3">
                <p className="text-2xs leading-relaxed text-fg">{corr.description}</p>
                <p className="mt-1.5 flex flex-wrap gap-1">
                  {corr.rule_ids.map((ruleId) => (
                    <code
                      key={ruleId}
                      title={ruleById.get(ruleId) ?? ruleId}
                      className="tabular rounded-sm bg-sunken px-1 py-0.5 font-mono text-2xs text-fg-muted"
                    >
                      {ruleId}
                    </code>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}


export function BlueprintView({ content }: { content: Content }) {
  const units = list<UnitOfWork>(content, "units_of_work");
  const contracts = list<ApiContract>(content, "api_contracts");
  const components = list<Component>(content, "components");
  const entities = list<DataEntity>(content, "data_entities");
  const integrations = list<IntegrationPoint>(content, "integration_points");
  const summary = str(content, "architecture_summary");
  const titleOf = new Map(units.map((u) => [u.id, u.title]));
  const componentName = new Map(components.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-5">
      {summary && (
        <Section title="Architecture">
          <p className="text-xs leading-relaxed text-fg">{summary}</p>
        </Section>
      )}

      {components.length > 0 && (
        <Section title="Components" count={components.length}>
          <ul className="flex flex-col gap-2">
            {components.map((component) => (
              <li key={component.id} className="rounded-sm border border-line-subtle bg-surface p-3">
                <h4 className="text-xs font-medium text-fg">{component.name}</h4>
                <p className="mt-1 text-2xs leading-relaxed text-fg-muted">
                  {component.responsibility}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {entities.length > 0 && (
        <Section title="Data model" count={entities.length}>
          <ul className="flex flex-col gap-2">
            {entities.map((entity) => (
              <li key={entity.id} className="rounded-sm border border-line-subtle bg-surface p-3">
                <div className="flex items-baseline gap-2">
                  <h4 className="text-xs font-medium text-fg">{entity.name}</h4>
                  <span className="text-2xs text-fg-subtle">
                    {componentName.get(entity.component_id) ?? entity.component_id}
                  </span>
                </div>
                <p className="mt-1 text-2xs leading-relaxed text-fg-muted">{entity.description}</p>
                {(entity.fields ?? []).length > 0 && (
                  <ul className="mt-2 flex flex-col gap-0.5">
                    {(entity.fields ?? []).map((field) => (
                      <li key={field.name} className="flex items-baseline gap-1.5 text-2xs">
                        <code className="font-mono text-fg-muted">{field.name}</code>
                        <span className="tabular rounded-sm bg-sunken px-1 font-mono text-fg-subtle">
                          {field.type}
                        </span>
                        <span className="text-fg-subtle">{field.description}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {integrations.length > 0 && (
        <Section title="Integration points" count={integrations.length}>
          <ul className="flex flex-col gap-2">
            {integrations.map((point) => (
              <li key={point.id} className="rounded-sm border border-line-subtle bg-surface p-3">
                <div className="flex items-baseline gap-2">
                  <h4 className="text-xs font-medium text-fg">{point.system}</h4>
                  <Badge tone="info">{point.direction}</Badge>
                </div>
                <p className="mt-1 text-2xs leading-relaxed text-fg-muted">{point.description}</p>
              </li>
            ))}
          </ul>
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
                {(unit.requirement_ids ?? []).length > 0 && (
                  // the edges the G2 gate scores coverage from - a unit with none of
                  // these counts as covering nothing, however good its description reads
                  <p className="mt-2 flex flex-wrap items-center gap-1 text-2xs text-fg-subtle">
                    <span>Covers</span>
                    {(unit.requirement_ids ?? []).map((rid) => (
                      <span
                        key={rid}
                        className="tabular rounded-sm bg-sunken px-1 py-0.5 font-mono text-fg-muted"
                      >
                        {rid}
                      </span>
                    ))}
                    {(unit.acceptance_criterion_ids ?? []).map((cid) => (
                      <span
                        key={cid}
                        className="tabular rounded-sm bg-sunken px-1 py-0.5 font-mono text-fg-subtle"
                      >
                        {cid}
                      </span>
                    ))}
                  </p>
                )}
                {(unit.files ?? []).length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {(unit.files ?? []).map((file) => (
                      <li key={file.path} className="flex items-baseline gap-1.5 text-2xs">
                        <Badge tone={FILE_CHANGE_TONE[file.change]}>{file.change}</Badge>
                        <code className="font-mono text-fg-muted">{file.path}</code>
                        <span className="text-fg-subtle">{file.purpose}</span>
                      </li>
                    ))}
                  </ul>
                )}
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

      {contracts.length > 0 && (
        <Section title="API contracts" count={contracts.length}>
          <ul className="flex flex-col gap-2">
            {contracts.map((contract) => (
              <li
                key={contract.id}
                className="rounded-sm border border-line-subtle bg-surface p-3"
              >
                <div className="flex items-baseline gap-2">
                  <Badge tone="info">{contract.method}</Badge>
                  <code className="font-mono text-xs text-fg">{contract.path}</code>
                </div>
                <p className="mt-1.5 text-2xs leading-relaxed text-fg-muted">
                  {contract.summary}
                </p>
                {contract.request_schema && (
                  <p className="mt-1 text-2xs text-fg-subtle">
                    <span className="text-fg-muted">Request</span> {contract.request_schema}
                  </p>
                )}
                {contract.response_schema && (
                  <p className="mt-1 text-2xs text-fg-subtle">
                    <span className="text-fg-muted">Response</span> {contract.response_schema}
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
  const assignments = list<CopilotAssignment>(content, "assignments");

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

      {assignments.length > 0 && (
        // Only present when Review was explicitly asked to hand findings off to
        // Copilot - not part of every ReviewReport, see core/domain/review.py.
        <Section title="Copilot assignments" count={assignments.length}>
          <ul className="flex flex-col gap-2">
            {assignments.map((a) => (
              <li key={a.finding_id} className="rounded-sm border border-line-subtle bg-surface p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge tone={a.assigned ? "success" : "danger"}>
                    {a.assigned ? "assigned" : "failed"}
                  </Badge>
                  <code className="tabular font-mono text-2xs text-fg-subtle">{a.finding_id}</code>
                  {a.created_new_issue && (
                    <span className="text-2xs text-fg-subtle">new issue</span>
                  )}
                  {a.pull_request_number != null && (
                    <span className="text-2xs text-fg-subtle">commented on open PR</span>
                  )}
                </div>
                {a.issue_url ? (
                  <a
                    href={a.issue_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent-text underline underline-offset-2"
                  >
                    {a.issue_url}
                  </a>
                ) : (
                  <span className="tabular text-xs text-fg-muted">issue #{a.issue_number}</span>
                )}
                {a.pull_request_number != null && (
                  <span className="ml-2 tabular text-xs text-fg-muted">PR #{a.pull_request_number}</span>
                )}
                {a.note && <p className="mt-1.5 text-2xs leading-relaxed text-fg-muted">{a.note}</p>}
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
