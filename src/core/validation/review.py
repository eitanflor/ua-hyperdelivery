"""G3 gate: scores a persisted ReviewReport against the spec and blueprint it checked."""

from collections import Counter

from core.domain.blueprint import Blueprint
from core.domain.project import CompletenessScore
from core.domain.review import ReviewReport
from core.domain.spec import StructuredSpec
from core.validation.graph import duplicate_id_issues

_ASSIGNABLE_SEVERITIES = {"blocker", "major"}
_NO_SPEC_GAP = (
    "no approved spec was available to check this review against - ask for the approved "
    "spec, the Blueprint, and a description of the built deliverable before producing findings"
)
_EMPTY_SPEC_GAP = "the approved spec has no requirements to review the deliverable against"


def evaluate_review(
    spec: StructuredSpec | None, blueprint: Blueprint | None, report: ReviewReport
) -> CompletenessScore:
    """Score a ReviewReport on how much of the spec it actually returned a verdict on.

    A requirement counts as reviewed when the coverage view holds exactly one entry for
    it - `met=False` is a complete review of an unmet requirement, not a gap, so a
    failing build still scores 1.0 and reaches its gate with the bad news intact.
    Assignments are checked for internal consistency only: their absence is legitimate
    when GitHub tools were unavailable, which this gate cannot observe.
    """
    if spec is None:
        return CompletenessScore(score=0.0, gaps=[_NO_SPEC_GAP])

    known_requirements = {r.id for r in spec.requirements}
    known_units = {u.id for u in blueprint.units_of_work} if blueprint is not None else set[str]()
    finding_severity = {f.id: f.severity for f in report.findings}

    gaps = duplicate_id_issues("finding", [f.id for f in report.findings])
    gaps += [
        f"finding {f.id} references unknown requirement {f.requirement_id}"
        for f in report.findings
        if f.requirement_id is not None and f.requirement_id not in known_requirements
    ]
    gaps += [
        f"finding {f.id} references unknown unit of work {f.unit_id}"
        for f in report.findings
        if blueprint is not None and f.unit_id is not None and f.unit_id not in known_units
    ]

    coverage_counts = Counter(c.requirement_id for c in report.coverage)
    gaps += [
        f"coverage view references unknown requirement {rid}"
        for rid in sorted(coverage_counts.keys() - known_requirements)
    ]
    gaps += [
        f"requirement {rid} has {count} coverage entries, expected exactly one"
        for rid, count in sorted(coverage_counts.items())
        if count > 1 and rid in known_requirements
    ]

    assignment_counts = Counter(a.finding_id for a in report.assignments)
    gaps += [
        f"assignment references unknown finding {fid}"
        for fid in sorted(assignment_counts.keys() - finding_severity.keys())
    ]
    gaps += [
        f"assignment references {finding_severity[fid]} finding {fid}, which is not assignable"
        for fid in sorted(assignment_counts)
        if fid in finding_severity and finding_severity[fid] not in _ASSIGNABLE_SEVERITIES
    ]
    gaps += [
        f"finding {fid} has {count} assignments, expected exactly one"
        for fid, count in sorted(assignment_counts.items())
        if count > 1
    ]

    reviewed = {rid for rid, count in coverage_counts.items() if count == 1} & known_requirements
    gaps += [
        f"requirement {rid} has no coverage entry saying whether the build meets it"
        for rid in sorted(known_requirements - reviewed)
    ]

    if not known_requirements:
        return CompletenessScore(score=0.0, gaps=[_EMPTY_SPEC_GAP])
    return CompletenessScore(score=round(len(reviewed) / len(known_requirements), 2), gaps=gaps)
