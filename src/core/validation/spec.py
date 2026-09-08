"""G1 gate: scores a persisted StructuredSpec on its own referential integrity."""

from collections import Counter

from core.domain.project import CompletenessScore
from core.domain.spec import StructuredSpec
from core.validation.graph import duplicate_id_issues

# The four per-requirement coverage facets a spec is scored on, each mapped to a noun for
# referential-integrity text ("<noun> references unknown requirement ...") and a phrase for
# gap text ("requirement ... has no <phrase>"). Shared with tools.distill so the in-loop
# tool and this gate can never disagree on wording.
COVERAGE_NOUNS: dict[str, str] = {
    "evidence_requirement_ids": "evidence",
    "acceptance_criterion_requirement_ids": "acceptance criterion",
    "business_value_requirement_ids": "business value",
    "intent_requirement_ids": "intent classification",
}
COVERAGE_GAP_PHRASES: dict[str, str] = {
    "evidence_requirement_ids": "linked evidence",
    "acceptance_criterion_requirement_ids": "acceptance criterion",
    "business_value_requirement_ids": "business value (use case/ROI)",
    "intent_requirement_ids": "intent classification",
}

_EMPTY_SPEC_GAP = (
    "no requirements or gate criteria were extracted - the source document may be "
    "missing, unreadable, or empty; ask for the FSD content, a Confluence page id, a "
    "Jira issue key, or an S3 key"
)


def evaluate_spec(spec: StructuredSpec) -> CompletenessScore:
    """Score a StructuredSpec against itself: are all its own cross-references sound?

    Counts one coverable unit per requirement per facet in `COVERAGE_GAP_PHRASES`, plus
    one per gate criterion that needs a machine-readable rule. Referential-integrity
    problems are reported as gaps too, so a spec that cites ids it never declared cannot
    reach a clean score.
    """
    requirement_ids = [r.id for r in spec.requirements]
    known_requirements = set(requirement_ids)
    criterion_ids = [c.id for c in spec.gate_criteria]
    known_criteria = set(criterion_ids)
    rule_ids = [r.id for r in spec.rules]
    known_rules = set(rule_ids)

    coverage: dict[str, set[str]] = {
        "evidence_requirement_ids": {e.requirement_id for e in spec.evidence},
        "acceptance_criterion_requirement_ids": {
            a.requirement_id for a in spec.acceptance_criteria
        },
        "business_value_requirement_ids": {b.requirement_id for b in spec.business_value},
        "intent_requirement_ids": {i.requirement_id for i in spec.intents},
    }

    gaps = [
        f"missing required FSD section: {section}" for section in spec.missing_required_sections
    ]
    gaps += duplicate_id_issues("requirement", requirement_ids)
    gaps += duplicate_id_issues("gate criterion", criterion_ids)
    gaps += duplicate_id_issues("rule", rule_ids)
    gaps += [
        f"rule {r.id} references unknown gate criterion {r.criterion_id}"
        for r in spec.rules
        if r.criterion_id not in known_criteria
    ]
    gaps += [
        f"rule correlation {c.id} references unknown rule {rule_id}"
        for c in spec.rule_correlations
        for rule_id in c.rule_ids
        if rule_id not in known_rules
    ]
    gaps += [
        f"rule correlation {c.id} correlates fewer than two rules"
        for c in spec.rule_correlations
        if len(set(c.rule_ids)) < 2  # noqa: PLR2004  # a correlation of one is not a correlation
    ]
    gaps += [
        f"{COVERAGE_NOUNS[key]} references unknown requirement {rid}"
        for key, ids in coverage.items()
        for rid in sorted(ids - known_requirements)
    ]
    gaps += [
        f"requirement {rid} has more than one intent classification"
        for rid, count in sorted(Counter(i.requirement_id for i in spec.intents).items())
        if count > 1
    ]
    gaps += _evidence_source_gaps(spec, known_requirements)

    covered = 0
    for key, phrase in COVERAGE_GAP_PHRASES.items():
        missing = sorted(known_requirements - coverage[key])
        covered += len(known_requirements) - len(missing)
        gaps += [f"requirement {rid} has no {phrase}" for rid in missing]

    ruled_criteria = {r.criterion_id for r in spec.rules} & known_criteria
    covered += len(ruled_criteria)
    gaps += [
        f"gate criterion {cid} has no machine-readable rule"
        for cid in sorted(known_criteria - ruled_criteria)
    ]

    total = len(known_requirements) * len(COVERAGE_GAP_PHRASES) + len(known_criteria)
    if total == 0:
        return CompletenessScore(score=0.0, gaps=[_EMPTY_SPEC_GAP])
    return CompletenessScore(score=round(covered / total, 2), gaps=gaps)


def _evidence_source_gaps(spec: StructuredSpec, known_requirements: set[str]) -> list[str]:
    """Flag a requirement that rests only on material from somewhere other than this ask.

    Distill reads past FSDs to learn how this team writes requirements, which is useful
    grounding and a bad citation: a requirement cited only to another project's document
    was inferred, not asked for.
    """
    sources: dict[str, set[str]] = {}
    for link in spec.evidence:
        sources.setdefault(link.requirement_id, set()).add(link.source)
    return [
        (
            f"requirement {rid} is cited only to reference material - cite the ask it came "
            f"from, or ask whoever requested it"
        )
        for rid in sorted(known_requirements)
        if sources.get(rid) == {"reference_material"}
    ]
