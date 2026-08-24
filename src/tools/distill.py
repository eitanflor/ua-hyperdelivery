from strands import tool


@tool
def score_completeness(
    requirement_ids: list[str],
    evidence_requirement_ids: list[str],
    criteria_ids: list[str],
    rule_criteria_ids: list[str],
) -> dict:
    """Deterministically score a StructuredSpec draft: the fraction of requirements that
    have linked evidence and gate criteria that have a machine-readable rule, with any
    uncovered ids reported as gaps. Call this with the ids you drafted before finalizing
    the `completeness` field - do not estimate the score yourself."""
    missing_evidence = sorted(set(requirement_ids) - set(evidence_requirement_ids))
    missing_rules = sorted(set(criteria_ids) - set(rule_criteria_ids))
    gaps = [f"requirement {r} has no linked evidence" for r in missing_evidence]
    gaps += [f"gate criterion {c} has no machine-readable rule" for c in missing_rules]

    total = len(requirement_ids) + len(criteria_ids)
    if total == 0:
        return {"score": 0.0, "gaps": gaps}
    covered_requirements = len(requirement_ids) - len(missing_evidence)
    covered_criteria = len(criteria_ids) - len(missing_rules)
    covered = covered_requirements + covered_criteria
    return {"score": round(covered / total, 2), "gaps": gaps}
