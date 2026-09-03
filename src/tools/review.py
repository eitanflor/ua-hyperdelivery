"""Review's deterministic validator: checks findings and coverage against the spec."""

from collections import Counter
from typing import Any

from strands import tool

_VALID_SEVERITIES = {"blocker", "major", "minor"}
_ASSIGNABLE_SEVERITIES = {"blocker", "major"}


@tool
def validate_review_report(
    requirement_ids: list[str],
    finding_requirement_ids: list[str],
    finding_severities: list[str],
    coverage_requirement_ids: list[str],
) -> dict[str, Any]:
    """Deterministically validate a ReviewReport draft.

    Every finding that references a requirement must reference a known id with a valid
    severity ("blocker", "major", or "minor"), and the coverage view must have exactly one
    entry per known requirement - no fewer, no extras. Call this with the ids/severities
    you drafted before finalizing the report - do not eyeball it.
    """
    known = set(requirement_ids)
    issues = [
        f"finding references unknown requirement {rid}"
        for rid in finding_requirement_ids
        if rid not in known
    ]
    issues += [
        f"finding has invalid severity {sev!r}"
        for sev in finding_severities
        if sev not in _VALID_SEVERITIES
    ]
    missing = sorted(known - set(coverage_requirement_ids))
    extra = sorted(set(coverage_requirement_ids) - known)
    issues += [f"requirement {r} missing from coverage view" for r in missing]
    issues += [f"coverage view references unknown requirement {r}" for r in extra]
    return {"valid": not issues, "issues": issues}


@tool
def score_review_completeness(requirement_ids: list[str]) -> dict[str, Any]:
    """Deterministically flag whether Review actually had a spec and build to check.

    Returns 0.0 with a gap naming what to ask for if no requirement ids were found in
    the input at all - meaning no approved spec/Blueprint or description of the built
    deliverable was actually given. Otherwise returns 1.0, since
    `validate_review_report` already enforces full coverage of whatever ids were found.
    Call this with the requirement ids you found before finalizing the `completeness`
    field - do not estimate the score yourself.
    """
    if not requirement_ids:
        gaps = [
            (
                "no approved spec, Blueprint, or description of the built deliverable was "
                "provided - ask for them before producing findings"
            )
        ]
        return {"score": 0.0, "gaps": gaps}
    return {"score": 1.0, "gaps": []}


@tool
def validate_copilot_assignments(
    finding_ids: list[str],
    finding_severities: list[str],
    assignment_finding_ids: list[str],
) -> dict[str, Any]:
    """Deterministically validate a ReviewReport's `assignments` against its findings.

    Only call this when the user has explicitly asked you to hand findings off to
    GitHub Copilot's coding agent - otherwise `assignments` should stay empty and this
    tool is not needed. Every blocker/major finding id must have exactly one assignment
    entry, and every assignment must reference a known finding id - minor findings are
    not assignable and must not appear. Call this with the finding ids/severities you
    drafted and the finding ids your assignments reference before finalizing the
    report - do not eyeball it.
    """
    if len(finding_ids) != len(finding_severities):
        issue = (
            f"finding_ids has {len(finding_ids)} entries but finding_severities has "
            f"{len(finding_severities)} - each finding needs exactly one severity"
        )
        return {"valid": False, "issues": [issue]}

    known = set(finding_ids)
    assignable = {
        fid
        for fid, severity in zip(finding_ids, finding_severities, strict=True)
        if severity in _ASSIGNABLE_SEVERITIES
    }
    assignment_counts = Counter(assignment_finding_ids)
    issues = [
        f"assignment references unknown finding {fid}"
        for fid in assignment_counts
        if fid not in known
    ]
    issues += [
        f"assignment references non-assignable finding {fid}"
        for fid in assignment_counts
        if fid in known and fid not in assignable
    ]
    issues += [
        f"blocker/major finding {fid} has {count} assignments, expected exactly one"
        for fid, count in assignment_counts.items()
        if fid in assignable and count != 1
    ]
    missing = sorted(assignable - set(assignment_finding_ids))
    issues += [f"blocker/major finding {fid} has no assignment" for fid in missing]
    return {"valid": not issues, "issues": issues}
