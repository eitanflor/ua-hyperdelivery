"""Distill's deterministic validators: checks referential integrity and scores coverage."""

from typing import Any

from strands import tool


@tool
def validate_structured_spec(
    requirement_ids: list[str],
    gate_criteria_ids: list[str],
    rule_criteria_ids: list[str],
    evidence_requirement_ids: list[str],
) -> dict[str, Any]:
    """Deterministically validate a StructuredSpec draft's referential integrity.

    Flags a duplicate requirement or gate criterion id, any rule whose `criterion_id`
    isn't one of the drafted gate criteria, and any evidence link whose
    `requirement_id` isn't one of the drafted requirements. Call this with the ids you
    drafted before finalizing - if it reports any issues, fix them and call it again
    until it reports none.
    """
    issues: list[str] = []
    seen_requirements: set[str] = set()
    for rid in requirement_ids:
        if rid in seen_requirements:
            issues.append(f"duplicate requirement id {rid}")
        seen_requirements.add(rid)

    seen_criteria: set[str] = set()
    for cid in gate_criteria_ids:
        if cid in seen_criteria:
            issues.append(f"duplicate gate criterion id {cid}")
        seen_criteria.add(cid)

    issues += [
        f"rule references unknown gate criterion {cid}"
        for cid in rule_criteria_ids
        if cid not in seen_criteria
    ]
    issues += [
        f"evidence references unknown requirement {rid}"
        for rid in evidence_requirement_ids
        if rid not in seen_requirements
    ]
    return {"valid": not issues, "issues": issues}


@tool
def score_completeness(
    requirement_ids: list[str],
    evidence_requirement_ids: list[str],
    criteria_ids: list[str],
    rule_criteria_ids: list[str],
) -> dict[str, Any]:
    """Deterministically score a StructuredSpec draft.

    Returns the fraction of requirements that have linked evidence and gate criteria that
    have a machine-readable rule, with any uncovered ids reported as gaps. Returns 0.0
    with a gap naming what to ask for if no requirement or gate criteria ids were drafted
    at all - meaning the input was missing, unreadable, or empty. Call this with the ids
    you drafted before finalizing the `completeness` field - do not estimate the score
    yourself.
    """
    missing_evidence = sorted(set(requirement_ids) - set(evidence_requirement_ids))
    missing_rules = sorted(set(criteria_ids) - set(rule_criteria_ids))
    gaps = [f"requirement {r} has no linked evidence" for r in missing_evidence]
    gaps += [f"gate criterion {c} has no machine-readable rule" for c in missing_rules]

    total = len(requirement_ids) + len(criteria_ids)
    if total == 0:
        gaps = [
            (
                "no requirements or gate criteria were extracted - the source document "
                "may be missing, unreadable, or empty; ask for the FSD content, a "
                "Confluence page id, a Jira issue key, or an S3 key"
            )
        ]
        return {"score": 0.0, "gaps": gaps}
    covered_requirements = len(requirement_ids) - len(missing_evidence)
    covered_criteria = len(criteria_ids) - len(missing_rules)
    covered = covered_requirements + covered_criteria
    return {"score": round(covered / total, 2), "gaps": gaps}
