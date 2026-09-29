import { useEffect, useState, type ReactNode } from "react";
import {
  ChatCircleTextIcon,
  CheckIcon,
  FileTextIcon,
  LinkSimpleIcon,
  QuotesIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/cn";
import { Markdown } from "../../lib/markdown";
import { buildOrder, EVIDENCE_LABEL, INTENT_LABEL, SEVERITY_LABEL } from "../../lib/plainLabels";
import type { ViewMode } from "../../store/useProjectsStore";
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

const INTENT_TONE: Record<RequirementIntentKind, "info" | "neutral" | "warning"> = {
  functional: "neutral",
  non_functional: "neutral",
  integration: "info",
  reporting: "info",
  compliance: "warning",
  data_migration: "warning",
};

const FILE_CHANGE_TONE: Record<FileChange, "success" | "neutral" | "warning"> = {
  add: "success",
  modify: "neutral",
  delete: "warning",
};

// A citation to the submitted document can be re-read; an answer given in chat is only
// as good as who gave it; reference material is a different project's document.
const EVIDENCE_TONE: Record<EvidenceSource, "neutral" | "info" | "warning"> = {
  source_document: "neutral",
  stakeholder_answer: "info",
  reference_material: "warning",
};

/** The id a section is linked by - `?section=` in the URL, and the contents bar. */
function sectionId(title: string): string {
  return `sec-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function sectionLink(id: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set("section", id);
  return url.toString();
}

export function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  const id = sectionId(title);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <section
      id={id}
      data-section-title={title}
      data-section-count={count}
      className="group/section scroll-mt-14 border-t border-line-subtle pt-4 first:border-0 first:pt-0"
    >
      <h3 className="mb-2 flex items-center gap-1.5 text-2xs font-semibold tracking-wide text-fg-subtle uppercase">
        {title}
        {count !== undefined && <span className="tabular font-normal">{count}</span>}
        <button
          type="button"
          onClick={() =>
            void navigator.clipboard.writeText(sectionLink(id)).then(
              () => setCopied(true),
              () => undefined,
            )
          }
          aria-label={copied ? `Link to ${title} copied` : `Copy link to ${title}`}
          className={cn(
            "hit-area ml-1 flex items-center gap-1 rounded-sm px-1 py-0.5 font-normal tracking-normal normal-case transition-opacity focus-visible:opacity-100 group-hover/section:opacity-100",
            copied ? "text-success opacity-100" : "text-fg-subtle opacity-0 hover:text-fg",
          )}
        >
          {copied ? <CheckIcon weight="bold" className="size-3" /> : <LinkSimpleIcon className="size-3" />}
          {copied && "Copied"}
        </button>
      </h3>
      {children}
    </section>
  );
}

/** Status chips that re-sort a long list in place (Beautiful UI Filter Table). Shown only
 * once a list is long enough to need it - on a short one they are noise. */
function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; count: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="mb-3 flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-medium transition-colors",
            value === option.value
              ? "border-fg bg-fg text-canvas"
              : "border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg",
          )}
        >
          {option.label}
          <span className="tabular opacity-70">{option.count}</span>
        </button>
      ))}
    </div>
  );
}

const FILTER_AT = 8;

const EVIDENCE_ICON: Record<EvidenceSource, ReactNode> = {
  source_document: <FileTextIcon className="size-3 shrink-0" />,
  stakeholder_answer: <ChatCircleTextIcon className="size-3 shrink-0" />,
  reference_material: <QuotesIcon className="size-3 shrink-0" />,
};

/** A requirement's sources as chips; each opens the excerpt it rests on as a context card
 * (Beautiful UI Context Cards) - the source two clicks from the requirement, never more. */
function Citations({ citations }: { citations: EvidenceLink[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (citations.length === 0) return null;
  const shown = open === null ? undefined : citations[open];
  const source = shown?.source ?? "source_document";
  return (
    <div className="mt-1.5">
      <div className="flex flex-wrap gap-1">
        {citations.map((citation, index) => {
          const kind = citation.source ?? "source_document";
          return (
            <button
              key={`${kind}-${index}`}
              type="button"
              aria-expanded={open === index}
              onClick={() => setOpen(open === index ? null : index)}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs transition-colors",
                open === index
                  ? "border-fg-muted bg-sunken text-fg"
                  : "border-line-subtle bg-surface text-fg-muted hover:border-line-strong hover:text-fg",
              )}
            >
              {EVIDENCE_ICON[kind]}
              {EVIDENCE_LABEL[kind]}
            </button>
          );
        })}
      </div>
      {shown && (
        <figure className="mt-1.5 animate-fade rounded-sm border border-line-subtle bg-canvas">
          <figcaption className="flex items-center justify-between gap-2 border-b border-line-subtle px-2.5 py-1.5 text-2xs text-fg-subtle">
            <span className="font-medium text-fg-muted">Excerpt</span>
            <span className="tabular">{shown.evidence.length.toLocaleString()} characters</span>
          </figcaption>
          <blockquote className="px-2.5 py-2 text-xs leading-relaxed text-fg">{shown.evidence}</blockquote>
          <p className="flex items-center gap-1.5 border-t border-line-subtle px-2.5 py-1.5 text-2xs text-fg-muted">
            <Badge tone={EVIDENCE_TONE[source]} icon={EVIDENCE_ICON[source]}>
              {EVIDENCE_LABEL[source]}
            </Badge>
          </p>
        </figure>
      )}
    </div>
  );
}

function Row({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2 py-1.5 text-sm leading-relaxed text-fg">
      {id && (
        <code className="tabular mt-px shrink-0 self-start rounded-sm bg-sunken px-1 py-0.5 font-mono text-2xs text-fg-muted">
          {id}
        </code>
      )}
      <span className="min-w-0">{children}</span>
    </li>
  );
}

const REQUIRED_SECTION_GAP_PREFIX = "missing required FSD section: ";

function missingRequiredSections(content: Content, gaps: string[]): string[] {
  const fromField = content.missing_required_sections;
  if (Array.isArray(fromField) && fromField.every((section) => typeof section === "string")) {
    return fromField;
  }
  return gaps
    .filter((gap) => gap.startsWith(REQUIRED_SECTION_GAP_PREFIX))
    .map((gap) => gap.slice(REQUIRED_SECTION_GAP_PREFIX.length));
}

function nonSectionGaps(gaps: string[]): string[] {
  return gaps.filter((gap) => !gap.startsWith(REQUIRED_SECTION_GAP_PREFIX));
}

/** What stops the brief being complete, in words - the percentage itself is the ring on the
 * document's cover, so it is not repeated here. */
export function CompletenessMeter({ content }: { content: Content }) {
  const score = completeness(content);
  if (!score) return null;
  const missingSections = missingRequiredSections(content, score.gaps);
  const otherGaps = nonSectionGaps(score.gaps);
  if (missingSections.length === 0 && otherGaps.length === 0 && score.questions.length === 0) return null;

  return (
    <div>
      {missingSections.length > 0 && (
        <p className="overflow-x-auto whitespace-nowrap rounded-sm border border-warning/25 bg-warning-bg px-2.5 py-1.5 text-2xs text-warning">
          Missing required FSD sections: {missingSections.join(", ")}
        </p>
      )}
      {otherGaps.length > 0 && (
        <p className="mt-2 overflow-x-auto whitespace-nowrap rounded-sm border border-warning/25 bg-warning-bg px-2.5 py-1.5 text-2xs text-warning first:mt-0">
          Other gaps: {otherGaps.join("; ")}
        </p>
      )}
      {score.questions.length > 0 && (
        <p className="mt-3 rounded-sm border border-line bg-surface px-2.5 py-1.5 text-2xs text-fg-muted first:mt-0">
          {score.questions.length === 1
            ? "One question is waiting above the message box."
            : `${score.questions.length} questions are waiting above the message box.`}
        </p>
      )}
    </div>
  );
}

export function SpecView({ content, viewMode }: { content: Content; viewMode: ViewMode }) {
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
  const openQuestionList = list<string>(content, "open_questions");
  const [intentFilter, setIntentFilter] = useState<RequirementIntentKind | "all">("all");
  const intentsPresent = [...new Set(intents.map((i) => i.intent))];
  const shownRequirements =
    intentFilter === "all" ? requirements : requirements.filter((r) => intentFor.get(r.id) === intentFilter);

  return (
    <div className="flex flex-col gap-5">
      <CompletenessMeter content={content} />

      {/* PM already sees gate criteria in GateConsole at sign-off - repeating them here
          is developer-only detail, same as the sections below */}
      {criteria.length > 0 && viewMode === "developer" && (
        <Section title="Gate criteria" count={criteria.length}>
          <ul className="divide-y divide-line-subtle">
            {criteria.map((c) => (
              <Row key={c.id} id={c.id}>
                <Markdown text={c.description} />
              </Row>
            ))}
          </ul>
        </Section>
      )}

      {requirements.length > 0 && (
        <Section title="Requirements" count={requirements.length}>
          {requirements.length >= FILTER_AT && intentsPresent.length > 1 && (
            <FilterChips
              label="Show requirements"
              value={intentFilter}
              onChange={setIntentFilter}
              options={[
                { value: "all" as const, label: "All", count: requirements.length },
                ...intentsPresent.map((intent) => ({
                  value: intent,
                  label: INTENT_LABEL[intent],
                  count: requirements.filter((r) => intentFor.get(r.id) === intent).length,
                })),
              ]}
            />
          )}
          <ul className="divide-y divide-line-subtle">
            {shownRequirements.map((r) => {
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
                        {INTENT_LABEL[intent]}
                      </Badge>
                    )}
                  </div>
                  {/* the citation is the reason a reviewer can trust the requirement, so it
                      belongs next to it rather than in a section of its own */}
                  <Citations citations={citations} />
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

      {openQuestionList.length > 0 && (
        <Section title="Open questions" count={openQuestionList.length}>
          <ul className="flex flex-col gap-1.5">
            {openQuestionList.map((question) => (
              <li key={question} className="flex gap-2 text-sm leading-relaxed text-fg">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" />
                {question}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {rules.length > 0 && viewMode === "developer" && (
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

      {correlations.length > 0 && viewMode === "developer" && (
        <Section title="Rule correlations" count={correlations.length}>
          <ul className="flex flex-col gap-2">
            {correlations.map((corr) => (
              <li key={corr.id} className="rounded-sm border border-line-subtle bg-surface p-3">
                <div className="text-2xs leading-relaxed text-fg">
                  <Markdown text={corr.description} />
                </div>
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


export function BlueprintView({ content, viewMode }: { content: Content; viewMode: ViewMode }) {
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
          <div className="text-sm leading-relaxed text-fg">
            <Markdown text={summary} />
          </div>
        </Section>
      )}

      {units.length > 0 && viewMode === "pm" && <BuildOrder units={units} />}

      {components.length > 0 && viewMode === "developer" && (
        <Section title="Components" count={components.length}>
          <ul className="flex flex-col gap-2">
            {components.map((component) => (
              <li key={component.id} className="rounded-sm border border-line-subtle bg-surface p-3">
                <h4 className="text-xs font-medium text-fg">{component.name}</h4>
                <div className="mt-1 text-2xs leading-relaxed text-fg-muted">
                  <Markdown text={component.responsibility} />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {entities.length > 0 && viewMode === "developer" && (
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
                <div className="mt-1 text-2xs leading-relaxed text-fg-muted">
                  <Markdown text={entity.description} />
                </div>
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

      {integrations.length > 0 && viewMode === "developer" && (
        <Section title="Integration points" count={integrations.length}>
          <ul className="flex flex-col gap-2">
            {integrations.map((point) => (
              <li key={point.id} className="rounded-sm border border-line-subtle bg-surface p-3">
                <div className="flex items-baseline gap-2">
                  <h4 className="text-xs font-medium text-fg">{point.system}</h4>
                  <Badge tone="info">{point.direction}</Badge>
                </div>
                <div className="mt-1 text-2xs leading-relaxed text-fg-muted">
                  <Markdown text={point.description} />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {units.length > 0 && viewMode === "developer" && (
        <Section title="Build tasks" count={units.length}>
          <ol className="flex flex-col gap-2">
            {units.map((unit) => (
              <li key={unit.id} className="rounded-sm border border-line-subtle bg-surface p-3">
                <div className="flex items-baseline gap-2">
                  <code className="tabular shrink-0 rounded-sm bg-sunken px-1 py-0.5 font-mono text-2xs text-fg-muted">
                    {unit.id}
                  </code>
                  <h4 className="text-xs font-medium text-fg">{unit.title}</h4>
                </div>
                <div className="mt-1.5 text-2xs leading-relaxed text-fg-muted">
                  <Markdown text={unit.description} />
                </div>
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
                <div className="mt-1.5 text-2xs leading-relaxed text-fg-muted">
                  <Markdown text={contract.summary} />
                </div>
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

/** The plan as a numbered sequence a non-engineer can follow: each task after everything it
 * needs, with the step numbers it waits on rather than internal ids. */
function BuildOrder({ units }: { units: UnitOfWork[] }) {
  const ordered = buildOrder(units);
  const step = new Map(ordered.map((u, i) => [u.id, i + 1]));
  return (
    <Section title="Build order" count={ordered.length}>
      <ol className="flex flex-col">
        {ordered.map((unit, i) => {
          const after = unit.depends_on.flatMap((dep) => step.get(dep) ?? []);
          return (
            <li key={unit.id} className="relative flex gap-3 pb-4 last:pb-0">
              {i < ordered.length - 1 && (
                <span aria-hidden="true" className="absolute top-7 bottom-1 left-3 w-px bg-line-subtle" />
              )}
              <span className="tabular flex size-6 shrink-0 items-center justify-center rounded-full bg-blueprint-bg text-2xs font-semibold text-blueprint">
                {i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-medium text-fg">{unit.title}</p>
                <div className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-fg-muted">
                  <Markdown text={unit.description} />
                </div>
                {after.length > 0 && (
                  <p className="mt-1 text-2xs text-fg-subtle">
                    After step{after.length === 1 ? "" : "s"} {after.join(", ")}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

export function ReviewView({ content, viewMode }: { content: Content; viewMode: ViewMode }) {
  const findings = list<Finding>(content, "findings")
    .filter((f) => isSeverity(f.severity))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  const coverage = list<Coverage>(content, "coverage");
  const met = coverage.filter((c) => c.met).length;
  const assignments = list<CopilotAssignment>(content, "assignments");
  const detailed = viewMode === "developer";
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const shownFindings = severity === "all" ? findings : findings.filter((f) => f.severity === severity);
  const severities = (["blocker", "major", "minor"] as const).filter((s) =>
    findings.some((f) => f.severity === s),
  );

  return (
    <div className="flex flex-col gap-5">
      {coverage.length > 0 && (
        <Section title="Requirement coverage">
          <p className="mb-2 text-sm text-fg-muted">
            <span className="tabular font-semibold text-fg">
              {met} of {coverage.length}
            </span>{" "}
            requirements met
          </p>
          {/* one cell per requirement: the shape of the result before its detail */}
          <div className="mb-3 flex flex-wrap gap-0.5" aria-hidden="true">
            {coverage.map((c) => (
              <span
                key={c.requirement_id}
                title={`${c.requirement_id}: ${c.met ? "met" : "not met"}`}
                className={cn("h-2.5 w-4 rounded-[2px]", c.met ? "bg-success" : "bg-danger")}
              />
            ))}
          </div>
          <ul className="flex flex-col gap-0.5">
            {coverage
              .filter((c) => detailed || !c.met)
              .map((c) => (
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
          {findings.length >= FILTER_AT && severities.length > 1 && (
            <FilterChips
              label="Show findings"
              value={severity}
              onChange={setSeverity}
              options={[
                { value: "all" as const, label: "All", count: findings.length },
                ...severities.map((s) => ({
                  value: s,
                  label: SEVERITY_LABEL[s],
                  count: findings.filter((f) => f.severity === s).length,
                })),
              ]}
            />
          )}
          <ul className="flex flex-col gap-2">
            {shownFindings.map((f) => (
              <li key={f.id} className="rounded-sm border border-line-subtle bg-surface p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge tone={SEVERITY_TONE[f.severity]}>{SEVERITY_LABEL[f.severity]}</Badge>
                  {detailed && <code className="tabular font-mono text-2xs text-fg-subtle">{f.id}</code>}
                </div>
                <div className="text-sm leading-relaxed text-fg">
                  <Markdown text={f.description} />
                </div>
                {(f.requirement_id ?? f.unit_id) && (
                  <p className="mt-1.5 flex gap-2 text-2xs text-fg-subtle">
                    {f.requirement_id && <span>Affects {f.requirement_id}</span>}
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
                {a.note && (
                  <div className="mt-1.5 text-2xs leading-relaxed text-fg-muted">
                    <Markdown text={a.note} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

export function DemoView({ content, viewMode }: { content: Content; viewMode: ViewMode }) {
  const summary = str(content, "summary");
  const talkTrack = list<TalkTrackSection>(content, "talk_track");
  const seeds = list<DemoSeed>(content, "demo_data");

  return (
    <div className="flex flex-col gap-5">
      {summary && (
        <Section title="Summary">
          <div className="text-sm leading-relaxed text-fg">
            <Markdown text={summary} />
          </div>
        </Section>
      )}

      {/* the walkthrough is the demo script itself - hiding it in Simple mode hid the
          document from the people it is written for */}
      {talkTrack.length > 0 && (
        <Section title="Walkthrough" count={talkTrack.length}>
          <ol className="flex flex-col gap-3">
            {talkTrack.map((section, i) => (
              <li key={section.requirement_id} className="flex gap-3">
                <span className="tabular mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-showroom-bg text-2xs font-semibold text-showroom">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  {viewMode === "developer" && (
                    <code className="tabular font-mono text-2xs text-fg-subtle">
                      {section.requirement_id}
                    </code>
                  )}
                  <div className="mt-0.5 text-sm leading-relaxed text-fg">
                    <Markdown text={section.narration} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {seeds.length > 0 && (
        <Section title="Sample data" count={seeds.length}>
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Sample data the demo uses</caption>
            <thead className="text-2xs text-fg-subtle">
              <tr>
                <th scope="col" className="py-1.5 pr-3 font-medium">Data</th>
                <th scope="col" className="py-1.5 font-medium">What it shows</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle border-t border-line-subtle">
              {seeds.map((seed) => (
                <tr key={seed.entity} className="align-top">
                  <th scope="row" className="py-2 pr-3 font-medium whitespace-nowrap text-fg">
                    {seed.entity}
                  </th>
                  <td className="py-2 leading-relaxed text-fg-muted">
                    <Markdown text={seed.description} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
